import { Event, EventSubscriber } from "./events";
import { randomText } from "./helpers";
import { EntityConstructor, EntityRegisteredEventArgs, EntityUnregisteredEventArgs, Entity, EntityConstructorForType } from "./entity";
import { Type, TypeAddedEventArgs } from "./type";
import { Rule } from "./rule";
import { PropertyAddedEventArgs, Property } from "./property";
import { PropertyChain$create, PropertyChain } from "./property-chain";
import { PathTokens } from "./path-tokens";

export const intrinsicJsTypes = ["Object", "String", "Number", "Boolean", "Date", "TimeSpan", "Array"];

export class Model {

	readonly settings: ModelSettings;

	// Readonly fields 
	readonly _types: { [name: string]: Type };

	readonly _events: ModelEvents;

	private _ruleQueue: Rule[];

	readonly _allTypesRoot: ModelNamespace;

	readonly _fieldNamePrefix: string;

	constructor(createOwnProperties: boolean = undefined, useGlobalObject: boolean = undefined) {
		Object.defineProperty(this, "settings", { configurable: false, enumerable: true, value: new ModelSettings(createOwnProperties, useGlobalObject), writable: false });

		Object.defineProperty(this, "_types", { value: {} });
		Object.defineProperty(this, "_allTypesRoot", { value: {} });
		Object.defineProperty(this, "_fieldNamePrefix", { value: ("_fN" + randomText(3, false, true)) });
		Object.defineProperty(this, "_events", { value: new ModelEvents() });
	}

	get typeAdded(): EventSubscriber<Model, TypeAddedEventArgs> {
		return this._events.typeAddedEvent.asEventSubscriber();
	}

	get entityRegistered(): EventSubscriber<Model, EntityRegisteredEventArgs> {
		return this._events.entityRegisteredEvent.asEventSubscriber();
	}

	get entityUnregistered(): EventSubscriber<Model, EntityUnregisteredEventArgs> {
		return this._events.entityUnregisteredEvent.asEventSubscriber();
	}

	get propertyAdded(): EventSubscriber<Model, PropertyAddedEventArgs> {
		return this._events.propertyAddedEvent.asEventSubscriber();
	}

	// dispose() {
	// 	// TODO: Implement model disposal
	// 	// for (var key in this._types) {
	// 	// 	delete window[key];
	// 	// }
	// }

	getTypes(): Type[] {
		let typesArray: Type[] = [];
		for (var typeName in this._types) {
			if (this._types.hasOwnProperty(typeName)) {
				typesArray.push(this._types[typeName]);
			}
		}
		return typesArray;
	}

	addType(fullName: string, baseType: Type = null, origin: string = "client"): Type {
		var type = new Type(this, fullName, baseType ? (baseType as any) as Type : null, origin);
		this._types[fullName] = type;
		this._events.typeAddedEvent.publish(this, { type: type });
		return type;
	}

	registerRule(rule: Rule): void {
		if (!this._ruleQueue) {
			this._ruleQueue.push(rule);
		} else {
			rule.register();
		}
	}

	registerRules(): void {
		var i, rules = this._ruleQueue;
		delete this._ruleQueue;
		for (i = 0; i < rules.length; i += 1) {
			rules[i].register();
		}
	}

}

export interface ModelConstructor {
	new(createOwnProperties?: boolean): Model;
}

export interface ModelNamespace {
	[name: string]: ModelNamespace | EntityConstructor;
}

