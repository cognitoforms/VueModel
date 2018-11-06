import { Type } from "./type";
import { EventDispatcher, IEvent } from "ste-events";
import { Entity } from "./entity";
import { Property } from "./property";

const intrinsicJsTypes = ["Object", "String", "Number", "Boolean", "Date", "TimeSpan", "Array"];

export interface NamespaceOrConstructor {
	[name: string]: NamespaceOrConstructor;
}

export interface ModelTypeAddedEventArgs {
	type: Type;
}

export interface ModelEntityRegisteredEventArgs {
	entity: Entity;
}

export interface ModelEntityUnregisteredEventArgs {
	entity: Entity;
}

export interface ModelPropertyAddedEventArgs {
	property: Property;
}

export interface ModelSettings {
	createOwnProperties: boolean;
}

const ModelSettingsDefaults: ModelSettings = {
	// There is a slight speed cost to creating own properties,
	// which may be noticeable with very large object counts.
	createOwnProperties: false,
};

class ModelEventDispatchers {

	readonly typeAdded: EventDispatcher<Model, ModelTypeAddedEventArgs>;

	readonly entityRegistered: EventDispatcher<Model, ModelEntityRegisteredEventArgs>;

	readonly entityUnregistered: EventDispatcher<Model, ModelEntityUnregisteredEventArgs>;

	readonly propertyAdded: EventDispatcher<Model, ModelPropertyAddedEventArgs>;

	constructor() {
		// TODO: Don't construct events by default, only when subscribed (optimization)
		// TODO: Extend `EventDispatcher` with `any()` function to check for subscribers (optimization)
		this.typeAdded = new EventDispatcher<Model, ModelTypeAddedEventArgs>();
		this.entityRegistered = new EventDispatcher<Model, ModelEntityRegisteredEventArgs>();
		this.entityUnregistered = new EventDispatcher<Model, ModelEntityUnregisteredEventArgs>();
		this.propertyAdded = new EventDispatcher<Model, ModelPropertyAddedEventArgs>();
	}

}

export let Model$_allTypesRoot: NamespaceOrConstructor = {};

export class Model {

	// Readonly fields 
	readonly _types: { [name: string]: Type };
	readonly _settings: ModelSettings;

	readonly _eventDispatchers: ModelEventDispatchers;

	constructor(createOwnProperties: boolean = undefined) {
		Object.defineProperty(this, "_types", { value: {} });
		Object.defineProperty(this, "_settings", { value: Model$_createSettingsObject(createOwnProperties) });
		Object.defineProperty(this, "_eventDispatchers", { value: new ModelEventDispatchers() });
	}

	get typeAddedEvent(): IEvent<Model, ModelTypeAddedEventArgs> {
		return this._eventDispatchers.typeAdded.asEvent();
	}

	get entityRegisteredEvent(): IEvent<Model, ModelEntityRegisteredEventArgs> {
		return this._eventDispatchers.entityRegistered.asEvent();
	}

	get entityUnregisteredEvent(): IEvent<Model, ModelEntityUnregisteredEventArgs> {
		return this._eventDispatchers.entityUnregistered.asEvent();
	}

	get propertyAddedEvent(): IEvent<Model, ModelPropertyAddedEventArgs> {
		return this._eventDispatchers.propertyAdded.asEvent();
	}

	dispose() {
		// TODO: Implement model disposal
		// for (var key in this._types) {
		// 	delete window[key];
		// }
	}

	get types(): Array<Type> {
		let typesArray: Array<Type> = [];
		for (var typeName in this._types) {
			if (this._types.hasOwnProperty(typeName)) {
				typesArray.push(this._types[typeName]);
			}
		}
		return typesArray;
	}

	addType(name: string, baseType: Type = null, origin: string = "client") {
		var type = new Type(this, name, baseType, origin);
		this._types[name] = type;
		this._eventDispatchers.typeAdded.dispatch(this, { type: type });
		return type;
	}

	/**
	 * Retrieves the JavaScript constructor function corresponding to the given full type name.
	 * @param name The name of the type
	 */
	static getJsType(name: string, allowUndefined: boolean = false): any {
		var obj = Model$_allTypesRoot;
		var steps = name.split(".");
		if (steps.length === 1 && intrinsicJsTypes.indexOf(name) > -1) {
			return obj[name];
		} else {
			for (var i = 0; i < steps.length; i++) {
				var step = steps[i];
				obj = obj[step] as NamespaceOrConstructor;
				if (obj === undefined) {
					if (allowUndefined) {
						return;
					} else {
						throw new Error(`The type \"${name}\" could not be found.  Failed on step \"${step}\".`);
					}
				}
			}
			return obj;
		}
	}
}

export interface ModelConstructor {
	new(createOwnProperties?: boolean): Model;
	getJsType(name: string, allowUndefined?: boolean): any;
}

function Model$_createSettingsObject(createOwnProperties: boolean = ModelSettingsDefaults.createOwnProperties): ModelSettings {
	let settings: ModelSettings = {
		createOwnProperties: createOwnProperties
	};

	return settings;
}
