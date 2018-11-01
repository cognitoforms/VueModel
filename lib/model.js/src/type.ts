import { Model, Model$_allTypesRoot, NamespaceOrConstructor } from "./model";
import { Entity } from "./entity";
import { Property, Property$_generateStaticProperty, Property$_generatePrototypeProperty, Property$_generateOwnProperty, Property$_generateShortcuts } from "./property";
import { navigateAttribute, ensureNamespace, getTypeName, parseFunctionName } from "./helpers";
import { ObjectMeta } from "./object-meta";
import { EventDispatcher, IEvent } from "ste-events";
import { ObservableList } from "./observable-list";
import { Format } from "./format";

let newIdPrefix = "+c"

export interface TypeEntityInitNewEventArgs {
	entity: Entity;
}

export interface TypeEntityInitExistingEventArgs {
	entity: Entity;
}

export interface TypeEntityDestroyEventArgs {
	entity: Entity;
}

class TypeEventDispatchers {

	readonly initNew: EventDispatcher<Type, TypeEntityInitNewEventArgs>;

	readonly initExisting: EventDispatcher<Type, TypeEntityInitExistingEventArgs>;

	readonly destroy: EventDispatcher<Type, TypeEntityDestroyEventArgs>;

	constructor() {
		this.initNew = new EventDispatcher<Type, TypeEntityInitNewEventArgs>();
		this.initExisting = new EventDispatcher<Type, TypeEntityInitExistingEventArgs>();
		this.destroy = new EventDispatcher<Type, TypeEntityDestroyEventArgs>();
	}

}

export interface TypePropertyOptions {
	label?: string;
	helptext?: string;
	format?: Format;
	isPersisted?: boolean;
	isCalculated?: boolean;
	defaultValue?: any;
}

export class Type {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what it represents
	readonly model: Model;
	readonly fullName: string;
	readonly jstype: any;
	readonly baseType: Type;

	// Public settable properties that are simple values with no side-effects or logic
	origin: string;
	originForNewProperties: string;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
	private _counter: number;
	private _known: ObservableList<Entity>;
	private readonly _pool: { [id: string]: Entity };
	private readonly _legacyPool: { [id: string]: Entity }
	private readonly _properties: { [name: string]: Property };
	private readonly _derivedTypes: Type[];

	readonly _eventDispatchers: TypeEventDispatchers;

	constructor(model: Model, fullName: string, baseType: Type = null, origin: string = "client") {

		// Public read-only properties
		Object.defineProperty(this, "model", { enumerable: true, value: model });
		Object.defineProperty(this, "fullName", { enumerable: true, value: fullName });
		Object.defineProperty(this, "jstype", { enumerable: true, value: Type$_generateClass(this, fullName, baseType) });
		Object.defineProperty(this, "baseType", { enumerable: true, value: baseType });
	
		// Public settable properties
		this.origin = origin;
		this.originForNewProperties = this.origin;

		// Backing fields for properties
		Object.defineProperty(this, "_counter", { enumerable: false, value: 0, writable: true });
		Object.defineProperty(this, "_pool", { enumerable: false, value: {}, writable: false });
		Object.defineProperty(this, "_legacyPool", { enumerable: false, value: {}, writable: false });
		Object.defineProperty(this, "_properties", { enumerable: false, value: {}, writable: false });
		Object.defineProperty(this, '_derivedTypes', { enumerable: false, value: [], writable: false });

		Object.defineProperty(this, "_eventDispatchers", { value: new TypeEventDispatchers() });

		// TODO: Implement rules
		// Object.defineProperty(this, "rules", { value: [] });

		// Register the type with the model
		model._types[fullName] = this;

		// TODO: Is self-reference to type needed?
		// Add self-reference to decrease the likelihood of errors
		// due to an absence of the necessary type vs. entity.
		// this.type = this;
	}

	get destroyEvent(): IEvent<Type, TypeEntityDestroyEventArgs> {
		return this._eventDispatchers.destroy.asEvent();
	}

	get initNewEvent(): IEvent<Type, TypeEntityInitNewEventArgs> {
		return this._eventDispatchers.initNew.asEvent();
	}

	get initExistingEvent(): IEvent<Type, TypeEntityInitExistingEventArgs> {
		return this._eventDispatchers.initExisting.asEvent();
	}

	static get newIdPrefix() {
		return newIdPrefix.substring(1);
	}

	static set newIdPrefix(value) {
		if (typeof (value) !== "string") throw new TypeError("Property `Type.newIdPrefix` must be a string, found <" + (typeof value) + ">");
		if (value.length === 0) throw new Error("Property `Type.newIdPrefix` cannot be empty string");
		newIdPrefix = "+" + value;
	}

	newId() {
		// Get the next id for this type's heirarchy.
		for (var nextId, type: Type = this; type; type = type.baseType) {
			nextId = Math.max(nextId || 0, type._counter);
		}

		// Update the counter for each type in the heirarchy.
		for (var type: Type = this; type; type = type.baseType) {
			type._counter = nextId + 1;
		}

		// Return the new id.
		return newIdPrefix + nextId;
	}

