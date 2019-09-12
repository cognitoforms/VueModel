import { Model as IModel, ModelNamespace } from "./interfaces";
import { Type as IType, TypeEntityInitNewEventArgs, TypeEntityInitExistingEventArgs, TypeEntityDestroyEventArgs, TypePropertyOptions } from "./interfaces";
import { Model$_allTypesRoot, Model$_getEventDispatchers } from "./model";
import { Entity as IEntity, EntityConstructorForType, EntityConstructor } from "./interfaces";
import { Property as IProperty } from "./interfaces";
import { Property, Property$_generateStaticProperty, Property$_generatePrototypeProperty, Property$_generateOwnProperty, Property$_generateShortcuts } from "./property";
import { navigateAttribute, ensureNamespace, getTypeName, parseFunctionName } from "./helpers";
import { ObjectMeta } from "./object-meta";
import { EventDispatcher, IEvent } from "ste-events";
import { ObservableList } from "./observable-list";
import { Rule as IRule, RuleOptions } from "./interfaces";
import { Rule$create } from "./rule";
import { Entity } from "./entity";

let newIdPrefix = "+c"

class TypeEventDispatchers {

	readonly initNewEvent: EventDispatcher<IType, TypeEntityInitNewEventArgs>;

	readonly initExistingEvent: EventDispatcher<IType, TypeEntityInitExistingEventArgs>;

	readonly destroyEvent: EventDispatcher<IType, TypeEntityDestroyEventArgs>;

	constructor() {
		this.initNewEvent = new EventDispatcher<IType, TypeEntityInitNewEventArgs>();
		this.initExistingEvent = new EventDispatcher<IType, TypeEntityInitExistingEventArgs>();
		this.destroyEvent = new EventDispatcher<IType, TypeEntityDestroyEventArgs>();
	}

}

export class Type implements IType {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what it represents
	readonly model: IModel;
	readonly fullName: string;
	readonly ctor: EntityConstructorForType<IEntity>;
	readonly baseType: Type;

	// Public settable properties that are simple values with no side-effects or logic
	origin: string;
	originForNewProperties: string;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
	private _lastId: number;
	private _known: ObservableList<IEntity>;
	private readonly _pool: { [id: string]: IEntity };
	private readonly _legacyPool: { [id: string]: IEntity }
	private readonly _properties: { [name: string]: IProperty };
	private readonly _derivedTypes: Type[];

	readonly _eventDispatchers: TypeEventDispatchers;

	constructor(model: IModel, fullName: string, baseType: Type = null, origin: string = "client") {

		// Public read-only properties
		Object.defineProperty(this, "model", { enumerable: true, value: model });
		Object.defineProperty(this, "fullName", { enumerable: true, value: fullName });
		Object.defineProperty(this, "ctor", { enumerable: true, value: Type$_generateConstructor(this, fullName, baseType) });
		Object.defineProperty(this, "baseType", { enumerable: true, value: baseType });
	
		// Public settable properties
		this.origin = origin;
		this.originForNewProperties = this.origin;

		// Backing fields for properties
		Object.defineProperty(this, "_lastId", { enumerable: false, value: 0, writable: true });
		Object.defineProperty(this, "_pool", { enumerable: false, value: {}, writable: false });
		Object.defineProperty(this, "_legacyPool", { enumerable: false, value: {}, writable: false });
		Object.defineProperty(this, "_properties", { enumerable: false, value: {}, writable: false });
		Object.defineProperty(this, '_derivedTypes', { enumerable: false, value: [], writable: false });

		Object.defineProperty(this, "_eventDispatchers", { value: new TypeEventDispatchers() });

		// Object.defineProperty(this, "rules", { value: [] });

		// TODO: Is self-reference to type needed?
		// Add self-reference to decrease the likelihood of errors
		// due to an absence of the necessary type vs. entity.
		// this.type = this;
	}

	get destroyEvent(): IEvent<IType, TypeEntityDestroyEventArgs> {
		return this._eventDispatchers.destroyEvent.asEvent();
	}

	get initNewEvent(): IEvent<IType, TypeEntityInitNewEventArgs> {
		return this._eventDispatchers.initNewEvent.asEvent();
	}