export class ModelEvents {
	readonly typeAddedEvent: Event<Model, TypeAddedEventArgs>;
	readonly entityRegisteredEvent: Event<Model, EntityRegisteredEventArgs>;
	readonly entityUnregisteredEvent: Event<Model, EntityUnregisteredEventArgs>;
	readonly propertyAddedEvent: Event<Model, PropertyAddedEventArgs>;
	constructor() {
		// TODO: Don't construct events by default, only when subscribed (optimization)
		// TODO: Extend `EventDispatcher` with `any()` function to check for subscribers (optimization)
		this.typeAddedEvent = new Event<Model, TypeAddedEventArgs>();
		this.entityRegisteredEvent = new Event<Model, EntityRegisteredEventArgs>();
		this.entityUnregisteredEvent = new Event<Model, EntityUnregisteredEventArgs>();
		this.propertyAddedEvent = new Event<Model, PropertyAddedEventArgs>();
	}
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

export function Model$whenTypeAvailable(type: Type, forceLoad: boolean, callback: Function) {

	// Immediately invoke the callback if no type was specified
	if (!type) {
		// TODO: Warn about no type provided to `Model$whenTypeAvailable()`?
		return callback();
	}

	/*
	// TODO: Implement check for lazy loading?
	if (!LazyLoader.isLoaded(type)) {

		// force type loading if requested
		if (forceLoad) {
			LazyLoader.load(type, null, false, callback);
		}

		// otherwise, only continue processing when and if dependent types are loaded
		else {
			$extend(type._fullName, callback);
		}
	}
	*/

	return callback();
}

/**
 * Retrieves the JavaScript constructor function corresponding to the given full type name.
 * @param fullName The full name of the type, including the namespace
 * @param allTypesRoot The model namespace that contains all types
 * @param allowUndefined If true, return undefined if the type is not defined
 */
export function Model$getJsType<TEntity extends Entity>(fullName: string, allTypesRoot: ModelNamespace, allowUndefined: boolean = false): EntityConstructorForType<TEntity> {
	var steps = fullName.split(".");
	if (steps.length === 1 && intrinsicJsTypes.indexOf(fullName) > -1) {
		return allTypesRoot[fullName] as EntityConstructorForType<TEntity>;
	} else {
		let obj: any;

		var ns: ModelNamespace = allTypesRoot;
		for (var i = 0; ns !== undefined && i < steps.length - 1; i++) {
			var step = steps[i];
			ns = ns[step] as ModelNamespace;
		}

		if (ns !== undefined) {
			obj = ns[steps.length - 1];
		}

		if (obj === undefined) {
			if (allowUndefined) {
				return;
			} else {
				throw new Error(`The type \"${fullName}\" could not be found.  Failed on step \"${step}\".`);
			}
		}

		return obj as EntityConstructorForType<TEntity>;
	}
}

export function Model$getPropertyOrPropertyChain(pathOrTokens: string | PathTokens, thisType: any, allTypesRoot: ModelNamespace, forceLoadTypes: boolean = false, callback: (result: Property | PropertyChain) => void = null, thisPtr: any = null): Property | PropertyChain | void {

	var type: Type,
		loadProperty: (containingType: Type, propertyName: string, propertyCallback: ((prop: Property) => void)) => void,
		singlePropertyName,
		path: string = null,
		tokens: PathTokens = null;
		// forceLoadTypes = arguments.length >= 3 && arguments[2] && arguments[2].constructor === Boolean ? arguments[2] : false,
		// callback: ((chain: Property | PropertyChain) => void) = arguments[3],
		// thisPtr = arguments[4],

	// Allow the path argument to be either a string or PathTokens instance.
	if (pathOrTokens.constructor === PathTokens) {
		tokens = pathOrTokens as PathTokens;
		path = tokens.expression;
	} else if (typeof pathOrTokens === "string") {
		path = pathOrTokens as string;
	} else {
		throw new Error("Invalid valud for argument `pathOrTokens`.");
	}

	// Return cached property chains as soon as possible (in other words,
	// do as little as possible prior to returning the cached chain).
	if (thisType && thisType._chains && thisType._chains[path]) {
		if (callback) {
			callback.call(thisPtr || this, thisType._chains[path]);
			return null;
		} else {
			return thisType._chains[path];
		}
	}

	// The path argument was a string, so use it to create a PathTokens object.
	// Delay doing this as an optimization for cached property chains.
	if (!tokens) {
		tokens = new PathTokens(path);
	}

	// get the instance type, if specified
	type = thisType instanceof Function ? thisType.meta : thisType;

	// determine if a typecast was specified for the path to identify a specific subclass to use as the root type
	if (tokens.steps[0].property === "this" && tokens.steps[0].cast) {
		//Try and resolve cast to an actual type in the model
		type = Model$getJsType(tokens.steps[0].cast, allTypesRoot, false).meta;
		tokens.steps.shift();
	}

	// create a function to lazily load a property 
	loadProperty = function (containingType: Type, propertyName: string, propertyCallback: ((prop: Property) => void)) {
		Model$whenTypeAvailable(containingType, forceLoadTypes, function () {
			propertyCallback.call(thisPtr || this, containingType.getProperty(propertyName));
		});
	};

	// Optimize for a single property expression, as it is neither static nor a chain.
	if (tokens.steps.length === 1) {
		singlePropertyName = tokens.steps[0].property;
		if (callback) {
			loadProperty(type, singlePropertyName, callback);
		} else {
			return type.getProperty(singlePropertyName);
		}
	}

	// otherwise, first see if the path represents a property chain, and if not, a global property
	else {

		// predetermine the global type name and property name before seeing if the path is an instance path
		var globalTypeName = tokens.steps
			.slice(0, tokens.steps.length - 1)
			.map(function (item) { return item.property; })
			.join(".");

		var globalPropertyName = tokens.steps[tokens.steps.length - 1].property;

		// Copy of the Model.property arguments for async re-entry.
		var outerArgs = Array.prototype.slice.call(arguments);

		// create a function to see if the path is a global property if instance processing fails
		var processGlobal = function (instanceParseError: string) {

			// Retrieve the javascript type by name.
			let jstype = Model$getJsType(globalTypeName, allTypesRoot, true);

			// Handle non-existant or non-loaded type.
			if (!type) {
				// // TODO: Implement lazy loading of types?
				// if (callback) {
				// 	// Retry when type is loaded
				// 	$extend(globalTypeName, Model$getPropertyOrPropertyChain.prepare(Model, outerArgs));
				// 	return null;
				// } else {

				throw new Error(instanceParseError ? instanceParseError : ("Error getting type \"" + globalTypeName + "\"."));
			}

			// Get the corresponding meta type.
			type = jstype.meta;

			// return the static property
			if (callback) {
				loadProperty(type, globalPropertyName, callback);
			} else {
				return type.getProperty(globalPropertyName);
			}
		};

		if (callback) {
			PropertyChain$create.call(null, type, tokens, forceLoadTypes, thisPtr ? callback.bind(thisPtr) : callback, processGlobal);
		} else {
			return PropertyChain$create.call(null, type, tokens, forceLoadTypes) || processGlobal(null);
		}
	}
}
