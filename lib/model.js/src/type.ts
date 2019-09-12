import { Model } from "./model";
import { Entity, EntityConstructorForType, EntityDestroyEventArgs, EntityInitNewEventArgs, EntityInitExistingEventArgs, EntityConstructor } from "./entity";
import { Property, Property$generateStaticProperty, Property$generatePrototypeProperty, Property$generateOwnProperty, Property$generateShortcuts, PropertyOptions } from "./property";
import { navigateAttribute, getTypeName, parseFunctionName, ensureNamespace, getGlobalObject } from "./helpers";
import { Event, EventSubscriber } from "./events";
import { ObservableArray } from "./observable-array";
import { RuleOptions, Rule } from "./rule";
import { Format } from "./format";
import { PropertyChain, EntityRegisteredEventArgs, EntityUnregisteredEventArgs } from ".";
import { PropertyPath } from "./property-path";

export const Type$newIdPrefix = "+c";

export class Type {
	format: Format<Entity>;

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what it represents
	readonly model: Model;
	readonly fullName: string;
	readonly jstype: EntityType;
	readonly baseType: Type;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
	private _lastId: number;

	private _known: ObservableArray<Entity>;
	private readonly _pool: { [id: string]: Entity };
	private readonly _legacyPool: { [id: string]: Entity }
	private readonly _derivedTypes: Type[];

	readonly _properties: { [name: string]: Property };
	readonly chains: { [path: string]: PropertyChain };

	readonly _formats: { [name: string]: Format<any> };

	readonly initNew: EventSubscriber<Type, EntityInitNewEventArgs>;
	readonly initExisting: EventSubscriber<Type, EntityInitExistingEventArgs>;
	readonly destroy: EventSubscriber<Type, EntityDestroyEventArgs>;
	// readonly conditionsChanged: EventSubscriber<Type, ConditionTargetsChangedEventArgs>;

	constructor(model: Model, fullName: string, baseType: Type = null, options?: TypeOptions) {
		this.model = model;
		this.fullName = fullName;
		this.jstype = Type$generateConstructor(this, fullName, baseType, model.settings.useGlobalObject ? getGlobalObject() : null);
		this.baseType = baseType;
		this._lastId = 0;
		this._pool = {};
		this._legacyPool = {};
		this._properties = {};
		this._formats = {};
		this._derivedTypes = [];
		this.chains = {};

		this.initNew = new Event<Type, EntityInitNewEventArgs>();
		this.initExisting = new Event<Type, EntityInitExistingEventArgs>();
		this.destroy = new Event<Type, EntityDestroyEventArgs>();
		// this.conditionsChanged = new Event<Type, ConditionTargetsChangedEventArgs>();

		// Apply type options
		if (options)
			this.extend(options);
	}

	/** Generates a unique id suitable for an instance in the current type hierarchy. */
	newId() {
		let lastId;

		for (let type: Type = this; type; type = type.baseType) {
			lastId = Math.max(lastId || 0, type._lastId);
		}

		let nextId = lastId + 1;

		// Update the last id for each type in the heirarchy.
		for (let type: any = this; type; type = type.baseType) {
			type._lastId = nextId;
		}

		// Return the new id.
		return Type$newIdPrefix + nextId;
	}

	assertValidId(id: string): void {
		if (id === null || id === undefined) {
			throw new Error(`Id cannot be ${(id === null ? "null" : "undefined")} (entity = ${this.fullName}).`);
		}
		else if (getTypeName(id) !== "string") {
			throw new Error(`Id must be a string:  encountered id ${id} of type "${parseFunctionName(id.constructor)}" (entity = ${this.fullName}).`);
		}
		else if (id === "") {
			throw new Error(`Id cannot be a blank string (entity = ${this.fullName}).`);
		}
	}
	
