import { Event, EventSubscriber } from "./events";
import { replaceTokens, randomText, ObjectLookup } from "./helpers";
import { EntityRegisteredEventArgs, EntityUnregisteredEventArgs, Entity } from "./entity";
import { Type, PropertyType, isEntityType, ValueType, TypeOptions, TypeExtensionOptions } from "./type";
import { Format, createFormat } from "./format";
import { EntitySerializer } from "./entity-serializer";
import { LocalizedResourcesMap, setDefaultLocale, defineResources, getResource } from "./resource";
import { CultureInfo, formatNumber, parseNumber, formatDate, parseDate } from "./globalization";

const valueTypes: { [name: string]: ValueType } = { string: String, number: Number, date: Date, boolean: Boolean };

export class Model {
	readonly types: { [name: string]: Type };

	readonly settings: ModelSettings;

	readonly fieldNamePrefix: string;

	readonly $namespace: any;
	readonly $locale: string;
	readonly $resources: LocalizedResourcesMap;
	readonly $culture: CultureInfo;

	readonly entityRegistered: EventSubscriber<Model, EntityRegisteredEventArgs>;
	readonly entityUnregistered: EventSubscriber<Model, EntityUnregisteredEventArgs>;

	private _ready: (() => void)[];
	private readonly _formats: { [name: string]: { [name: string]: Format<ValueType> } };

	readonly serializer = new EntitySerializer();

	constructor(options?: ModelOptions & ModelNamespaceOption & ModelLocalizationOptions, config?: ModelConfiguration) {
		this.types = {};
		this.settings = new ModelSettings(config);
		this.fieldNamePrefix = "_fN" + randomText(3, false, true);
		this.entityRegistered = new Event<Model, EntityRegisteredEventArgs>();
		this.entityUnregistered = new Event<Model, EntityUnregisteredEventArgs>();
		this._formats = {};

		if (options) {
			this.extend(options);
		}
	}

	/**
	 * Sets the default locale to use when a model's locale is not explicitly set
	 * @param locale The default locale
	 */
	static setDefaultLocale(locale: string): void {
		setDefaultLocale(locale);
	}

	/**
	 * Defines global resource messages for the given locale
	 * @param locale The locale to set messages for
	 * @param resources The resources messages
	 */
	static defineResources(locale: string, resources: ObjectLookup<string>): void {
		defineResources(locale, resources);
	}

	/**
	 * Gets the resource with the specified name
	 * @param name The resource name/key
	 * @param locale The locale of the resource
	 * @param params The parameters to use for string format substitution
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

		let resource = getResource(name, locale);
		if (params)
			return replaceTokens(resource, params);
		return resource;
	}

	/**
	 * Gets the resource with the specified name
	 * @param name The resource name/key
	 * @param params The parameters to use for string format substitution
	 */
	getResource(name: string, params: ObjectLookup<string> = null): string {
		let resource = getResource(name, this.$resources, this.$locale);
		if (params)
			return replaceTokens(resource, params);
		return resource;
	}

	/**
	 * Formats a date as text using the given format string
	 * @param date The date to format
	 * @param format The format specifier
	 */
	formatDate(date: Date, format: string): string {
		return formatDate(date, format, this.$culture);
	}

	/**
	 * Parses a date from text
	 * @param text The text to parse
	 */
	parseDate(text: string): Date {
		return parseDate(text, this.$culture);
	}

	/**
	 * Formats a number as text using the given format string
	 * @param number The number to format
	 * @param format The format specifier
	 */
	formatNumber(number: number, format: string): string {
		return formatNumber(number, format, this.$culture);
	}

	/**
	 * Parses a number from text
	 * @param text The text to parse
	 */
	parseNumber(text: string): number {
		return parseNumber(text, this.$culture);
	}

