import { EventDispatcher, IEvent } from "ste-events";
import { Entity as IEntity } from "./interfaces";
import { Format as IFormat } from "./interfaces";
import { ObjectMeta as IObjectMeta } from "./interfaces";
import { ObjectMeta } from "./object-meta";
import { EventRegistration } from "./interfaces";
import { Property as IProperty, PropertyGetMethod, PropertySetMethod, PropertyEventDispatchers, PropertyChangeEventArgs, PropertyAccessEventArgs, PropertyAccessEventHandler, PropertyChangeEventHandler } from "./interfaces";
import { PropertyChain as IPropertyChain } from "./interfaces";
import { Type as IType } from "./interfaces";
import { Type$isType } from "./type";
import { getTypeName, getDefaultValue, parseFunctionName, toTitleCase, ObjectLiteral, merge } from "./helpers";
import { createSecret } from "./internals";
import { ObservableList } from "./observable-list";
import { PropertyChain$_addChangedHandler, PropertyChain$_addAccessedHandler, PropertyChain$isPropertyChain } from "./property-chain";
import { Entity$_getEventDispatchers } from "./entity";

let fieldNamePrefix = createSecret('Property.fieldNamePrefix', 3, false, true, "_fN");

export class Property implements IProperty {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the object is
	readonly containingType: IType;
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
	private _format: IFormat;
	private _origin: string;
	private _defaultValue: any;

	readonly _propertyAccessSubscriptions: EventRegistration<IEntity, PropertyAccessEventHandler>[];
	readonly _propertyChangeSubscriptions: EventRegistration<IEntity, PropertyChangeEventHandler>[];
	readonly _eventDispatchers: PropertyEventDispatchers;

	readonly getter: (args?: any) => any;
	readonly setter: (value: any, args?: any) => void;

	constructor(containingType: IType, name: string, jstype: any, label: string, helptext: string, format: IFormat, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue: any = undefined, origin: string = containingType.originForNewProperties) {

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
		if (origin) Object.defineProperty(this, "_origin", { enumerable: false, value: containingType.originForNewProperties, writable: true });
		if (defaultValue) Object.defineProperty(this, "_defaultValue", { enumerable: false, value: defaultValue, writable: true });

		Object.defineProperty(this, "_propertyAccessSubscriptions", { value: [] });
		Object.defineProperty(this, "_propertyChangeSubscriptions", { value: [] });
		Object.defineProperty(this, "_eventDispatchers", { value: new PropertyEventDispatchersImplementation() });

		Object.defineProperty(this, "getter", { value: Property$_makeGetter(this, Property$_getter) });
		Object.defineProperty(this, "setter", { value: Property$_makeSetter(this, Property$_setter) });

		if (this.origin === "client" && this.isPersisted) {
			// TODO: Warn about client-origin property marked as persisted?
			// logWarning($format("Client-origin properties should not be marked as persisted: Type = {0}, Name = {1}", containingType.get_fullName(), name));
		}
	}

	get fieldName(): string {
		return fieldNamePrefix + "_" + this.name;
	}

	get changedEvent(): IEvent<IEntity, PropertyChangeEventArgs> {
		return this._eventDispatchers.changedEvent.asEvent();
	}

	get accessedEvent(): IEvent<IEntity, PropertyAccessEventArgs> {
		return this._eventDispatchers.accessedEvent.asEvent();
	}

	equals(prop: IProperty | IPropertyChain): boolean {

		if (prop === null || prop === undefined) {
			return;
		}

		if (PropertyChain$isPropertyChain(prop)) {
			return (prop as IPropertyChain).equals(this);
		}

		if (prop instanceof Property) {
			return this === prop;
		}

	}

	toString() {
		if (this.isStatic) {
			return this.getPath();
		} else {
			return `this<${this.containingType}>.${this.name}`;
		}
	}

	get label(): string {
		return this._label || toTitleCase(this.name.replace(/([^A-Z]+)([A-Z])/g, "$1 $2"));
	}

	get format(): IFormat {
		// TODO: Compile format from specifier if needed
		return this._format;
	}

