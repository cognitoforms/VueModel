import { Event, EventSubscriber } from "./events";
import { randomText } from "./helpers";
import { EntityConstructor, EntityRegisteredEventArgs, EntityUnregisteredEventArgs, Entity, EntityConstructorForType } from "./entity";
import { Type, PropertyType, isEntityType, ValueType, TypeOptions } from "./type";
import { Rule, RuleOptions } from "./rule";
import { PropertyAddedEventArgs, Property, PropertyOptions } from "./property";
import { PropertyChain } from "./property-chain";
import { PathTokens } from "./path-tokens";
import { Format, createFormat } from "./format";

const valueTypes: { [name: string]: ValueType } = { string: String, number: Number, date: Date, boolean: Boolean };

export class Model {

	readonly types: { [name: string]: Type };

	ready: Promise<void>;

	private _ready: () => void;

	readonly settings: ModelSettings;

	readonly _events: ModelEvents;

	private readonly _formats: { [name: string]: { [name: string]: Format<ValueType> } };

	readonly _fieldNamePrefix: string;

	constructor(createOwnProperties: boolean = undefined, useGlobalObject: boolean = undefined) {

		this.types = {};

		Object.defineProperty(this, "settings", { configurable: false, enumerable: true, value: new ModelSettings(createOwnProperties, useGlobalObject), writable: false });
		Object.defineProperty(this, "_fieldNamePrefix", { value: ("_fN" + randomText(3, false, true)) });
		Object.defineProperty(this, "_events", { value: new ModelEvents() });

		this._formats = {};

		// Indicate that the model is now ready
		this.ready = Promise.resolve();
	}

	get entityRegistered(): EventSubscriber<Model, EntityRegisteredEventArgs> {
		return this._events.entityRegisteredEvent.asEventSubscriber();
	}

	get entityUnregistered(): EventSubscriber<Model, EntityUnregisteredEventArgs> {
		return this._events.entityUnregisteredEvent.asEventSubscriber();
	}

	/**
	 * Extends the model with the specified type information.
	 * @param options The set of model types to add and/or extend.
	 */
	extend(options: ModelOptions) {

		// Use prepare() to defer property path resolution while the model is being extended
		this.prepare(() => {

			// Create New Types
			for (let typeName in options) {
				let typeOptions = options[typeName];
				let type = this.types[typeName];

				if (!type) {
					let baseType = this.types[typeOptions.$extends];
					type = new Type(this, typeName, baseType);
					this.types[typeName] = type;
					delete typeOptions["$extends"];
				}
			}

			// Extend Types
			for (let typeName in options) {
				this.types[typeName].extend(options[typeName]);
			}
		});
	}

	/**
	 * Prepares the model by invoking and extension function, which tracking the model
	 * ready state to allow use of the @ready promise to defer property path resolution.
	 * @param extend The function extending the model
	 */
	prepare(extend: () => void) {

		// Create a model initialization scope
		if (!this._ready) {

			// Create a promise to track that the model is being extended
			let _reject: (reason: any) => void;
			this.ready = new Promise((resolve, reject) => {
				this._ready = resolve;
				_reject = reject;
			});

			// Extend the model
			try {
				extend();
			}
			catch (e) {
				_reject(e);

				return;
			}

			// Complete pending model initialization steps
			this._ready();
			this._ready = null;
		}

		// Leverage the current model initialization scope
		else
			extend();
	}

	/**
	 * Gets the format for the specified property type and format string.
	 * @param type The type the format is for
	 * @param format The format template or specifier
	 */
	getFormat<T>(type: PropertyType, format: string): Format<T> {

		// Return null if a format specifier was not provided
		if (!format) {
			return null;
		}

		// Get the format cache for the type
		let formats = isEntityType(type) ?
			type.meta._formats :
			(this._formats[type.toString()] = (this._formats[type.toString()] || {}));

		// First see if the requested format is cached
		let f = formats[format];
		if (f) {
			return f;
		}

		// Otherwise, create and cache the format
		if (isEntityType(type)) {
			return formats[format] = Format.fromTemplate(type.meta, format);
		} else {
			// otherwise, call the format provider to create a new format
			return formats[format] = createFormat(type, format);
		}
	}

