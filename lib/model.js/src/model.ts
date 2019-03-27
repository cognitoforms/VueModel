import { Event, EventSubscriber } from "./events";
import { randomText } from "./helpers";
import { EntityRegisteredEventArgs, EntityUnregisteredEventArgs } from "./entity";
import { Type, PropertyType, isEntityType, ValueType, TypeOptions } from "./type";
import { Format, createFormat } from "./format";
import { EntitySerializer } from "./entity-serializer";

const valueTypes: { [name: string]: ValueType } = { string: String, number: Number, date: Date, boolean: Boolean };

export class Model {
	readonly types: { [name: string]: Type };

	readonly settings: ModelSettings;

	readonly fieldNamePrefix: string;

	readonly $namespace: any;
	
	readonly entityRegistered: EventSubscriber<Model, EntityRegisteredEventArgs>;
	readonly entityUnregistered: EventSubscriber<Model, EntityUnregisteredEventArgs>;

	private _ready: (() => void)[];
	private readonly _formats: { [name: string]: { [name: string]: Format<ValueType> } };

	constructor(options?: ModelOptions & ModelNamespaceOption, config?: ModelConfiguration) {
		this.types = {};
		this.settings = new ModelSettings(config);

		this.fieldNamePrefix = "_fN" + randomText(3, false, true);
		
		this.entityRegistered = new Event<Model, EntityRegisteredEventArgs>();
		this.entityUnregistered = new Event<Model, EntityUnregisteredEventArgs>();

		if (options && options.$namespace) {
			let $namespace = options.$namespace;

			try {
				delete options.$namespace;
			}
			catch {
				// Ignore error, we'll ignore the property later
			}

			Object.defineProperty(this, "$namespace", { configurable: false, enumerable: true, value: $namespace, writable: false });
		}

		this._formats = {};

		if (options) {
			this.extend(options);
		}
	}

	readonly serializer = new EntitySerializer();

	/**
	 * Extends the model with the specified type information.
	 * @param options The set of model types to add and/or extend.
	 */
	extend(options: ModelOptions) {
		// Use prepare() to defer property path resolution while the model is being extended
		this.prepare(() => {
			if (options.$namespace) {
				// TODO: Guard against model being set after instances have been created
				let $namespace = options.$namespace as object;
				if (!this.$namespace) {
					Object.defineProperty(this, "$namespace", { configurable: false, enumerable: true, value: $namespace, writable: false });
				}
				else if ($namespace !== this.$namespace) {
					// TODO: Raise an error?
					console.error("Cannot redefine namespace for model.");
				}
			}

			// Create New Types
			for (let [typeName, typeOptions] of Object.entries(options)) {
				if (typeName === "$namespace") {
					// Ignore the $namespace property since it is handled elsewhere
					continue;
				}

				let type = this.types[typeName];

				if (!type) {
					let baseType = this.types[typeOptions.$extends];
					type = new Type(this, typeName, baseType);
					this.types[typeName] = type;
					delete typeOptions["$extends"];
				}
			}

			// Extend Types
			for (let [typeName, typeOptions] of Object.entries(options)) {
				if (typeName === "$namespace") {
					// Ignore the $namespace property since it is handled elsewhere
					continue;
				}

				this.types[typeName].extend(typeOptions);
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
			// Create an array to track model initialization callbacks
			this._ready = []; 

			// Extend the model
			extend();
			
			// Complete pending model initialization steps
			this._ready.forEach(init => init());
			this._ready = null;
		}

		// Leverage the current model initialization scope
		else
			extend();
	}

	ready(init: () => void) {
		this._ready.push(init);
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
			return (formats[format] = Format.fromTemplate(type.meta, format));
		}
		else {
			// otherwise, call the format provider to create a new format
			return (formats[format] = createFormat(type, format));
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
		return jstype;
	}
}

export interface ModelConstructor {
	new(createOwnProperties?: boolean): Model;
}

export type ModelOptions = {

	/**
	 * The name of the type.
	 */
	[name: string]: TypeOptions;

}

export type ModelNamespaceOption = {

	/**
	 * The object to use as the namespace for model types
	 */
	$namespace?: object;

}

export type ModelConfiguration = {

	/**
	 * Determines whether properties are created as "own" properties, or placed on the type's prototype
	 */
	createOwnProperties?: boolean;

	/**
	 * Determines whether the global/window object is mutated, for example to hold references to types
	 */
	useGlobalObject?: boolean;

}

export class ModelSettings {
	// There is a slight speed cost to creating own properties,
	// which may be noticeable with very large object counts.
	readonly createOwnProperties: boolean = false;

	// Don't pollute the window object by default
	readonly useGlobalObject: boolean = false;

	constructor(config?: ModelConfiguration) {
		this.createOwnProperties = config && !!config.createOwnProperties;
		this.useGlobalObject = config && !!config.useGlobalObject;
	}
}