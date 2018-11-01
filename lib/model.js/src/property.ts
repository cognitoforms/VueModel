import { Type } from "./type";
import { Entity } from "./entity";
import { EventDispatcher, IEvent } from "ste-events";
import { getTypeName, getDefaultValue, parseFunctionName, toTitleCase } from "./helpers";
import { createSecret } from "./internals";
import { ObservableList } from "./observable-list";
import { Format } from "./format";

let fieldNamePrefix = createSecret('Property.fieldNamePrefix', 3, false, true, "_fN");

export interface PropertyEventArgs {
	property: Property,
}

export interface PropertyAccessEventArgs extends PropertyEventArgs {
	value: any,
}

export interface PropertyChangeEventArgs extends PropertyEventArgs {
	newValue: any,
	oldValue: any,
}

class PropertyEventDispatchers {

	readonly changed: EventDispatcher<Entity, PropertyChangeEventArgs>;

	readonly accessed: EventDispatcher<Entity, PropertyAccessEventArgs>;

	constructor() {
		this.changed = new EventDispatcher<Entity, PropertyChangeEventArgs>();
		this.accessed = new EventDispatcher<Entity, PropertyAccessEventArgs>();
	}

}

type PropertyGetMethod = (property: Property, entity: Entity, additionalArgs: any) => any;

type PropertySetMethod = (property: Property, entity: Entity, val: any, additionalArgs: any, skipTypeCheck: boolean) => void;

export class Property {

	// Public read-only properties: aspects of the property that cannot be
	// changed without fundamentally changing what the property is
	readonly containingType: Type;
	readonly name: string;
	readonly jstype: any;
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

	readonly _eventDispatchers: PropertyEventDispatchers;

	readonly _getter: (args?: any) => any;
	readonly _setter: (value: any, args?: any) => void;

	constructor(containingType: Type, name: string, jstype: any, label: string, helptext: string, format: Format, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue: any = undefined, origin: string = containingType.originForNewProperties) {

		// Public read-only properties
		Object.defineProperty(this, "containingType", { enumerable: true, value: containingType });
		Object.defineProperty(this, "name", { enumerable: true, value: name });
		Object.defineProperty(this, "jstype", { enumerable: true, value: jstype });
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

		Object.defineProperty(this, "_eventDispatchers", { value: new PropertyEventDispatchers() });

		Object.defineProperty(this, "_getter", { value: Property$_makeGetter(this, Property$_getter) });
		Object.defineProperty(this, "_setter", { value: Property$_makeSetter(this, Property$_setter) });

		if (this.origin === "client" && this.isPersisted) {
			// TODO: Warn about client-origin property marked as persisted?
			// logWarning($format("Client-origin properties should not be marked as persisted: Type = {0}, Name = {1}", containingType.get_fullName(), name));
		}
	}

	get fieldName(): string {
		return fieldNamePrefix + "_" + this.name;
	}

	get changedEvent(): IEvent<Entity, PropertyChangeEventArgs> {
		return this._eventDispatchers.changed.asEvent();
	}

	get accessedEvent(): IEvent<Entity, PropertyAccessEventArgs> {
		return this._eventDispatchers.accessed.asEvent();
	}

	equals(prop: Property /* | PropertyChain */ ) {
		if (prop !== undefined && prop !== null) {
			if (prop instanceof Property) {
				return this === prop;
			}
			// TODO: Implement property chain
			// else if (prop instanceof PropertyChain) {
			// 	var props = prop.all();
			// 	return props.length === 1 && this.equals(props[0]);
			// }
		}
	}

	toString() {
		if (this.isStatic) {
			return this.getPath();
		} else {
			return `this<${this.containingType}>.${this.name}`;
		}
	}

	isDefinedBy(type: Type) {
		return this.containingType === type || type.isSubclassOf(this.containingType);
	}

	get label(): string {
		return this._label || toTitleCase(this.name.replace(/([^A-Z]+)([A-Z])/g, "$1 $2"));
	}

