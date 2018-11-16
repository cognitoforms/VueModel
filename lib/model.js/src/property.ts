import { Event, EventObject, EventSubscriber, ContextualEventRegistration } from "./events";
import { Entity, EntityConstructorForType } from "./entity";
import { Format } from "./format";
import { Type } from "./type";
import { PropertyChain$_addChangedHandler, PropertyChain$_addAccessedHandler, PropertyChain, PropertyChainAccessEventHandler, PropertyChainChangeEventHandler } from "./property-chain";
import { getTypeName, getDefaultValue, parseFunctionName, toTitleCase, ObjectLiteral, merge } from "./helpers";
import { ObservableList } from "./observable-list";
import { RuleRegisteredEventArgs, Rule } from "./rule";

export class Property {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the object is
	readonly containingType: Type;
	readonly name: string;
	readonly propertyType: any;
	readonly isList: boolean;
	readonly isStatic: boolean;

	// Public settable properties that are simple values with no side-effects or logic
	helptext: string;
	isPersisted: boolean;
	isCalculated: boolean;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
	private _label: string;
	private _format: Format;
	private _origin: string;
	private _defaultValue: any;

	readonly _events: PropertyEvents;
	readonly _propertyAccessSubscriptions: ContextualEventRegistration<Entity, PropertyAccessEventArgs, Entity>[];
	readonly _propertyChangeSubscriptions: ContextualEventRegistration<Entity, PropertyChangeEventArgs, Entity>[];
	readonly _rules: PropertyRule[];

	readonly getter: (args?: any) => any;
	readonly setter: (value: any, args?: any) => void;

	constructor(containingType: Type, name: string, jstype: any, label: string, helptext: string, format: Format, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue: any = undefined, origin: string = "client") {

		// Public read-only properties
		Object.defineProperty(this, "containingType", { enumerable: true, value: containingType });
		Object.defineProperty(this, "name", { enumerable: true, value: name });
		Object.defineProperty(this, "propertyType", { enumerable: true, value: jstype });
		Object.defineProperty(this, "isList", { enumerable: true, value: isList === true });
		Object.defineProperty(this, "isStatic", { enumerable: true, value: isStatic === true });

		// Public settable properties
		this.helptext = helptext;
		this.isPersisted = isPersisted;
		this.isCalculated = isCalculated;

		// Backing fields for properties
		if (label) Object.defineProperty(this, "_label", { enumerable: false, value: label, writable: true });
		if (format) Object.defineProperty(this, "_format", { enumerable: false, value: format, writable: true });
		if (origin) Object.defineProperty(this, "_origin", { enumerable: false, value: origin, writable: true });
		if (defaultValue) Object.defineProperty(this, "_defaultValue", { enumerable: false, value: defaultValue, writable: true });

		Object.defineProperty(this, "_events", { value: new PropertyEvents() });
		Object.defineProperty(this, "_propertyAccessSubscriptions", { value: [] });
		Object.defineProperty(this, "_propertyChangeSubscriptions", { value: [] });
		Object.defineProperty(this, "_rules", { value: [] });

		Object.defineProperty(this, "getter", { value: Property$_makeGetter(this, Property$_getter) });
		Object.defineProperty(this, "setter", { value: Property$_makeSetter(this, Property$_setter) });

		if (this.origin === "client" && this.isPersisted) {
			// TODO: Warn about client-origin property marked as persisted?
			// logWarning($format("Client-origin properties should not be marked as persisted: Type = {0}, Name = {1}", containingType.get_fullName(), name));
		}
	}

	get fieldName(): string {
		return this.containingType.model._fieldNamePrefix + "_" + this.name;
	}

	get changed(): EventSubscriber<Entity, PropertyChangeEventArgs> {
		return this._events.changedEvent.asEventSubscriber();
	}

	get accessed(): EventSubscriber<Entity, PropertyAccessEventArgs> {
		return this._events.accessedEvent.asEventSubscriber();
	}

