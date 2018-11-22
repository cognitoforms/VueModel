import { Model, ModelNamespace } from "./model";
import { Entity, EntityConstructorForType, EntityDestroyEventArgs, EntityInitNewEventArgs, EntityInitExistingEventArgs, EntityConstructor } from "./entity";
import { Property, Property$_generateStaticProperty, Property$_generatePrototypeProperty, Property$_generateOwnProperty, Property$_generateShortcuts } from "./property";
import { navigateAttribute, getTypeName, parseFunctionName, ensureNamespace, getGlobalObject } from "./helpers";
import { ObjectMeta, ObjectMetaEvents } from "./object-meta";
import { Event, EventSubscriber } from "./events";
import { ObservableArray } from "./observable-array";
import { RuleOptions, Rule } from "./rule";
import { Format, getFormat } from "./format";
import { ConditionTargetsChangedEventArgs } from "./condition-target";

export const Type$newIdPrefix = "+c"

export class Type {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what it represents
	readonly model: Model;
	readonly fullName: string;
	readonly jstype: EntityConstructorForType<Entity>;
	readonly baseType: Type;

	// Public settable properties that are simple values with no side-effects or logic
	origin: string;
	originForNewProperties: string;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
	private _lastId: number;
	private _format: Format<Entity>;
	private _known: ObservableArray<Entity>;
	private readonly _pool: { [id: string]: Entity };
	private readonly _legacyPool: { [id: string]: Entity }
	private readonly _derivedTypes: Type[];

	readonly _properties: { [name: string]: Property };

	readonly _formats: { [name: string]: Format<any> };

	readonly _events: TypeEvents;

	constructor(model: Model, fullName: string, baseType: Type = null, origin: string = "client") {

		// Public read-only properties
		Object.defineProperty(this, "model", { enumerable: true, value: model });
		Object.defineProperty(this, "fullName", { enumerable: true, value: fullName });
		Object.defineProperty(this, "jstype", { enumerable: true, value: Type$_generateConstructor(this, fullName, baseType, model.settings.useGlobalObject ? getGlobalObject() : null) });
		Object.defineProperty(this, "baseType", { enumerable: true, value: baseType });
	
		// Public settable properties
		this.origin = origin;
		this.originForNewProperties = this.origin;

		// Backing fields for properties
		Object.defineProperty(this, "_lastId", { enumerable: false, value: 0, writable: true });
		Object.defineProperty(this, "_pool", { enumerable: false, value: {}, writable: false });
		Object.defineProperty(this, "_legacyPool", { enumerable: false, value: {}, writable: false });
		Object.defineProperty(this, "_properties", { enumerable: false, value: {}, writable: false });
		Object.defineProperty(this, "_formats", { configurable: false, enumerable: false, value: {}, writable: false });
		Object.defineProperty(this, '_derivedTypes', { enumerable: false, value: [], writable: false });

		Object.defineProperty(this, "_events", { value: new TypeEvents() });

		// Object.defineProperty(this, "rules", { value: [] });

		// TODO: Is self-reference to type needed?
		// Add self-reference to decrease the likelihood of errors
		// due to an absence of the necessary type vs. entity.
		// this.type = this;
	}

	get destroy(): EventSubscriber<Type, EntityDestroyEventArgs> {
		return this._events.destroyEvent.asEventSubscriber();
	}

	get initNew(): EventSubscriber<Type, EntityInitNewEventArgs> {
		return this._events.initNewEvent.asEventSubscriber();
	}

	get initExisting(): EventSubscriber<Type, EntityInitExistingEventArgs> {
		return this._events.initExistingEvent.asEventSubscriber();
	}

	get conditionsChanged(): EventSubscriber<Type, ConditionTargetsChangedEventArgs> {
		return this._events.conditionsChangedEvent.asEventSubscriber();
	}

	// static get newIdPrefix() {
	// 	return newIdPrefix.substring(1);
	// }

	// static set newIdPrefix(value) {
	// 	if (typeof (value) !== "string") throw new TypeError("Property `Type.newIdPrefix` must be a string, found <" + (typeof value) + ">");
	// 	if (value.length === 0) throw new Error("Property `Type.newIdPrefix` cannot be empty string");
	// 	newIdPrefix = "+" + value;
	// }