	get initExistingEvent(): IEvent<IType, TypeEntityInitExistingEventArgs> {
		return this._eventDispatchers.initExistingEvent.asEvent();
	}

	// static get newIdPrefix() {
	// 	return newIdPrefix.substring(1);
	// }

	// static set newIdPrefix(value) {
	// 	if (typeof (value) !== "string") throw new TypeError("Property `Type.newIdPrefix` must be a string, found <" + (typeof value) + ">");
	// 	if (value.length === 0) throw new Error("Property `Type.newIdPrefix` cannot be empty string");
	// 	newIdPrefix = "+" + value;
	// }

	newId() {
		// Get the next id for this type's heirarchy.
		for (var lastId, type: Type = this; type; type = type.baseType) {
			lastId = Math.max(lastId || 0, type._lastId);
		}

		let nextId = lastId + 1;

		// Update the last id for each type in the heirarchy.
		for (var type: Type = this; type; type = type.baseType) {
			(type as any)._lastId = nextId;
		}

		// Return the new id.
		return newIdPrefix + nextId;
	}

	register(obj: IEntity, id: string, suppressModelEvent: boolean = false): void {
		// register is called with single argument from default constructor
		if (arguments.length === 2) {
			Type$_validateId(this, id);
		}

		var isNew: boolean;

		if (!id) {
			id = this.newId();
			isNew = true;
		}

		Object.defineProperty(obj, "meta", { value: new ObjectMeta(this, obj, id, isNew), configurable: false, enumerable: false, writable: false });

		var key = id.toLowerCase();

		for (var t: Type = this; t; t = t.baseType) {
			if (t._pool.hasOwnProperty(key)) {
				throw new Error(`Object \"${this.fullName}|${id}\" has already been registered.`);
			}

			t._pool[key] = obj;

			if (t._known) {
				t._known.add(obj);
			}
		}

		if (this.model.settings.createOwnProperties === true) {
			for (let prop in this._properties) {
				if (Object.prototype.hasOwnProperty.call(this._properties, prop)) {
					let property = this._properties[prop];
					if (!property.isStatic) {
						Property$_generateOwnProperty(property, obj);
					}
				}
			}
		}

		if (!suppressModelEvent) {
			Model$_getEventDispatchers(this.model).entityRegisteredEvent.dispatch(this.model, { entity: obj });
		}
	}

	changeObjectId(oldId: string, newId: string) {
		Type$_validateId(this, oldId);
		Type$_validateId(this, newId);

		var oldKey = oldId.toLowerCase();
		var newKey = newId.toLowerCase();

		var obj = this._pool[oldKey];

		if (obj) {
			obj.meta.legacyId = oldId;

			for (var t: Type = this; t; t = t.baseType) {
				t._pool[newKey] = obj;

				delete t._pool[oldKey];

				t._legacyPool[oldKey] = obj;
			}

			obj.meta.id = newId;

			return obj;
		} else {
			// TODO: Warn about attempting to change id of object that couldn't be found
			// logWarning($format("Attempting to change id: Instance of type \"{0}\" with id = \"{1}\" could not be found.", this.get_fullName(), oldId));
			// console.warn(`Attempting to change id: Instance of type \"${this.fullName}\" with id = \"${oldId}\" could not be found.`);
		}
	}

	unregister(obj: IEntity): void {
		for (var t: Type = this; t; t = t.baseType) {
			delete t._pool[obj.meta.id.toLowerCase()];

			if (obj.meta.legacyId) {
				delete t._legacyPool[obj.meta.legacyId.toLowerCase()];
			}

			if (t._known) {
				t._known.remove(obj);
			}
		}

		Model$_getEventDispatchers(this.model).entityUnregisteredEvent.dispatch(this.model, { entity: obj });
	}

	get(id: string, exactTypeOnly: boolean = false) {
		var key = id.toLowerCase();
		var obj = this._pool[key] || this._legacyPool[key];

		// If exactTypeOnly is specified, don't return sub-types.
		if (obj && exactTypeOnly === true && obj.meta.type !== this) {
			throw new Error(`The entity with id='${id}' is expected to be of type '${this.fullName}' but found type '${obj.meta.type.fullName}'.`);
		}

		return obj;
	}