	getPath(): string {
		return this.isStatic ? (this.containingType + "." + this.name) : this.name;
	}

	equals(prop: Property | PropertyChain): boolean {

		if (prop === null || prop === undefined) {
			return;
		}

		if (prop instanceof PropertyChain) {
			return (prop as PropertyChain).equals(this);
		}

		if (prop instanceof Property) {
			return this === prop;
		}

	}

	toString() {
		if (this.isStatic) {
			return `${this.containingType}.${this.name}`;
		} else {
			return `this<${this.containingType}>.${this.name}`;
		}
	}

	get label(): string {
		return this._label || toTitleCase(this.name.replace(/([^A-Z]+)([A-Z])/g, "$1 $2"));
	}

	get format(): Format {
		// TODO: Compile format from specifier if needed
		return this._format;
	}

	get origin(): string {
		return this._origin;
	}

	get defaultValue() {
		if (Object.prototype.hasOwnProperty.call(this, '_defaultValue')) {
			// clone array and date defaults since they are mutable javascript types
			return this._defaultValue instanceof Array ? this._defaultValue.slice() :
				this._defaultValue instanceof Date ? new Date(+this._defaultValue) :
					// TODO: Implement TimeSpan class/type?
					// this._defaultValue instanceof TimeSpan ? new TimeSpan(this._defaultValue.totalMilliseconds) :
						this._defaultValue instanceof Function ? this._defaultValue() :
							this._defaultValue;
		} else {
			return getDefaultValue(this.isList, this.propertyType);
		}
	}

	canSetValue(obj: Entity, val: any): boolean {
		// NOTE: only allow values of the correct data type to be set in the model

		if (val === undefined) {
			// TODO: Warn about setting value to undefined?
			// logWarning("You should not set property values to undefined, use null instead: property = ." + this._name + ".");
			// console.warn(`You should not set property values to undefined, use null instead: property = ${this.name}.`);
			return true;
		}

		if (val === null) {
			return true;
		}

		// for entities check base types as well
		if (val.constructor && val.constructor.meta) {
			for (var valType: Type = val.constructor.meta; valType; valType = valType.baseType) {
				if (valType.ctor === this.propertyType) {
					return true;
				}
			}

			return false;
		}

		//Data types
		else {
			var valObjectType = val.constructor;

			//"Normalize" data type in case it came from another frame as well as ensure that the types are the same
			switch (getTypeName(val)) {
				case "string":
					valObjectType = String;
					break;
				case "number":
					valObjectType = Number;
					break;
				case "boolean":
					valObjectType = Boolean;
					break;
				case "date":
					valObjectType = Date;
					break;
				case "array":
					valObjectType = Array;
					break;
			}

			// value property type check
			return valObjectType === this.propertyType ||

				// entity array type check
				(valObjectType === Array && this.isList && val.every(function (child: any) {
					if (child.constructor && child.constructor.meta) {
						for (var childType = child.constructor.meta; childType; childType = childType.baseType) {
							if (childType._jstype === this._jstype) {
								return true;
							}
						}

						return false;
					}
				}, this));
		}
	}

	value(obj: Entity = null, val: any = null, additionalArgs: any = null): any {
		var target = (this.isStatic ? this.containingType.ctor : obj);

		if (target === undefined || target === null) {
			throw new Error(`Cannot ${(arguments.length > 1 ? "set" : "get")} value for ${(this.isStatic ? "" : "non-")}static property \"${this.name}\" on type \"${this.containingType}\": target is null or undefined.`)
		}

		if (arguments.length > 1) {
			Property$_setter(this, obj, val, additionalArgs);
		} else {
			return Property$_getter(this, obj);
		}
	}

	// rootedPath(type: Type) {
	// 	if (this.isDefinedBy(type)) {
	// 		return this.isStatic ? this.containingType.fullName + "." + this.name : this.name;
	// 	}
	// }