	/**
	 * Extends the model with the specified type information.
	 * @param options The set of model types to add and/or extend.
	 */
	extend(options: ModelOptions & ModelNamespaceOption & ModelLocalizationOptions): void {
		// Use prepare() to defer property path resolution while the model is being extended
		this.prepare(() => {
			// Namespace
			if (options.$namespace) {
				// TODO: Guard against namespace being set after types have been created
				let $namespace = options.$namespace as object;
				if (!this.$namespace) {
					Object.defineProperty(this, "$namespace", { configurable: false, enumerable: true, value: $namespace, writable: false });
				}
				else if ($namespace !== this.$namespace) {
					throw new Error("Cannot redefine namespace for model.");
				}
			}

			// Locale
			if (options.$locale && typeof options.$locale === "string") {
				// TODO: Guard against locale being set after types have been created
				let $locale = options.$locale as string;
				if (!this.$locale) {
					Object.defineProperty(this, "$locale", { configurable: false, enumerable: true, value: $locale, writable: false });
				}
				else if ($locale !== this.$locale) {
					throw new Error("Cannot redefine locale for model.");
				}
			}

			// Resources
			if (options.$resources && typeof options.$resources === "object") {
				// TODO: Guard against resources being set after types have been created
				let $resources = (options.$resources as any) as ObjectLookup<ObjectLookup<string>>;
				if (!this.$resources) {
					Object.defineProperty(this, "$resources", { configurable: false, enumerable: true, value: $resources, writable: false });
				}
				else if ($resources !== this.$resources) {
					throw new Error("Cannot redefine resources for model.");
				}
			}

			// Culture
			if (options.$culture) {
				let $culture: CultureInfo;
				// TODO: Guard against culture being set after types have been created
				if (typeof options.$culture === "object") {
					$culture = options.$culture;
				}
				else if (typeof options.$culture === "string") {
					CultureInfo.setup();
					if (CultureInfo.CurrentCulture.name === options.$culture) {
						$culture = CultureInfo.CurrentCulture;
					}
					if (!$culture) {
						throw new Error("Could not find culture '" + options.$culture + "'.");
					}
				}
				if ($culture) {
					if (!this.$culture) {
						Object.defineProperty(this, "$culture", { configurable: false, enumerable: true, value: $culture, writable: false });
					}
					else if ($culture !== this.$culture) {
						throw new Error("Cannot redefine culture for model.");
					}
				}
			}

			let typesToCreate = Object.keys(options).filter(typeName => !typeName.startsWith("$"));

			let typesToInitialize: string[] = [];

			// Create New Types
			while (typesToCreate.length > 0) {
				let typeName = typesToCreate.splice(0, 1)[0];

				for (let typeNameIdx = -1, pos = typeName.length - 1, i = typeName.lastIndexOf(".", pos); i > 0; pos = i - 1, i = typeName.lastIndexOf(".", pos)) {
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

				let typeOptions = options[typeName] as TypeOptions & TypeExtensionOptions<Entity>;
				let type = this.types[typeName];

				typesToInitialize.push(typeName);

				if (!type) {
					let baseType: Type = null;
					if (typeOptions.$extends) {
						baseType = this.types[typeOptions.$extends];
						if (!baseType) {
							throw new Error("Base type '" + typeOptions.$extends + "' for type '" + typeName + "' wasn't found.");
						}
					}

					let format = typeOptions.$format;

					type = new Type(this, typeName, baseType, format);
					this.types[typeName] = type;
				}
			}

			// Extend Types
			for (let typeName of typesToInitialize) {
				let typeOptions = options[typeName] as TypeOptions & TypeExtensionOptions<Entity>;
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
		if (this._ready) {
			this._ready.push(init);
		}
		else {
			init();
		}
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
			return (formats[format] = createFormat(this, type, format));
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
	[name: string]: (TypeOptions & TypeExtensionOptions<Entity>) | string;
}

export type ModelLocalizationOptions = {
	/**
	 * The model's locale (English is assumed by default)
	 */
	$locale?: string;

	/**
	 * The model's resource objects
	 */
	$resources?: LocalizedResourcesMap;

	/**
	 * The model's culture
	 */
	$culture?: CultureInfo | string;
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