	get origin(): string {
		return this._origin ? this._origin : this.containingType.origin;
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

	getPath(): string {
		return this.isStatic ? (this.containingType.fullName + "." + this.name) : this.name;
	}

	canSetValue(obj: IEntity, val: any): boolean {
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
			for (var valType: IType = val.constructor.meta; valType; valType = valType.baseType) {
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

	value(obj: IEntity = null, val: any = null, additionalArgs: any = null): any {
		var target = (this.isStatic ? this.containingType.ctor : obj);

		if (target === undefined || target === null) {
			throw new Error(`Cannot ${(arguments.length > 1 ? "set" : "get")} value for ${(this.isStatic ? "" : "non-")}static property \"${this.getPath()}\" on type \"${this.containingType.fullName}\": target is null or undefined.`)
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

	isInited(obj: IEntity): boolean {

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

class PropertyEventDispatchersImplementation implements PropertyEventDispatchers {
	readonly changedEvent: EventDispatcher<IEntity, PropertyChangeEventArgs>;
	readonly accessedEvent: EventDispatcher<IEntity, PropertyAccessEventArgs>;
	constructor() {
		this.changedEvent = new EventDispatcher<IEntity, PropertyChangeEventArgs>();
		this.accessedEvent = new EventDispatcher<IEntity, PropertyAccessEventArgs>();
	}
}

export function Property$isProperty(obj: any) {
	return obj instanceof Property;
}

export function Property$equals(prop1: IProperty | IPropertyChain, prop2: IProperty | IPropertyChain): boolean {

	if (prop1 === null || prop1 === undefined || prop2 === null || prop2 === undefined) {
		return;
	}

	if (PropertyChain$isPropertyChain(prop1)) {
		return (prop1 as IPropertyChain).equals(prop2);
	}

	if (PropertyChain$isPropertyChain(prop2)) {
		return (prop2 as IPropertyChain).equals(prop1);
	}

	if (prop1 instanceof Property && prop2 instanceof Property) {
		return prop1 === prop2;
	}

}

export function Property$_generateShortcuts(property: IProperty, target: any, recurse: boolean = true, overwrite: boolean = null) {
	var shortcutName = "$" + property.name;

	if (!(Object.prototype.hasOwnProperty.call(target, shortcutName)) || overwrite) {
		target[shortcutName] = property;
	}

	if (recurse) {
		if (overwrite == null) {
			overwrite = false;
		}

		property.containingType.derivedTypes.forEach(function (t: IType) {
			Property$_generateShortcuts(property, t, true, overwrite);
		});
	}
}

export function Property$_generateStaticProperty(property: IProperty) {

	Object.defineProperty(property.containingType.ctor, property.name, {
		configurable: false,
		enumerable: true,
		get: property.getter,
		set: property.setter
	});

}

export function Property$_generatePrototypeProperty(property: IProperty) {

	Object.defineProperty(property.containingType.ctor.prototype, property.name, {
		configurable: false,
		enumerable: true,
		get: property.getter,
		set: property.setter
	});

}

export function Property$_generateOwnProperty(property: IProperty, obj: IEntity) {

	Object.defineProperty(obj, property.name, {
		configurable: false,
		enumerable: true,
		get: property.getter,
		set: property.setter
	});

}

export function Property$_getEventDispatchers(prop: IProperty): PropertyEventDispatchers {
	return (prop as any)._eventDispatchers as PropertyEventDispatchers;
}

export function Property$_dispatchEvent<TSender, TArgs>(prop: IProperty, eventName: string, sender: TSender, args: TArgs): void {
	let dispatchers = Property$_getEventDispatchers(prop) as { [eventName: string]: any };
	let dispatcher = dispatchers[eventName + "Event"] as EventDispatcher<TSender, TArgs>;
	dispatcher.dispatch(sender, args);
}

// TODO: Get rid of `Property$_generateOwnPropertyWithClosure`...
export function Property$_generateOwnPropertyWithClosure(property: Property, obj: IEntity) {

	let val: any = null;

	let isInitialized: boolean = false;

	var _ensureInited = function() {
		if (!isInitialized) {
			// Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
			if (!property.isCalculated) {
				Property$pendingInit(obj.meta, property, false);

				val = Property$_getInitialValue(property);

				if (Array.isArray(val)) {
					Property$_subListEvents(obj, property, val as ObservableList<any>);
				}

				// TODO: Implement observer?
				Entity$_getEventDispatchers(obj).changedEvent.dispatch(property, { entity: obj, property: property });
			}

			// Mark the property as pending initialization
			Property$pendingInit(obj.meta, property, true);

			isInitialized = true;
		}
	};

	Object.defineProperty(obj, property.name, {
		configurable: false,
		enumerable: true,
		get: function() {
			_ensureInited();

			// Raise get events
			Property$_dispatchEvent<IEntity, PropertyAccessEventArgs>(property, "accessed", obj, { property, value: val });

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

					Property$pendingInit(obj.meta, property, false);

					// Do not raise change if the property has not been initialized. 
					if (old !== undefined) {
						Property$_dispatchEvent<IEntity, PropertyChangeEventArgs>(property, "changed", obj, { property, newValue: val, oldValue: old });
					}
				}
			}	
		}
	});

}

export function Property$pendingInit(target: IType | IObjectMeta, prop: IProperty, value: boolean = null): boolean | void {
	let pendingInit: ObjectLiteral<boolean>;

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
		let storage: any;
		if (Type$isType(target)) {
			storage = (target as IType).ctor;
		} else if (target instanceof ObjectMeta) {
			storage = (target as IObjectMeta).entity;
		}
		let currentValue = storage[prop.fieldName];
		return currentValue === undefined || pendingInit[prop.name] === true;
	}
}

function Property$_subListEvents(obj: IEntity, property: IProperty, list: ObservableList<any>) {

	list.changed.subscribe(function (sender, args) {
		if ((args.added && args.added.length > 0) || (args.removed && args.removed.length > 0)) {
			// NOTE: property change should be broadcast before rules are run so that if 
			// any rule causes a roundtrip to the server these changes will be available
			// TODO: Implement notifyListChanged?
			// property.containingType.model.notifyListChanged(target, property, changes);

			// NOTE: oldValue is not currently implemented for lists
			var eventArgs: PropertyChangeEventArgs = { property: property, newValue: list, oldValue: undefined };

			(eventArgs as any)['changes'] = [{ newItems: args.added, oldItems: args.removed }];
			(eventArgs as any)['collectionChanged'] = true;

			Property$_getEventDispatchers(property).changedEvent.dispatch(obj, eventArgs);

			// TODO: Implement observer?
			Entity$_getEventDispatchers(obj).changedEvent.dispatch(property, { entity: obj, property: property });
		}
	});

}

function Property$_getInitialValue(property: IProperty) {
	var val = property.defaultValue;

    if (Array.isArray(val)) {
		val = ObservableList.ensureObservable(val as Array<any>);

		// Override the default toString on arrays so that we get a comma-delimited list
		// TODO: Implement toString on observable list?
		// val.toString = Property$_arrayToString.bind(val);
	}

	return val;
}

function Property$_ensureInited(property: Property, obj: IEntity) {
	var target = (property.isStatic ? property.containingType.ctor : obj);

    // Determine if the property has been initialized with a value
    // and initialize the property if necessary
    if (!obj.hasOwnProperty(property.fieldName)) {

        // Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
        if (!property.isCalculated) {
			Property$pendingInit(target.meta, property, false);

			let val = Property$_getInitialValue(property);

			Object.defineProperty(target, property.fieldName, { value: val, writable: true });

			if (Array.isArray(val)) {
				Property$_subListEvents(obj, property, val as ObservableList<any>);
			}

			// TODO: Implement observable?
			Entity$_getEventDispatchers(obj).changedEvent.dispatch(property, { entity: obj, property: property });
        }

		// Mark the property as pending initialization
		Property$pendingInit(target.meta, property, true);
    }
}

function Property$_getter(property: Property, obj: IEntity) {

    // Ensure that the property has an initial (possibly default) value
	Property$_ensureInited(property, obj);

	// Raise access events
	Property$_getEventDispatchers(property).accessedEvent.dispatch(obj, { property: property, value: (obj as any)[property.fieldName] });
	Entity$_getEventDispatchers(obj).accessedEvent.dispatch(property, { entity: obj, property: property });

    // Return the property value
    return (obj as any)[property.fieldName];
}

function Property$_setter(property: Property, obj: IEntity, val: any, additionalArgs: any = null, skipTypeCheck: boolean = false) {

    // Ensure that the property has an initial (possibly default) value
	Property$_ensureInited(property, obj);

    var old = (obj as any)[property.fieldName];

	if (Property$_shouldSetValue(property, obj, old, val, skipTypeCheck)) {
		Property$_setValue(property, obj, old, val, additionalArgs);
	}

}

function Property$_shouldSetValue(property: Property, obj: IEntity, old: any, val: any, skipTypeCheck: boolean = false) {

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

function Property$_setValue(property: Property, obj: IEntity, old: any, val: any, additionalArgs: any = null) {

    // Update lists as batch remove/add operations
    if (property.isList) {
        // TODO: Implement observable array update
        // old.beginUpdate();
        // update(old, val);
        // old.endUpdate();
        throw new Error("Property set on lists is not implemented.");
    } else {

		// Set the backing field value
		(obj as any)[property.fieldName] = val;

		Property$pendingInit(obj.meta, property, false);

		// Do not raise change if the property has not been initialized. 
		if (old !== undefined) {
			var eventArgs: PropertyChangeEventArgs = { property: property, newValue: val, oldValue: old };
			Property$_getEventDispatchers(property).changedEvent.dispatch(obj, additionalArgs ? merge(eventArgs, additionalArgs) : eventArgs);
			Entity$_getEventDispatchers(obj).changedEvent.dispatch(property, { entity: obj, property: property });
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

function Property$_addAccessedHandler(prop: IProperty, handler: (sender: IEntity, args: PropertyAccessEventArgs) => void, obj: IEntity = null): () => void {
	
	let property = prop as Property;

	let unsubscribe: () => void;

	let sender: IEntity = null;

	if (obj) {
		let innerHandler = handler;
		handler = (sender: IEntity, args: PropertyAccessEventArgs) => {
			if (sender === obj) {
				innerHandler(sender, args);
			}
		};

		sender = obj;
	}

	unsubscribe = property._eventDispatchers.accessedEvent.subscribe(handler);

	property._propertyAccessSubscriptions.push({ handler, sender, unsubscribe });

	return unsubscribe;

}

export function Property$addAccessed(prop: IProperty | IPropertyChain, handler: (sender: IEntity, args: any) => void, obj: IEntity = null, toleratePartial: boolean = false): () => void {
	if (prop instanceof Property) {
		return Property$_addAccessedHandler(prop, handler, obj);
	} else if (PropertyChain$isPropertyChain(prop)) {
		return PropertyChain$_addAccessedHandler(prop as any, handler, obj, toleratePartial);
	} else {
		throw new Error("Invalid property passed to `Property$addAccessed(prop)`.");
	}
}

export function Property$_addChangedHandler(prop: IProperty, handler: (sender: IEntity, args: PropertyChangeEventArgs) => void, obj: IEntity = null): () => void {

	let property = prop as Property;

	let unsubscribe: () => void;

	let sender: IEntity = null;

	if (obj) {
		let innerHandler = handler;
		handler = (sender: IEntity, args: PropertyChangeEventArgs) => {
			if (sender === obj) {
				innerHandler(sender, args);
			}
		};

		sender = obj;
	}

	unsubscribe = property._eventDispatchers.changedEvent.subscribe(handler);

	(prop as any)._propertyChangeSubscriptions.push({ handler, sender, unsubscribe });

	return unsubscribe;

}

// starts listening for change events along the property chain on any known instances. Use obj argument to
// optionally filter the events to a specific object
export function Property$addChanged(prop: IProperty | IPropertyChain, handler: (sender: IEntity, args: any) => void, obj: IEntity = null, toleratePartial: boolean = false): () => void {
	if (prop instanceof Property) {
		return Property$_addChangedHandler(prop, handler, obj);
	} else if (PropertyChain$isPropertyChain(prop)) {
		return PropertyChain$_addChangedHandler(prop as any, handler, obj, toleratePartial);
	} else {
		throw new Error("Invalid property passed to `Property$addChanged(prop)`.");
	}
}

export function hasPropertyChangedSubscribers(prop: IProperty, obj: IEntity) {
	let property = prop as Property;
	let subscriptions = property._propertyChangeSubscriptions;
	return subscriptions.length > 0 && subscriptions.some(s => s.sender === obj);
}