	isInited(obj: Entity): boolean {

		var target = (this.isStatic ? this.containingType.ctor : obj);

		if (!target.hasOwnProperty(this.fieldName)) {
			// If the backing field has not been created, then property is not initialized
			return false;
		}

		/*
		// TODO: Implement list lazy loading?
		if (this.isList) {
			var value = target[this.fieldName];
			if (value === undefined || !LazyLoader.isLoaded(value)) {
				// If the list is not-loaded, then the property is not initialized
				return false;
			}
		}
		*/

		return true;

	}

}

export interface PropertyConstructor {
	new(containingType: Type, name: string, jstype: any, label: string, helptext: string, format: Format, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue?: any, origin?: string): Property;
}

export type PropertyGetMethod = (property: Property, entity: Entity, additionalArgs: any) => any;

export type PropertySetMethod = (property: Property, entity: Entity, val: any, additionalArgs: any, skipTypeCheck: boolean) => void;

export interface PropertyAddedEventArgs {
	property: Property;
}

export interface PropertyAccessEventHandler {
    (this: Entity, args: EventObject & PropertyAccessEventArgs): void;
}

export interface PropertyAccessEventArgs {
	entity: Entity;
	property: Property;
	value: any;
}

export interface PropertyChangeEventHandler {
    (this: Entity, args: EventObject & PropertyChangeEventArgs): void;
}

export interface PropertyChangeEventArgs {
	entity: Entity;
	property: Property;
	newValue: any,
	oldValue?: any,
}

export class PropertyEvents {
	readonly changedEvent: Event<Entity, PropertyChangeEventArgs>;
	readonly accessedEvent: Event<Entity, PropertyAccessEventArgs>;
	readonly ruleRegisteredEvent: Event<Property, RuleRegisteredEventArgs>;
	constructor() {
		this.changedEvent = new Event<Entity, PropertyChangeEventArgs>();
		this.accessedEvent = new Event<Entity, PropertyAccessEventArgs>();
		this.ruleRegisteredEvent = new Event<Property, RuleRegisteredEventArgs>();
	}
}

export interface PropertyRule extends Rule {

	/** The property that the rule targets */
	readonly property: Property;

}

// export function Property$isProperty(obj: any) {
// 	return obj instanceof Property;
// }

// export function Property$equals(prop1: Property | IPropertyChain, prop2: Property | IPropertyChain): boolean {

// 	if (prop1 === null || prop1 === undefined || prop2 === null || prop2 === undefined) {
// 		return;
// 	}

// 	if (PropertyChain$isPropertyChain(prop1)) {
// 		return (prop1 as PropertyChain).equals(prop2);
// 	}

// 	if (PropertyChain$isPropertyChain(prop2)) {
// 		return (prop2 as PropertyChain).equals(prop1);
// 	}

// 	if (Property$isProperty(prop1) && Property$isProperty(prop2)) {
// 		return prop1 === prop2;
// 	}

// }

export function Property$_generateShortcuts(property: Property, target: any, overwrite: boolean = null) {
	var shortcutName = "$" + property.name;

	if (!(Object.prototype.hasOwnProperty.call(target, shortcutName)) || overwrite) {
		target[shortcutName] = property;
	}
}

export function Property$_generateStaticProperty(property: Property, target: any) {

	Object.defineProperty(target, property.name, {
		configurable: false,
		enumerable: true,
		get: property.getter,
		set: property.setter
	});

}

export function Property$_generatePrototypeProperty(property: Property, target: any) {

	Object.defineProperty(target, property.name, {
		configurable: false,
		enumerable: true,
		get: property.getter,
		set: property.setter
	});

}

export function Property$_generateOwnProperty(property: Property, obj: Entity) {

	Object.defineProperty(obj, property.name, {
		configurable: false,
		enumerable: true,
		get: property.getter,
		set: property.setter
	});

}

