import { Model as IModel, ModelNamespace, ModelSettings, ModelTypeAddedEventArgs, ModelEntityRegisteredEventArgs, ModelEntityUnregisteredEventArgs, ModelPropertyAddedEventArgs } from "./interfaces";
import { Type as IType } from "./interfaces";
import { Type$create } from "./type";
import { IEvent, EventDispatcher } from "ste-events";
import { Entity as IEntity, EntityConstructorForType } from "./interfaces";
import { Property as IProperty } from "./interfaces";
import { PropertyChain as IPropertyChain } from "./interfaces";
import { PropertyChain$create } from "./property-chain";
import { PathTokens as IPathTokens } from "./interfaces";
import { PathTokens } from "./path-tokens";
import { Rule as IRule } from "./interfaces";

const intrinsicJsTypes = ["Object", "String", "Number", "Boolean", "Date", "TimeSpan", "Array"];

class ModelSettingsImplementation {
	readonly createOwnProperties: boolean;
	constructor(createOwnProperties: boolean) {
		Object.defineProperty(this, "createOwnProperties", { configurable: false, enumerable: true, value: createOwnProperties, writable: false });
	}
}

const ModelSettingsDefaults: ModelSettings = {
	// There is a slight speed cost to creating own properties,
	// which may be noticeable with very large object counts.
	createOwnProperties: false,
};

class ModelEventDispatchers {

	readonly typeAddedEvent: EventDispatcher<IModel, ModelTypeAddedEventArgs>;

	readonly entityRegisteredEvent: EventDispatcher<IModel, ModelEntityRegisteredEventArgs>;

	readonly entityUnregisteredEvent: EventDispatcher<IModel, ModelEntityUnregisteredEventArgs>;

	readonly propertyAddedEvent: EventDispatcher<IModel, ModelPropertyAddedEventArgs>;

	constructor() {
		// TODO: Don't construct events by default, only when subscribed (optimization)
		// TODO: Extend `EventDispatcher` with `any()` function to check for subscribers (optimization)
		this.typeAddedEvent = new EventDispatcher<IModel, ModelTypeAddedEventArgs>();
		this.entityRegisteredEvent = new EventDispatcher<IModel, ModelEntityRegisteredEventArgs>();
		this.entityUnregisteredEvent = new EventDispatcher<IModel, ModelEntityUnregisteredEventArgs>();
		this.propertyAddedEvent = new EventDispatcher<IModel, ModelPropertyAddedEventArgs>();
	}

}

export let Model$_allTypesRoot: ModelNamespace = {};

export class Model implements IModel {

	readonly settings: ModelSettings;

	// Readonly fields 
	readonly _types: { [name: string]: IType };

	private readonly _eventDispatchers: ModelEventDispatchers;

	private _ruleQueue: IRule[];

	constructor(createOwnProperties: boolean = undefined) {
		Object.defineProperty(this, "settings", { configurable: false, enumerable: true, value: Model$_createSettingsObject(createOwnProperties), writable: false });

		Object.defineProperty(this, "_types", { value: {} });
		Object.defineProperty(this, "_eventDispatchers", { value: new ModelEventDispatchers() });
	}

	get typeAddedEvent(): IEvent<IModel, ModelTypeAddedEventArgs> {
		return this._eventDispatchers.typeAddedEvent.asEvent();
	}

	get entityRegisteredEvent(): IEvent<IModel, ModelEntityRegisteredEventArgs> {
		return this._eventDispatchers.entityRegisteredEvent.asEvent();
	}

	get entityUnregisteredEvent(): IEvent<IModel, ModelEntityUnregisteredEventArgs> {
		return this._eventDispatchers.entityUnregisteredEvent.asEvent();
	}

	get propertyAddedEvent(): IEvent<IModel, ModelPropertyAddedEventArgs> {
		return this._eventDispatchers.propertyAddedEvent.asEvent();
	}

	dispose() {
		// TODO: Implement model disposal
		// for (var key in this._types) {
		// 	delete window[key];
		// }
	}

	get types(): IType[] {
		let typesArray: IType[] = [];
		for (var typeName in this._types) {
			if (this._types.hasOwnProperty(typeName)) {
				typesArray.push(this._types[typeName]);
			}
		}
		return typesArray;
	}

	addType(name: string, baseType: IType = null, origin: string = "client") {
		var type = Type$create(this, name, baseType, origin);
		this._types[name] = type;
		this._eventDispatchers.typeAddedEvent.dispatch(this, { type: type });
		return type;
	}

	registerRule(rule: IRule) {
		if (!this._ruleQueue) {
			this._ruleQueue.push(rule);
		} else {
			rule.register();
		}
	}

	registerRules() {
		var i, rules = this._ruleQueue;
		delete this._ruleQueue;
		for (i = 0; i < rules.length; i += 1) {
			rules[i].register();
		}
	}

}

function Model$_createSettingsObject(createOwnProperties: boolean = ModelSettingsDefaults.createOwnProperties): ModelSettings {
	return new ModelSettingsImplementation(createOwnProperties);
}

export function Model$_getEventDispatchers(model: IModel): ModelEventDispatchers {
	return (model as any)._eventDispatchers as ModelEventDispatchers;
}

export function Model$_dispatchEvent<TSender, TArgs>(model: IModel, eventName: string, sender: TSender, args: TArgs): void {
	let dispatchers = Model$_getEventDispatchers(model) as { [eventName: string]: any };
	let dispatcher = dispatchers[eventName + "Event"] as EventDispatcher<TSender, TArgs>;
	dispatcher.dispatch(sender, args);
}

export function Model$whenTypeAvailable(type: IType, forceLoad: boolean, callback: Function) {

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
 * @param allowUndefined If true, return undefined if the type is not defined
 */
export function Model$getJsType<TEntity extends IEntity>(fullName: string, allowUndefined: boolean = false): EntityConstructorForType<TEntity> {
	var steps = fullName.split(".");
	if (steps.length === 1 && intrinsicJsTypes.indexOf(fullName) > -1) {
		return Model$_allTypesRoot[fullName] as EntityConstructorForType<TEntity>;
	} else {
		let obj: any;

		var ns: ModelNamespace = Model$_allTypesRoot;
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

export function Model$getPropertyOrPropertyChain(pathOrTokens: string | IPathTokens, thisType: any = null, forceLoadTypes: boolean = false, callback: (result: IProperty | IPropertyChain) => void, thisPtr: any = null): IProperty | IPropertyChain | void {

	var type,
		loadProperty: (containingType: IType, propertyName: string, propertyCallback: ((prop: IProperty) => void)) => void,
		singlePropertyName,
		path: string = null,
		tokens: IPathTokens = null;
		// forceLoadTypes = arguments.length >= 3 && arguments[2] && arguments[2].constructor === Boolean ? arguments[2] : false,
		// callback: ((chain: Property | PropertyChain) => void) = arguments[3],
		// thisPtr = arguments[4],

	// Allow the path argument to be either a string or PathTokens instance.
	if (pathOrTokens.constructor === PathTokens) {
		tokens = pathOrTokens as IPathTokens;
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
		type = Model$getJsType(tokens.steps[0].cast, false).meta;
		tokens.steps.shift();
	}

	// create a function to lazily load a property 
	loadProperty = function (containingType: IType, propertyName: string, propertyCallback: ((prop: IProperty) => void)) {
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
			return type.property(singlePropertyName);
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
			type = Model$getJsType(globalTypeName, true);

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
			type = type.meta;

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
