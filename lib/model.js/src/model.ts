import { Event, EventSubscriber } from "./events";
import { randomText, ObjectLookup } from "./helpers";
import { EntityRegisteredEventArgs, EntityUnregisteredEventArgs, Entity } from "./entity";
import { Type, PropertyType, isEntityType, ValueType, TypeOptions, TypeExtensionOptions } from "./type";
import { Format, createFormat } from "./format";
import { EntitySerializer } from "./entity-serializer";
import { getResource, defineResources } from "./resource";

const valueTypes: { [name: string]: ValueType } = { string: String, number: Number, date: Date, boolean: Boolean };

export class Model {
	readonly types: { [name: string]: Type };

	readonly settings: ModelSettings;

	readonly fieldNamePrefix: string;

	readonly $namespace: any;
	
	readonly $locale: string;
	
	readonly entityRegistered: EventSubscriber<Model, EntityRegisteredEventArgs>;
	readonly entityUnregistered: EventSubscriber<Model, EntityUnregisteredEventArgs>;

	private _ready: (() => void)[];
	private readonly _formats: { [name: string]: { [name: string]: Format<ValueType> } };

	readonly serializer = new EntitySerializer();

	constructor(options?: ModelOptions & ModelNamespaceOption & ModelLocaleOption, config?: ModelConfiguration) {
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

	/**
	 * Sets resource messages for the given locale
	 * @param locale The locale to set messages for
	 * @param resources The resources messages
	 */
	static defineResources(locale: string, resources: ObjectLookup<string>): void {
		defineResources(locale, resources);
	}

	/**
	 * Gets the resource with the specified name
	 * @param name The resource name/key
	 */
	static getResource(name: string, locale?: string): string;
	static getResource(name: string, params?: ObjectLookup<string>): string;
	static getResource(name: string, locale?: string, params?: ObjectLookup<string>): string;
	static getResource(name: string, arg2?: string | ObjectLookup<string>, arg3?: ObjectLookup<string>): string {
		let locale: string;
		let params: ObjectLookup<string>;
		if (arguments.length === 2) {
			if (typeof arg2 === "string") {
				locale = arg2;
				params = null;
			}
			else if (typeof arg2 === "object") {
				locale = null;
				params = arg2;
			}
		}
		else if (arguments.length >= 3) {
			locale = arg2 as string;
			params = arg3 as ObjectLookup<string>;
		}

		return getResource(name, locale, params);
	}

	/**
	 * Extends the model with the specified type information.
	 * @param options The set of model types to add and/or extend.
	 */
	extend(options: ModelOptions): void {
		// Use prepare() to defer property path resolution while the model is being extended
		this.prepare(() => {
			if (options.$namespace) {
				// TODO: Guard against model being set after instances have been created
				let $namespace = options.$namespace as object;
				if (!this.$namespace) {
					Object.defineProperty(this, "$namespace", { configurable: false, enumerable: true, value: $namespace, writable: false });
					delete options['$namespace'];
				}
				else if ($namespace !== this.$namespace) {
					// TODO: Raise an error?
					console.error("Cannot redefine namespace for model.");
				}
			}

			if (options.$locale && typeof options.$locale === "string") {
				// TODO: Detect that the locale has already been set, or types have already been initialized under a different locale
				let $locale = options.$locale as string;
				Object.defineProperty(this, "$locale", { configurable: false, enumerable: true, value: $locale, writable: false });
				delete options['$locale'];
			}

			let typesToCreate = Object.keys(options).filter(typeName => !typeName.startsWith('$'));

			let typesToInitialize: string[] = [];

			// Create New Types
			while (typesToCreate.length > 0) {
				let typeName = typesToCreate.splice(0, 1)[0];

				for (let typeNameIdx = -1, pos = typeName.length - 1, i = typeName.lastIndexOf('.', pos); i > 0; pos = i - 1, i = typeName.lastIndexOf('.', pos)) {
					let typeNamespace = typeName.substring(0, i);
					let typeNamespaceIdx = typesToCreate.indexOf(typeNamespace);
					if (typeNamespaceIdx > typeNameIdx) {
						if (process.env.NODE_ENV === "development") {
							console.warn("Type '" + typeNamespace + "' should be created before type '" + typeName + "'.");
						}

						// Remove the current  type's "namespace" type and re-add the current type to the list
						typesToCreate.splice(typeNamespaceIdx, 1);
						typesToCreate.splice(0, 0, typeName);
						typeNameIdx++;

						// Resume the loop using the new namespace type (resetting index variables isn't necessary)
						typeName = typeNamespace;
					}
				}

				let typeOptions = options[typeName];
				let type = this.types[typeName];
				
				typesToInitialize.push(typeName);

				if (!type) {
					let baseType = this.types[typeOptions.$extends];
					delete typeOptions["$extends"];

					let format = typeOptions.$format;
					delete typeOptions["$format"];

					type = new Type(this, typeName, baseType, format);
					this.types[typeName] = type;
				}
			}

			// Extend Types
			for (let typeName of typesToInitialize) {
				let typeOptions = options[typeName];
				this.types[typeName].extend(typeOptions);
			}
		});
	}

	/**
	 * Prepares the model by invoking and extension function, which tracking the model
	 * ready state to allow use of the @ready promise to defer property path resolution.
	 * @param extend The function extending the model
	 */
	prepare(extend: () => void): void {
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

	ready(init: () => void): void {
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
			return (formats[format] = createFormat(type, format, this.$locale));
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
	 * Standard type options ($extends and $format), properties, and methods/rules
	 */
	[name: string]: TypeOptions & TypeExtensionOptions<Entity>;
}

export type ModelLocaleOption = {
	/**
	 * The model's locale (English is assumed by default)
	 */
	$locale?: string;
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