// TODO: Get rid of `Property$_generateOwnPropertyWithClosure`...
export function Property$_generateOwnPropertyWithClosure(property: Property, obj: Entity & Entity) {

	let val: any = null;

	let isInitialized: boolean = false;

	var _ensureInited = function() {
		if (!isInitialized) {
			// Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
			if (!property.isCalculated) {
				Property$pendingInit(obj, property, false);

				val = Property$_getInitialValue(property);

				if (Array.isArray(val)) {
					Property$_subListEvents(obj, property, val as ObservableList<any>);
				}

				// TODO: Implement observer?
				obj._events.changedEvent.publish(obj, { entity: obj, property: property });
			}

			// Mark the property as pending initialization
			Property$pendingInit(obj, property, true);

			isInitialized = true;
		}
	};

	Object.defineProperty(obj, property.name, {
		configurable: false,
		enumerable: true,
		get: function() {
			_ensureInited();

			// Raise get events
			property._events.accessedEvent.publish(obj, { entity: obj, property, value: val });

			return val;
		},
		set: function (newVal) {
			_ensureInited();

			if (Property$_shouldSetValue(property, obj, val, newVal)) {
				let old = val;

				// Update lists as batch remove/add operations
				if (property.isList) {
					// TODO: Implement observable array update
					// old.beginUpdate();
					// update(old, newVal);
					// old.endUpdate();
					throw new Error("Property set on lists is not implemented.");
				} else {
					val = newVal;

					Property$pendingInit(obj, property, false);

					// Do not raise change if the property has not been initialized. 
					if (old !== undefined) {
						property._events.changedEvent.publish(obj, { entity: obj, property, newValue: val, oldValue: old });
					}
				}
			}	
		}
	});

}

export function Property$getRules(property: Property): PropertyRule[] {
	let prop = property as any;
	let propRules: PropertyRule[];
	if (prop._rules) {
		propRules = prop._rules;
	} else {
		propRules = [];
		Object.defineProperty(prop, "_rules", { enumerable: false, value: propRules, writable: false });
	}
	return propRules;
}

export function Property$pendingInit(obj: Entity | EntityConstructorForType<Entity>, prop: Property, value: boolean = null): boolean | void {
	let pendingInit: ObjectLiteral<boolean>;

	var target = (prop.isStatic ? prop.containingType.ctor : obj);

	if (Object.prototype.hasOwnProperty.call(target, "_pendingInit")) {
		pendingInit = (target as any)._pendingInit;
	} else {
		Object.defineProperty(target, "_pendingInit", { enumerable: false, value: (pendingInit = {}), writable: true });
	}

	if (arguments.length > 2) {
		if (value === false) {
			delete pendingInit[prop.name];
		} else {
			pendingInit[prop.name] = value;
		}
	} else {
		let storageTarget: any;
		if (prop.isStatic) {
			storageTarget = prop.containingType.ctor;
		} else {
			storageTarget = obj;
		}
		let currentValue = storageTarget[prop.fieldName];
		return currentValue === undefined || pendingInit[prop.name] === true;
	}
}

function Property$_subListEvents(obj: Entity, property: Property, list: ObservableList<any>) {

	list.changed.subscribe(function (args) {
		if ((args.added && args.added.length > 0) || (args.removed && args.removed.length > 0)) {
			// NOTE: property change should be broadcast before rules are run so that if 
			// any rule causes a roundtrip to the server these changes will be available
			// TODO: Implement notifyListChanged?
			// property.containingType.model.notifyListChanged(target, property, changes);

			// NOTE: oldValue is not currently implemented for lists
			var eventArgs: PropertyChangeEventArgs = { entity: obj, property, newValue: list };

			(eventArgs as any)['changes'] = [{ newItems: args.added, oldItems: args.removed }];
			(eventArgs as any)['collectionChanged'] = true;

			property._events.changedEvent.publish(obj, eventArgs);
			obj._events.changedEvent.publish(obj, { entity: obj, property });
		}
	});

}