	/**
	 * Gets the javascript property type with the specified name.
	 * @param type
	 */
	getJsType(type: string): PropertyType {
		let jstype = valueTypes[type.toLowerCase()];
		if (!jstype) {
			let modelType = this.types[type];
			return modelType ? modelType.jstype : null;
		}
	}
}


export interface ModelConstructor {
	new(createOwnProperties?: boolean): Model;
}

export class ModelEvents {
	readonly entityRegisteredEvent: Event<Model, EntityRegisteredEventArgs>;
	readonly entityUnregisteredEvent: Event<Model, EntityUnregisteredEventArgs>;
	constructor() {
		this.entityRegisteredEvent = new Event<Model, EntityRegisteredEventArgs>();
		this.entityUnregisteredEvent = new Event<Model, EntityUnregisteredEventArgs>();
	}
}

export interface ModelOptions {

	/** The name of the type. */
	[name: string]: TypeOptions
}

export class ModelSettings {

	// There is a slight speed cost to creating own properties,
	// which may be noticeable with very large object counts.
	readonly createOwnProperties: boolean = false;

	// Don't pollute the window object by default
	readonly useGlobalObject: boolean = false;

	constructor(createOwnProperties: boolean = false, useGlobalObject: boolean = false) {
		Object.defineProperty(this, "createOwnProperties", { configurable: false, enumerable: true, value: createOwnProperties, writable: false });
		Object.defineProperty(this, "useGlobalObject", { configurable: false, enumerable: true, value: useGlobalObject, writable: false });
	}
}

export function getPropertyOrPropertyChain(pathOrTokens: string | PathTokens, type: Type): Property | PropertyChain {

	var path: string = null,
		tokens: PathTokens = null,
		cache: any = (type as any)._cache;

	// Allow the path argument to be either a string or PathTokens instance
	if (pathOrTokens.constructor === PathTokens) {
		tokens = pathOrTokens as PathTokens;
		path = tokens.expression;
	} else if (typeof pathOrTokens === "string") {
		path = pathOrTokens as string;
	} else {
		throw new Error("Invalid valud for argument `pathOrTokens`.");
	}

	// Return a cached property chain if possible
	if (cache && cache[path]) {
		return cache[path];
	}

	// The path argument was a string, so use it to create a PathTokens object
	// NOTE: Delay doing this as an optimization for cached property chains
	if (!tokens) {
		tokens = new PathTokens(path);
	}

	// Determine if a typecast was specified for the path to identify a specific subclass to use as the root type
	if (tokens.steps[0].property === "this" && tokens.steps[0].cast) {
		// Try and resolve cast to an actual type in the model
		type = type.model.types[tokens.steps[0].cast];
		tokens.steps.shift();
	}

	// Optimize for a single property expression, as it is neither static nor a chain
	if (tokens.steps.length === 1) {
		return type.getProperty(tokens.steps[0].property);
	} else {
		try {
			// First, see if the path represents an instance path
			return new PropertyChain(type, tokens);
		} catch {
			// Ignore error since for all we know we're dealing with a static path
		}

		// Next, try to resolve as a global type name and a property name
		var globalTypeName = tokens.steps.slice(0, tokens.steps.length - 1).map(function (item) { return item.property; }).join(".");
		var globalPropertyName = tokens.steps[tokens.steps.length - 1].property;

		// Retrieve the javascript type by name
		let globalType = type.model.types[globalTypeName];
		if (globalType) {
			// Return the static property if found
			var property = globalType.getProperty(globalPropertyName);
			if (property) {
				return property;
			}
		}

		// Throw an error if the path couldn't be resolved as instance or static
		// NOTE: We don't know if this was *supposed* to be an instance or static path
		throw new Error("Path \"" + path + "\" could not be resolved.");
	}
}