	register(obj: Entity, id: string, suppressModelEvent: boolean = false) {
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

		if (this.model._settings.createOwnProperties === true) {
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
			this.model._eventDispatchers.entityRegistered.dispatch(this.model, { entity: obj });
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

	unregister(obj: Entity) {
		for (var t: Type = this; t; t = t.baseType) {
			delete t._pool[obj.meta.id.toLowerCase()];

			if (obj.meta.legacyId) {
				delete t._legacyPool[obj.meta.legacyId.toLowerCase()];
			}

			if (t._known) {
				t._known.remove(obj);
			}
		}

		this.model._eventDispatchers.entityUnregistered.dispatch(this.model, { entity: obj });
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
	known() {
		var known = this._known;
		if (!known) {
			var list: Array<Entity> = [];

			for (var id in this._pool) {
				if (Object.prototype.hasOwnProperty.call(this._pool, id)) {
					list.push(this._pool[id]);
				}
			}

			known = this._known = ObservableList.ensureObservable(list);
		}

		return known;
	}

	addProperty(name: string, jstype: any, isList: boolean, isStatic: boolean, options: TypePropertyOptions = {}) {
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

		Property$_generateShortcuts(property, property.containingType.jstype);

		if (property.isStatic) {
			Property$_generateStaticProperty(property);
		} else if (this.model._settings.createOwnProperties === true) {
			for (var id in this._pool) {
				if (Object.prototype.hasOwnProperty.call(this._pool, id)) {
					Property$_generateOwnProperty(property, this._pool[id]);
			}
			}
		} else {
			Property$_generatePrototypeProperty(property);
		}

		this.model._eventDispatchers.propertyAdded.dispatch(this.model, { property: property });

		return property;
	}

	property(name: string) {
		var prop;
		for (var t: Type = this; t && !prop; t = t.baseType) {
			prop = t._properties[name];

			if (prop) {
				return prop;
			}
		}
		return null;
	}

	get properties(): Array<Property> {
		let propertiesArray: Array<Property> = [];
		for (var type: Type = this; type != null; type = type.baseType) {
			for (var propertyName in type._properties) {
				if (type._properties.hasOwnProperty(propertyName)) {
					propertiesArray.push(type._properties[propertyName]);
				}
			}
		}
		return propertiesArray;
	}

	get derivedTypes(): Type[] {
		return this._derivedTypes;
	}

	isSubclassOf(type: Type) {
		var result = false;

		navigateAttribute(this, 'baseType', function (baseType: Type) {
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

export interface TypeConstructor {
	new(model: Model, fullName: string, baseType?: Type, origin?: string): Type;
	newIdPrefix: string;
}

function Type$_validateId(type: Type, id: string) {
	if (id === null || id === undefined) {
		throw new Error(`Id cannot be ${(id === null ? "null" : "undefined")} (entity = ${type.fullName}).`);
	} else if (getTypeName(id) !== "string") {
		throw new Error(`Id must be a string:  encountered id ${id} of type \"${parseFunctionName(id.constructor)}\" (entity = ${type.fullName}).`);
	} else if (id === "") {
		throw new Error(`Id cannot be a blank string (entity = ${type.fullName}).`);
	}
}

let disableConstruction = false;

function Type$_generateClass(type: Type, fullName: string, baseType: Type = null) {

	// Create namespaces as needed
	let nameTokens: string[] = fullName.split("."),
		token: string = nameTokens.shift(),
		namespaceObj: NamespaceOrConstructor = Model$_allTypesRoot,
		globalObj: any = window;

	while (nameTokens.length > 0) {
		namespaceObj = ensureNamespace(token, namespaceObj);
		globalObj = ensureNamespace(token, globalObj);
		token = nameTokens.shift();
	}

	// The final name to use is the last token
	let finalName = token;

	let jstypeFactory = new Function("construct", "return function " + finalName + " () { construct.apply(this, arguments); }");

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
					t._eventDispatchers.initExisting.dispatch(t, { entity: this });
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
					t._eventDispatchers.initNew.dispatch(t, { entity: this });
				}
			}
		}
	}

	let jstype = jstypeFactory(construct);

	let ctor: NamespaceOrConstructor = (jstype as unknown) as NamespaceOrConstructor;

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

	let baseJsType = null;

	if (baseJsType) {
		baseJsType = baseType.jstype;

		// TODO: Implement `inheritBaseTypePropShortcuts`
		// inherit all shortcut properties that have aleady been defined
		// inheritBaseTypePropShortcuts(jstype, baseType);
	}
	else {
		baseJsType = Entity;
	}

	disableConstruction = true;

	jstype.prototype = new baseJsType();

	disableConstruction = false;

	jstype.prototype.constructor = jstype;

	// Add the 'meta' helper
	Object.defineProperty(jstype, "meta", { enumerable: false, value: type, configurable: false, writable: false });

	return jstype;
}