function Property$_getInitialValue(property: Property) {
	var val = property.defaultValue;

    if (Array.isArray(val)) {
		val = ObservableList.ensureObservable(val as Array<any>);

		// Override the default toString on arrays so that we get a comma-delimited list
		// TODO: Implement toString on observable list?
		// val.toString = Property$_arrayToString.bind(val);
	}

	return val;
}

function Property$_ensureInited(property: Property, obj: Entity) {
	var target = (property.isStatic ? property.containingType.ctor : obj);

    // Determine if the property has been initialized with a value
    // and initialize the property if necessary
    if (!obj.hasOwnProperty(property.fieldName)) {

        // Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
        if (!property.isCalculated) {
			Property$pendingInit(target, property, false);

			let val = Property$_getInitialValue(property);

			Object.defineProperty(target, property.fieldName, { value: val, writable: true });

			if (Array.isArray(val)) {
				Property$_subListEvents(obj, property, val as ObservableList<any>);
			}

			// TODO: Implement observable?
			obj._events.changedEvent.publish(obj, { entity: obj, property });
        }

		// Mark the property as pending initialization
		Property$pendingInit(target, property, true);
    }
}

function Property$_getter(property: Property, obj: Entity) {

    // Ensure that the property has an initial (possibly default) value
	Property$_ensureInited(property, obj);

	// Raise access events
	property._events.accessedEvent.publish(obj, { entity: obj, property, value: (obj as any)[property.fieldName] });
	obj._events.accessedEvent.publish(obj, { entity: obj, property });

    // Return the property value
    return (obj as any)[property.fieldName];
}

function Property$_setter(property: Property, obj: Entity, val: any, additionalArgs: any = null, skipTypeCheck: boolean = false) {

    // Ensure that the property has an initial (possibly default) value
	Property$_ensureInited(property, obj);

    var old = (obj as any)[property.fieldName];

	if (Property$_shouldSetValue(property, obj, old, val, skipTypeCheck)) {
		Property$_setValue(property, obj, old, val, additionalArgs);
	}

}

function Property$_shouldSetValue(property: Property, obj: Entity, old: any, val: any, skipTypeCheck: boolean = false) {

    if (!property.canSetValue(obj, val)) {
        throw new Error("Cannot set " + property.name + "=" + (val === undefined ? "<undefined>" : val) + " for instance " + obj.meta.type.fullName + "|" + obj.meta.id + ": a value of type " + (property.propertyType && property.propertyType.meta ? property.propertyType.meta.fullName : parseFunctionName(property.propertyType)) + " was expected.");
    }

    // Update lists as batch remove/add operations
    if (property.isList) {
        throw new Error("Property set on lists is not permitted.");
    } else {

        // compare values so that this check is accurate for primitives
        var oldValue = (old === undefined || old === null) ? old : old.valueOf();
        var newValue = (val === undefined || val === null) ? val : val.valueOf();

        // Do nothing if the new value is the same as the old value. Account for NaN numbers, which are
        // not equivalent (even to themselves). Although isNaN returns true for non-Number values, we won't
        // get this far for Number properties unless the value is actually of type Number (a number or NaN).
        return (oldValue !== newValue && !(property.propertyType === Number && isNaN(oldValue) && isNaN(newValue)));
	}

}

function Property$_setValue(property: Property, obj: Entity, old: any, val: any, additionalArgs: any = null) {

    // Update lists as batch remove/add operations
    if (property.isList) {
        // TODO: Implement observable array update
        // old.beginUpdate();
        // update(old, val);
        // old.endUpdate();
        throw new Error("Property set on lists is not implemented.");
    } else {

		// Set or create the backing field value
		if (obj.hasOwnProperty(property.fieldName)) {
			(obj as any)[property.fieldName] = val;
		} else {
			Object.defineProperty(obj, property.fieldName, { value: val, writable: true });
		}

		Property$pendingInit(obj, property, false);

		// Do not raise change if the property has not been initialized. 
		if (old !== undefined) {
			var eventArgs: PropertyChangeEventArgs = { entity: obj, property, newValue: val, oldValue: old };
			property._events.changedEvent.publish(obj, additionalArgs ? merge(eventArgs, additionalArgs) : eventArgs);
			obj._events.changedEvent.publish(obj, { entity: obj, property });
		}
    }
}