	// Gets an array of all objects of this type that have been registered.
	// The returned array is observable and collection changed events will be raised
	// when new objects are registered or unregistered.
	// The array is in no particular order.
	known(): IEntity[] {
		var known = this._known;
		if (!known) {
			var list: Array<IEntity> = [];

			for (var id in this._pool) {
				if (Object.prototype.hasOwnProperty.call(this._pool, id)) {
					list.push(this._pool[id]);
				}
			}

			known = this._known = ObservableList.ensureObservable(list);
		}

		return known;
	}

	addProperty(name: string, jstype: any, isList: boolean, isStatic: boolean, options: TypePropertyOptions = {}): IProperty {
		// TODO: Compile format specifier to format object
		// let format: Format = null;
		// if (options.format) {
		// 	if (typeof(options.format) === "string") {
		// 		format = getFormat(jstype, options.format);
		// 	} else if (format.constructor === Format) {
		// 		format = options.format;
		// 	} else {
		// 		// TODO: Warn about format option that is neither Format or string
		// 	}
		// }

		var property = new Property(this, name, jstype, options.label, options.helptext, options.format, isList, isStatic, options.isPersisted, options.isCalculated, options.defaultValue);

		this._properties[name] = property;

		// TODO: Implement static and instance property storage?
		// (isStatic ? this._staticProperties : this._instanceProperties)[name] = property;

		Property$_generateShortcuts(property, property.containingType.ctor);

		if (property.isStatic) {
			Property$_generateStaticProperty(property);
		} else if (this.model.settings.createOwnProperties === true) {
			for (var id in this._pool) {
				if (Object.prototype.hasOwnProperty.call(this._pool, id)) {
					Property$_generateOwnProperty(property, this._pool[id]);
			}
			}
		} else {
			Property$_generatePrototypeProperty(property);
		}

		Model$_getEventDispatchers(this.model).propertyAddedEvent.dispatch(this.model, { property: property });

		return property;
	}

	getProperty(name: string): IProperty {
		var prop;
		for (var t: Type = this; t && !prop; t = t.baseType) {
			prop = t._properties[name];

			if (prop) {
				return prop;
			}
		}
		return null;
	}

	get properties(): IProperty[] {
		let propertiesArray: IProperty[] = [];
		for (var type: Type = this; type != null; type = type.baseType) {
			for (var propertyName in type._properties) {
				if (type._properties.hasOwnProperty(propertyName)) {
					propertiesArray.push(type._properties[propertyName]);
				}
			}
		}
		return propertiesArray;
	}

	addRule(def: ((entity: IEntity) => void) | RuleOptions): IRule {
		let rule = Rule$create(this, def);

		// TODO: Track rules on the type?

		return rule;
	}

	get derivedTypes(): IType[] {
		return this._derivedTypes;
	}

	hasModelProperty(prop: IProperty): boolean {
		return prop.containingType === this || this.isSubclassOf(prop.containingType);
	}

	isSubclassOf(type: IType): boolean {
		var result = false;

		navigateAttribute(this, 'baseType', function (baseType: IType) {
			if (baseType === type) {
				result = true;
				return false;
			}
		});

		return result;
	}

	toString() {
		return this.fullName;
	}

}

export function Type$_getEventDispatchers(type: IType): TypeEventDispatchers {
	return (type as any)._eventDispatchers as TypeEventDispatchers;
}

export function Type$_dispatchEvent<TSender, TArgs>(type: IType, eventName: string, sender: TSender, args: TArgs): void {
	let dispatchers = Type$_getEventDispatchers(type) as { [eventName: string]: any };
	let dispatcher = dispatchers[eventName + "Event"] as EventDispatcher<TSender, TArgs>;
	dispatcher.dispatch(sender, args);
}

export function Type$create(model: IModel, fullName: string, baseType: IType = null, origin: string = "client") {
	return new Type(model, fullName, baseType ? baseType as Type : null, origin);
}

export function Type$isType(obj: any) {
	return obj instanceof Type;
}