	get format(): Format {
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
			return getDefaultValue(this.isList, this.jstype);
		}
	}

	getPath(): string {
		return this.isStatic ? (this.containingType.fullName + "." + this.name) : this.name;
	}

	canSetValue(obj: Entity, val: any) {
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
				if (valType.jstype === this.jstype) {
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
			return valObjectType === this.jstype ||

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

	value(obj: Entity = null, val: any = null, additionalArgs: any = null) {
		var target = (this.isStatic ? this.containingType.jstype : obj);

		if (target === undefined || target === null) {
			throw new Error(`Cannot ${(arguments.length > 1 ? "set" : "get")} value for ${(this.isStatic ? "" : "non-")}static property \"${this.getPath()}\" on type \"${this.containingType.fullName}\": target is null or undefined.`)
		}

		if (arguments.length > 1) {
			Property$_setter(this, obj, val, additionalArgs);
		} else {
			return Property$_getter(this, obj);
		}
	}

	rootedPath(type: Type) {
		if (this.isDefinedBy(type)) {
			return this.isStatic ? this.containingType.fullName + "." + this.name : this.name;
		}
	}

}

export interface PropertyConstructor {
	new(containingType: Type, name: string, jstype: any, label: string, helptext: string, format: Format, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue?: any, origin?: string): Property;
}

export function Property$_generateShortcuts(property: Property, target: any, recurse: boolean = true, overwrite: boolean = null) {
	var shortcutName = "$" + property.name;

	if (!(Object.prototype.hasOwnProperty.call(target, shortcutName)) || overwrite) {
		target[shortcutName] = property;
	}

	if (recurse) {
		if (overwrite == null) {
			overwrite = false;
		}

		property.containingType.derivedTypes.forEach(function (t) {
			Property$_generateShortcuts(property, t, true, overwrite);
		});
	}
}

export function Property$_generateStaticProperty(property: Property) {

	Object.defineProperty(property.containingType.jstype, property.name, {
		configurable: false,
		enumerable: true,
		get: property._getter,
		set: property._setter
	});

}

export function Property$_generatePrototypeProperty(property: Property) {

	Object.defineProperty(property.containingType.jstype.prototype, property.name, {
		configurable: false,
		enumerable: true,
		get: property._getter,
		set: property._setter
	});

}

export function Property$_generateOwnProperty(property: Property, obj: Entity) {

	Object.defineProperty(obj, property.name, {
		configurable: false,
		enumerable: true,
		get: property._getter,
		set: property._setter
	});

}

// TODO: Get rid of `Property$_generateOwnPropertyWithClosure`...
export function Property$_generateOwnPropertyWithClosure(property: Property, obj: Entity) {

	let val: any = null;

	let isInitialized: boolean = false;

	var _ensureInited = function() {
		if (!isInitialized) {
			// Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
			if (!property.isCalculated) {
				// TODO: Implement pendingInit
				// target.meta.pendingInit(property, false);

				val = Property$_getInitialValue(property);

				if (Array.isArray(val)) {
					Property$_subListEvents(obj, property, val as ObservableList<any>);
				}

				// TODO: Implement observer?
				// Observer.raisePropertyChanged(obj, property._name);
			}

			// TODO: Implement pendingInit
			// Mark the property as pending initialization
			// obj.meta.pendingInit(property, true);

			isInitialized = true;
		}
	};

	Object.defineProperty(obj, property.name, {
		configurable: false,
		enumerable: true,
		get: function() {
			_ensureInited();

			// Raise get events
			property._eventDispatchers.accessed.dispatch(obj, { property, value: val });

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

					// TODO: Implement pendingInit
					// obj.meta.pendingInit(property, false);

					// Do not raise change if the property has not been initialized. 
					if (old !== undefined) {
						property._eventDispatchers.changed.dispatch(obj, { property, newValue: val, oldValue: old });
					}
				}
			}	
		}
	});

}

function Property$_subListEvents(obj: Entity, property: Property, list: ObservableList<any>) {

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

			property._eventDispatchers.changed.dispatch(obj, eventArgs);

			// TODO: Implement observer?
			// Observer.raisePropertyChanged(target, property._name);
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
    // Determine if the property has been initialized with a value
    // and initialize the property if necessary
    if (!obj.hasOwnProperty(property.fieldName)) {

        // Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
        if (!property.isCalculated) {
			var target = (property.isStatic ? property.containingType.jstype : obj);

			// TODO: Implement pendingInit
			// target.meta.pendingInit(property, false);

			let val = Property$_getInitialValue(property);

			Object.defineProperty(target, property.fieldName, { value: val, writable: true });

			if (Array.isArray(val)) {
				Property$_subListEvents(obj, property, val as ObservableList<any>);
			}

			// TODO: Implement observable?
			// Observer.raisePropertyChanged(target, property._name);
        }

        // TODO: Implement pendingInit
        // Mark the property as pending initialization
        // obj.meta.pendingInit(property, true);
    }
}

function Property$_getter(property: Property, obj: Entity) {

    // Ensure that the property has an initial (possibly default) value
	Property$_ensureInited(property, obj);

	var eventArgs: PropertyAccessEventArgs = { property: property, value: (obj as any)[property.fieldName] };

	// Raise get events
	property._eventDispatchers.accessed.dispatch(obj, eventArgs);

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
        throw new Error("Cannot set " + property.name + "=" + (val === undefined ? "<undefined>" : val) + " for instance " + obj.meta.type.fullName + "|" + obj.meta.id + ": a value of type " + (property.jstype && property.jstype.meta ? property.jstype.meta.fullName : parseFunctionName(property.jstype)) + " was expected.");
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
        return (oldValue !== newValue && !(property.jstype === Number && isNaN(oldValue) && isNaN(newValue)));
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

		// Set the backing field value
		(obj as any)[property.fieldName] = val;

		// TODO: Implement pendingInit
		// obj.meta.pendingInit(property, false);

		// Do not raise change if the property has not been initialized. 
		if (old !== undefined) {
			var eventArgs: PropertyChangeEventArgs = { property: property, newValue: val, oldValue: old };

			if (additionalArgs) {
				for (var arg in additionalArgs) {
					if (additionalArgs.hasOwnProperty(arg)) {
						(eventArgs as any)[arg] = additionalArgs[arg];
					}
				}
			}

			property._eventDispatchers.changed.dispatch(obj, eventArgs);
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