function Property$_makeGetter(property: Property, getter: PropertyGetMethod) {
    return function (additionalArgs: any = null) {
        // ensure the property is initialized
        var result = getter(property, this, additionalArgs);

        /*
        // TODO: Implement lazy loading pattern?
        // ensure the property is initialized
        if (result === undefined || (property.isList && LazyLoader.isRegistered(result))) {
            throw new Error(
                `Property ${property.containingType.fullName}.${} is not initialized.  Make sure instances are loaded before accessing property values.  ${}|${}`);
                ,
                property.name,
                this.meta.type.fullName(),
                this.meta.id
            ));
        }
        */

        return result;
    };
}

function Property$_makeSetter(prop: Property, setter: PropertySetMethod, skipTypeCheck: boolean = false) {
    // TODO: Is setter "__notifies" needed?
    // setter.__notifies = true;

    return function (val: any, additionalArgs: any = null) {
        setter(prop, this, val, additionalArgs, skipTypeCheck);
    };
}

function Property$_addAccessedHandler(prop: Property, handler: (this: Entity, args: EventObject & PropertyAccessEventArgs) => void, obj: Entity = null): void {
	
	let property = prop as Property;

	let context: Entity = null;

	if (obj) {
		let innerHandler = handler;
		handler = function(this: Entity, args: PropertyAccessEventArgs) {
			if (args.entity === obj) {
				innerHandler.call(this, args);
			}
		};

		context = obj;
	}

	property._events.accessedEvent.subscribe(handler);

	property._propertyAccessSubscriptions.push({ handler, context });

}

export function Property$addAccessed(prop: Property | PropertyChain, handler: PropertyAccessEventHandler | PropertyChainAccessEventHandler, obj: Entity = null, toleratePartial: boolean = false): void {
	if (prop instanceof Property) {
		Property$_addAccessedHandler(prop, handler as PropertyAccessEventHandler, obj);
	} else if (prop instanceof PropertyChain) {
		PropertyChain$_addAccessedHandler(prop as any, handler as PropertyChainAccessEventHandler, obj, toleratePartial);
	} else {
		throw new Error("Invalid property passed to `Property$addAccessed(prop)`.");
	}
}

function Property$_addChangedHandler(prop: Property, handler: (this: Entity, args: EventObject & PropertyChangeEventArgs) => void, obj: Entity = null): void {

	let property = prop as Property;

	let context: Entity = null;

	if (obj) {
		let innerHandler = handler;
		handler = function (this: Entity, args: PropertyChangeEventArgs) {
			if (args.entity === obj) {
				innerHandler.call(this, args);
			}
		};

		context = obj;
	}

	property._events.changedEvent.subscribe(handler);

	(prop as any)._propertyChangeSubscriptions.push({ handler, context });

}

// starts listening for change events along the property chain on any known instances. Use obj argument to
// optionally filter the events to a specific object
export function Property$addChanged(prop: Property | PropertyChain, handler: PropertyChangeEventHandler | PropertyChainChangeEventHandler, obj: Entity = null, toleratePartial: boolean = false): void {
	if (prop instanceof Property) {
		Property$_addChangedHandler(prop, handler as PropertyChangeEventHandler, obj);
	} else if (prop instanceof PropertyChain) {
		PropertyChain$_addChangedHandler(prop as any, handler as PropertyChainChangeEventHandler, obj, toleratePartial);
	} else {
		throw new Error("Invalid property passed to `Property$addChanged(prop)`.");
	}
}

export function hasPropertyChangedSubscribers(prop: Property, obj: Entity) {
	let property = prop as Property;
	let subscriptions = property._propertyChangeSubscriptions;
	return subscriptions.length > 0 && subscriptions.some(s => s.context === obj);
}