function Type$_validateId(type: IType, id: string) {
	if (id === null || id === undefined) {
		throw new Error(`Id cannot be ${(id === null ? "null" : "undefined")} (entity = ${type.fullName}).`);
	} else if (getTypeName(id) !== "string") {
		throw new Error(`Id must be a string:  encountered id ${id} of type \"${parseFunctionName(id.constructor)}\" (entity = ${type.fullName}).`);
	} else if (id === "") {
		throw new Error(`Id cannot be a blank string (entity = ${type.fullName}).`);
	}
}

let disableConstruction = false;

function Type$_generateConstructor(type: Type, fullName: string, baseType: Type = null) {

	// Create namespaces as needed
	let nameTokens: string[] = fullName.split("."),
		token: string = nameTokens.shift(),
		namespaceObj: ModelNamespace = Model$_allTypesRoot,
		globalObj: any = window;

	while (nameTokens.length > 0) {
		namespaceObj = ensureNamespace(token, namespaceObj);
		globalObj = ensureNamespace(token, globalObj);
		token = nameTokens.shift();
	}

	// The final name to use is the last token
	let finalName = token;

	let ctorFactory = new Function("construct", "return function " + finalName + " () { construct.apply(this, arguments); }");

	function construct() {
		if (!disableConstruction) {
			if (arguments.length > 0 && arguments[0] != null && arguments[0].constructor === String) {
				let id = arguments[0] as string;

				let props = arguments[1];

				// TODO: Is this needed?
				let suppressModelEvent = arguments[2];

				// When a constructor is called we do not want to silently
				// return an instance of a sub type, so fetch using exact type.
				let exactTypeOnly = true;

				// TODO: Indicate that an object is currently being constructed?

				let obj = type.get(id, exactTypeOnly);

				// If the instance already exists, then initialize properties and return it.
				if (obj) {
					if (props) {
						obj.init(props);
					}
					return obj;
				}

				// Register the newly constructed existing instance.
				type.register(this, id, suppressModelEvent);

				// Initialize properties if provided.
				if (props) {
					this.init(props);
				}

				// Raise the initExisting event on this type and all base types
				for (let t: Type = type; t; t = t.baseType) {
					t._eventDispatchers.initExistingEvent.dispatch(t, { entity: this });
				}
			} else {
				let props = arguments[0];

				// TODO: Is this needed?
				let suppressModelEvent = arguments[2];

				// Register the newly constructed new instance. It will
				// be assigned a sequential client-generated id.
				type.register(this, null, suppressModelEvent);

				// Set properties passed into constructor.
				if (props) {
					this.set(props);
				}

				// Raise the initNew event on this type and all base types
				for (let t: Type = type; t; t = t.baseType) {
					Type$_getEventDispatchers(t).initNewEvent.dispatch(t, { entity: this });
				}
			}
		}
	}

	let ctor = ctorFactory(construct) as ModelNamespace | any;

	// If the namespace already contains a type with this name, prepend a '$' to the name
	if (!namespaceObj[finalName]) {
		namespaceObj[finalName] = ctor;
	} else {
		namespaceObj['$' + finalName] = ctor;
	}

	// If the global object already contains a type with this name, append a '$' to the name
	if (!globalObj[finalName]) {
		globalObj[finalName] = ctor;
	} else {
		globalObj['$' + finalName] = ctor;
	}

	// Setup inheritance

	let baseCtor: EntityConstructor | EntityConstructorForType<IEntity> = null;

	if (baseCtor) {
		baseCtor = baseType.ctor;

		// TODO: Implement `inheritBaseTypePropShortcuts`
		// inherit all shortcut properties that have aleady been defined
		// inheritBaseTypePropShortcuts(ctor, baseType);
	}
	else {
		baseCtor = Entity as EntityConstructor;
	}

	disableConstruction = true;

	ctor.prototype = new baseCtor();

	disableConstruction = false;

	ctor.prototype.constructor = ctor;

	// Add the 'meta' helper
	Object.defineProperty(ctor, "meta", { enumerable: false, value: type, configurable: false, writable: false });

	return ctor;
}