	register(obj: Entity): void {
		this.assertValidId(obj.meta.id);

		var key = obj.meta.id.toLowerCase();

		for (var t: Type = this; t; t = t.baseType) {
			if (t._pool.hasOwnProperty(key)) {
				throw new Error(`Object "${this.fullName}|${obj.meta.id}" has already been registered.`);
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
						Property$generateOwnProperty(property, obj);
					}
				}
			}
		}

		(this.model.entityRegistered as Event<Model, EntityRegisteredEventArgs>).publish(this.model, { entity: obj });
	}

	changeObjectId(oldId: string, newId: string) {
		this.assertValidId(oldId);
		this.assertValidId(newId);

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

		(this.model.entityUnregistered as Event<Model, EntityUnregisteredEventArgs>).publish(this.model, { entity: obj });
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

	/** Gets the {Property} or {PropertyChain} for the specified simple path {string}. */
	getPath(path: string): PropertyPath {
		// Get single property
		let property: PropertyPath = this.getProperty(path);

		// Get cached property chain
		if (!property)
			property = this.chains[path];

		// Create and cache property chain
		if (!property) {
			property = this.chains[path] = new PropertyChain(this, path);
		}

		// Return the property path
		return property;
	}

	/** Gets and array of {Property} or {PropertyChain} instances for the specified complex graph path {string}. */
	getPaths(path: string): PropertyPath[] {
		let start = 0;
		let paths = [];

		// Process the path
		if (/{|,|}/g.test(path)) {
			let stack: string[] = [];
			let parent: string;

			for (let i = 0, len = path.length; i < len; ++i) {
				let c = path.charAt(i);

				if (c === "{" || c === "," || c === "}") {
					let seg = path.substring(start, i).trim();
					start = i + 1;

					if (c === "{") {
						if (parent) {
							stack.push(parent);
							parent += "." + seg;
						}
						else {
							parent = seg;
						}
					}
					else { // ',' or '}'
						if (seg.length > 0) {
							paths.push(this.getPath(parent ? parent + "." + seg : seg));
						}

						if (c === "}") {
							parent = (stack.length === 0) ? undefined : stack.pop();
						}
					}
				}
			}

			if (stack.length > 0 || parent) {
				throw new Error("Unclosed '{' in path: " + path);
			}

			if (start < path.length) {
				let seg = path.substring(start).trim();
				if (seg.length > 0) {
					paths.push(this.getPath(seg));
				}

				// Set start to past the end of the list to indicate that the entire string was processed
				start = path.length;
			}
		}

		// If the input is a simple property or path, then add the single property or chain
		if (start === 0) {
			paths.push(this.getPath(path.trim()));
		}

		return paths;
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
			}
			else {
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

		navigateAttribute(this, "baseType", function (baseType: Type) {
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

	/**
	 * Extends the current type with the specified format, properties and methods
	 * @param options The options specifying how to extend the type
	 */
	extend(options: TypeOptions) {
		// Use prepare() to defer property path resolution while the model is being extended
		this.model.prepare(() => {
			const isMethod = (value: any): value is RuleOptions => value.hasOwnProperty("execute");

			// Set Format
			if (options.$format) {
				if (typeof (options.$format) === "string") {
					let format = options.$format;
					this.model.ready(() => {
						this.format = this.model.getFormat<Entity>(this.jstype, format);
					});
				}
				else
					this.format = options.$format;
				delete options["$format"];
			}

			// Type Members
			for (let [name, member] of Object.entries(options)) {
				// Ignore Type and Format values, which do not represent type members
				if (member instanceof Type || member instanceof Format)
					continue;

				// Property Type Name
				if (typeof (member) === "string")
					member = { type: member };

				// Property Type
				else if (isValueType(member))
					member = { type: member };

				// Method Function
				else if (typeof (member) === "function")
					member = { execute: member as (this: Entity) => any };

				// Method
				if (isMethod(member)) {

					// TODO: Add rule/method here

				}

				// Property
				else {
					// Get Property
					let property = this.getProperty(name);

					// Add Property
					if (!property) {
						// Type & IsList
						let isList = false;
						if (typeof (member.type) === "string") {
							// Type names ending in [] are lists
							if (member.type.lastIndexOf("[]") === (member.type.length - 2)) {
								isList = true;
								member.type = member.type.substr(0, member.type.length - 2);
							}

							// Convert type names to javascript types
							member.type = this.model.getJsType(member.type);
						}

						// Add Property
						let property = new Property(this, name, member.type, isList, member.static, member);

						this._properties[name] = property;

						Property$generateShortcuts(property, this.jstype);

						if (property.isStatic) {
							Property$generateStaticProperty(property, this.jstype);
						}
						else if (!this.model.settings.createOwnProperties) {
							Property$generatePrototypeProperty(property, this.jstype.prototype);
						}
					}
					else {
						property.extend(member, this);
					}
				}
			}
		});
	}
}

export type Value = String | Number | Date | Boolean;
export type ValueType = StringConstructor | NumberConstructor | DateConstructor | BooleanConstructor;
export type EntityType = EntityConstructorForType<Entity>;
export type PropertyType = ValueType | EntityType;

export interface TypeConstructor {
	new(model: Model, fullName: string, baseType?: Type, origin?: string): Type;
}

export interface TypeOptions {

	$extends?: string;

	$format?: string | Format<Entity>;

	/** The name of the property, method, or type attribute */
	[name: string]: string | ValueType | Function | Format<Entity> | ((this: Entity) => any) | PropertyOptions | RuleOptions;

}

export function isValueType(type: any): type is ValueType {
	return type === String || type === Number || type === Date || type === Boolean;
}

export function isValue(value: any, valueType: any = null): value is Value {
	if (!valueType)
		valueType = value.constructor;
	return isValueType(valueType);
}

export function isEntityType(type: any): type is EntityType {
	return type.meta && type.meta instanceof Type;
}

// TODO: Get rid of disableConstruction?
let disableConstruction: boolean = false;

export function Type$generateConstructor(type: Type, fullName: string, baseType: Type = null, global: any = null) {
	// Create namespaces as needed
	let nameTokens: string[] = fullName.split(".");
	let token: string = nameTokens.shift();
	let namespaceObj: any = type.model.$namespace || type.model;
	let globalObj: any = global;

	while (nameTokens.length > 0) {
		namespaceObj = ensureNamespace(token, namespaceObj);
		if (global) {
			globalObj = ensureNamespace(token, globalObj);
		}
		token = nameTokens.shift();
	}

	// The final name to use is the last token
	let finalName = token;

	let BaseConstructor: EntityConstructor;

	if (baseType) {
		BaseConstructor = baseType.jstype;
		// // TODO: Implement `inheritBaseTypePropShortcuts`
		// // inherit all shortcut properties that have aleady been defined
		// inheritBaseTypePropShortcuts(ctor, baseType);
	}
	else {
		BaseConstructor = Entity;
	}

	// eslint-disable-next-line no-new-func
	let ctorFactory = new Function("construct", "return function " + finalName + " () { construct.apply(this, arguments); }");

	function construct(this: Entity) {
		if (!disableConstruction) {
			try {
				Entity.ctorDepth++;
				let baseTypeArgs: ArrayLike<any> = (arguments.length > 0 && arguments[0] instanceof Type) ? arguments : [type].concat(Array.from(arguments));
				BaseConstructor.apply(this, baseTypeArgs);
			}
			finally {
				Entity.ctorDepth--;
			}
		}
	}

	let ctor = ctorFactory(construct) as any;
	// If the namespace already contains a type with this name, prepend a '$' to the name
	if (!namespaceObj[finalName]) {
		namespaceObj[finalName] = ctor;
	}
	else {
		namespaceObj["$" + finalName] = ctor;
	}

	if (global) {
		// If the global object already contains a type with this name, append a '$' to the name
		if (!globalObj[finalName]) {
			globalObj[finalName] = ctor;
		}
		else {
			globalObj["$" + finalName] = ctor;
		}
	}

	// Setup inheritance

	disableConstruction = true;

	ctor.prototype = new BaseConstructor();

	disableConstruction = false;

	ctor.prototype.constructor = ctor;

	// Add the 'meta' helper
	Object.defineProperty(ctor, "meta", { enumerable: false, value: type, configurable: false, writable: false });

	return ctor;
}