	get format(): string | Format<Entity> {
		if (this._format) {
			return this._format;
		}
		if (this.baseType) {
			return this.baseType.format;
		}
	}

	set format(value: string | Format<Entity>) {
		if (value && typeof value === "string") {
			value = getFormat(this.model, this.jstype, value);
		}

		Object.defineProperty(this, "_format", { configurable: true, enumerable: false, value: value, writable: true });
	}

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
		return Type$newIdPrefix  + nextId;
	}

	register(obj: Entity, id: string, suppressModelEvent: boolean = false): void {
		// register is called with single argument from default constructor
		if (arguments.length === 2) {
			Type$_validateId.call(this, id);
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
				t._known.push(obj);
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
			this.model._events.entityRegisteredEvent.publish(this.model, { entity: obj });
		}
	}

	changeObjectId(oldId: string, newId: string) {
		Type$_validateId.call(this, oldId);
		Type$_validateId.call(this, newId);

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

	unregister(obj: Entity): void {
		for (var t: Type = this; t; t = t.baseType) {
			delete t._pool[obj.meta.id.toLowerCase()];

			if (obj.meta.legacyId) {
				delete t._legacyPool[obj.meta.legacyId.toLowerCase()];
			}

			if (t._known) {
				let objIndex = t._known.indexOf(obj);
				if (objIndex >= 0) {
					t._known.splice(objIndex, 1);
				}
			}
		}

		this.model._events.entityUnregisteredEvent.publish(this.model, { entity: obj });
	}

	get(id: string, exactTypeOnly: boolean = false) {
		if (!id) {
			throw new Error(`Method "${this.fullName}.meta.get()" was called without a valid id argument.`);
		}

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
	known(): Entity[] {
		var known = this._known;
		if (!known) {
			var list: Array<Entity> = [];

			for (var id in this._pool) {
				if (Object.prototype.hasOwnProperty.call(this._pool, id)) {
					list.push(this._pool[id]);
				}
			}

			known = this._known = ObservableArray.ensureObservable(list);
		}

		return known;
	}

	addProperty(name: string, jstype: any, isList: boolean, isStatic: boolean, options: TypePropertyOptions = {}): Property {
		let format: Format<any> = null;
		if (options.format) {
			if (typeof(options.format) === "string") {
				format = getFormat(this.model, jstype, options.format);
			} else if (format.constructor === Format) {
				format = options.format;
			} else {
				// TODO: Warn about format option that is neither Format or string
			}
		}

		var property = new Property(this, name, jstype, options.label, options.helptext, format, isList, isStatic, options.isPersisted, options.isCalculated, options.defaultValue);

		this._properties[name] = property;

		// TODO: Implement static and instance property storage?
		// (isStatic ? this._staticProperties : this._instanceProperties)[name] = property;

		Property$_generateShortcuts(property, property.containingType.jstype);

		if (property.isStatic) {
			Property$_generateStaticProperty(property, this.jstype);
		} else if (this.model.settings.createOwnProperties === true) {
			for (var id in this._pool) {
				if (Object.prototype.hasOwnProperty.call(this._pool, id)) {
					Property$_generateOwnProperty(property, this._pool[id]);
				}
			}
		} else {
			Property$_generatePrototypeProperty(property, this.jstype.prototype);
		}

		this.model._events.propertyAddedEvent.publish(this.model, { property });

		return property;
	}

	getProperty(name: string): Property {
		var prop;
		for (var t: Type = this; t && !prop; t = t.baseType) {
			prop = t._properties[name];

			if (prop) {
				return prop;
			}
		}
		return null;
	}

	get properties(): Property[] {
		let propertiesArray: Property[] = [];
		for (var type: Type = this; type != null; type = type.baseType) {
			for (var propertyName in type._properties) {
				if (type._properties.hasOwnProperty(propertyName)) {
					propertiesArray.push(type._properties[propertyName]);
				}
			}
		}
		return propertiesArray;
	}

	addRule(optionsOrFunction: ((this: Entity) => void) | RuleOptions): Rule {

		let options: RuleOptions;

		if (optionsOrFunction) {
			// The options are the function to execute
			if (optionsOrFunction instanceof Function) {
				options = { execute: optionsOrFunction };
			} else {
				options = optionsOrFunction as RuleOptions;
			}
		}

		let rule = new Rule(this, options.name, options);

		// TODO: Track rules on the type?

		return rule;
	}

	get derivedTypes(): Type[] {
		return this._derivedTypes;
	}

	hasModelProperty(prop: Property): boolean {
		return prop.containingType === this || this.isSubclassOf(prop.containingType as Type);
	}

	isSubclassOf(type: Type): boolean {
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
}

export interface TypePropertyOptions {
	label?: string;
	helptext?: string;
	format?: string | Format<any>;
	isPersisted?: boolean;
	isCalculated?: boolean;
	defaultValue?: any;
}

export interface TypeAddedEventArgs {
	type: Type;
}

export class TypeEvents {
	readonly initNewEvent: Event<Type, EntityInitNewEventArgs>;
	readonly initExistingEvent: Event<Type, EntityInitExistingEventArgs>;
	readonly destroyEvent: Event<Type, EntityDestroyEventArgs>;
	readonly conditionsChangedEvent: Event<Type, ConditionTargetsChangedEventArgs>;
	constructor() {
		this.initNewEvent = new Event<Type, EntityInitNewEventArgs>();
		this.initExistingEvent = new Event<Type, EntityInitExistingEventArgs>();
		this.destroyEvent = new Event<Type, EntityDestroyEventArgs>();
		this.conditionsChangedEvent = new Event<Type, ConditionTargetsChangedEventArgs>();
	}
}

function Type$_validateId(this: Type, id: string) {
	if (id === null || id === undefined) {
		throw new Error(`Id cannot be ${(id === null ? "null" : "undefined")} (entity = ${this.fullName}).`);
	} else if (getTypeName(id) !== "string") {
		throw new Error(`Id must be a string:  encountered id ${id} of type \"${parseFunctionName(id.constructor)}\" (entity = ${this.fullName}).`);
	} else if (id === "") {
		throw new Error(`Id cannot be a blank string (entity = ${this.fullName}).`);
	}
}

// TODO: Get rid of disableConstruction?
let disableConstruction: boolean = false;

export function Type$_generateConstructor(type: Type, fullName: string, baseType: Type = null, global: any = null) {

	// Create namespaces as needed
	let nameTokens: string[] = fullName.split("."),
		token: string = nameTokens.shift(),
		namespaceObj: ModelNamespace = type.model._allTypesRoot,
		globalObj: any = global;

	while (nameTokens.length > 0) {
		namespaceObj = ensureNamespace(token, namespaceObj);
		if (global) {
			globalObj = ensureNamespace(token, globalObj);
		}
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
				for (let t = type; t; t = t.baseType) {
					t._events.initExistingEvent.publish(t, { entity: this });
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
				for (let t = type; t; t = t.baseType) {
					t._events.initNewEvent.publish(t, { entity: this });
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

	if (global) {
		// If the global object already contains a type with this name, append a '$' to the name
		if (!globalObj[finalName]) {
			globalObj[finalName] = ctor;
		} else {
			globalObj['$' + finalName] = ctor;
		}
	}

	// Setup inheritance

	let baseConstructor: EntityConstructor;

	if (baseType) {
		baseConstructor = baseType.jstype;
		// // TODO: Implement `inheritBaseTypePropShortcuts`
		// // inherit all shortcut properties that have aleady been defined
		// inheritBaseTypePropShortcuts(ctor, baseType);
	} else {
		baseConstructor = Entity;
	}

	disableConstruction = true;

	ctor.prototype = new baseConstructor();

	disableConstruction = false;

	ctor.prototype.constructor = ctor;

	// Add the 'meta' helper
	Object.defineProperty(ctor, "meta", { enumerable: false, value: type, configurable: false, writable: false });

	return ctor;
}
