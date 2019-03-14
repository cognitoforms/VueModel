import { Event, EventSubscriber, EventPublisher } from "./events";
import { Entity, EntityConstructorForType } from "./entity";
import { Format } from "./format";
import { Type, PropertyType, isEntityType, Value, isValue } from "./type";
import { PropertyChain } from "./property-chain";
import { getTypeName, getDefaultValue, parseFunctionName, ObjectLookup, merge, getConstructorName, isType } from "./helpers";
import { ObservableArray, updateArray } from "./observable-array";
import { Rule } from "./rule";
import { CalculatedPropertyRule, CalculatedPropertyRuleOptions } from "./calculated-property-rule";
import { PathTokens$normalizePaths } from "./path-tokens";
import { StringFormatRule } from "./string-format-rule";
import { ConditionRuleOptions } from "./condition-rule";
import { AllowedValuesRuleOptions } from "./allowed-values-rule";
import { ValidatedPropertyRuleOptions, ValidatedPropertyRule } from "./validated-property-rule";
import { AllowedValuesRule } from "./allowed-values-rule";
import { RequiredRule } from "./required-rule";
import { PropertyPath, PropertyAccessEventArgs, PropertyChangeEventArgs } from "./property-path";

export class Property implements PropertyPath {

	readonly containingType: Type;
	readonly name: string;
	readonly propertyType: PropertyType;
	readonly isList: boolean;
	readonly isStatic: boolean;

	label: string;
	helptext: string;
	isCalculated: boolean;
	format: Format<any>;

	private _defaultValue: any;

	readonly rules: PropertyRule[];

	readonly getter: (args?: any) => any;
	readonly setter: (value: any, args?: any) => void;

	readonly changed: EventSubscriber<Entity, PropertyChangeEventArgs>;
	readonly accessed: EventSubscriber<Entity, PropertyAccessEventArgs>;

	constructor(containingType: Type, name: string, propertyType: PropertyType, isList: boolean, isStatic: boolean, options?: PropertyOptions) {

		this.containingType = containingType;
		this.name = name;
		this.propertyType = propertyType;
		this.isList = isList;
		this.isStatic = isStatic;
		this.rules = [];
		this.getter = Property$_makeGetter(this, Property$_getter);
		this.setter = Property$_makeSetter(this, Property$_setter);
		this.changed = new Event<Entity, PropertyChangeEventArgs>();
		this.accessed = new Event<Entity, PropertyAccessEventArgs>();

		// Apply property options
		if (options)
			this.extend(options);

	}

	get fieldName(): string {
		return this.containingType.model._fieldNamePrefix + "_" + this.name;
	}

	get path(): string {
		return this.isStatic ? (this.containingType + "." + this.name) : this.name;
	}

	get defaultValue() {
		if (Object.prototype.hasOwnProperty.call(this, '_defaultValue')) {
			// clone array and date defaults since they are mutable javascript types
			return this._defaultValue instanceof Array ? this._defaultValue.slice() :
				this._defaultValue instanceof Date ? new Date(+this._defaultValue) :
					// TODO: Implement TimeSpan class/type?
					// this._defaultValue instanceof TimeSpan ? new TimeSpan(this._defaultValue.totalMilliseconds) :
					this._defaultValue;
		}
		else {
			return getDefaultValue(this.isList, this.propertyType);
		}
	}

	private static isPropOptions(obj: any): obj is PropertyValueFunctionAndDependencies {
		return isType<PropertyValueFunctionAndDependencies>(obj, d => getTypeName(d) === "object");
	}

	extend(options: PropertyOptions, targetType?: Type) {
		if (!targetType)
			targetType = this.containingType;

		// Utility function to convert a path string into a resolved array of Property and PropertyChain instances
		let resolveDependsOn = (property: Property, rule: string, dependsOn: string): PropertyPath[] => {
			
			// return an empty dependency array if no path was specified
			if (!dependsOn)
				return [];

			// throw an exception if dependsOn is not a string
			if (typeof(dependsOn) !== "string")
				throw new Error(`Invalid dependsOn property for '${rule}' rule on '${property}.`);
			let paths = PathTokens$normalizePaths([dependsOn]).map(t => t.expression) : [];
		};

		// Use prepare() to defer property path resolution while the model is being extended
		targetType.model.prepare(() => {

			// Label
			if (options.label)
				this.label = options.label;
			else if (!this.label)
				this.label = this.name.replace(/(^[a-z]+|[A-Z]{2,}(?=[A-Z][a-z]|$)|[A-Z][a-z]*)/g, " $1").trim();

			// Helptext
			this.helptext = options.helptext;

			// Format
			if (options.format) {
				if (typeof (options.format) === "string") {
					let format = options.format;
					targetType.model.ready(() => {
						this.format = targetType.model.getFormat(this.propertyType, format);
					});
				}
				else if (options.format instanceof Format) {
					// TODO: convert description/expression/reformat into a Format object
					this.format = options.format;
				} else if (isType<PropertyFormatOptions>(options.format, (f: any) => getTypeName(f) === "object" && f.expression)) {

					let rule = new StringFormatRule(targetType, {
						property: this,
						description: options.format.description,
						expression: options.format.expression,
						reformat: options.format.reformat,
					});

					targetType.model.ready(() => {
						rule.register();
					});

				} else {
					throw new Error(`Invalid property 'format' option of type '${getTypeName(options.format)}'.`);
				}
			}

			// Get - calculated property
			if (options.get) {
				if (typeof (options.get) === "function") {
					options.get = { function: options.get, dependsOn: "" };
				}

				if (Property.isPropOptions(options.get)) {
					let ruleName: string = null;
					let ruleOptions: CalculatedPropertyRuleOptions;

					if (typeof (options.get.function) !== "function") {
						throw new Error(`Invalid property 'get' function of type '${getTypeName(options.get.function)}'.`);
					}

					ruleOptions = {
						property: this,
						calculate: options.get.function,
						onChangeOf: resolveDependsOn("get", options.get.dependsOn)
					};

					let rule = new CalculatedPropertyRule(targetType, ruleName, ruleOptions);

					targetType.model.ready(() => {
						rule.register();
					});
				} else {
					throw new Error(`Invalid property 'get' option of type '${getTypeName(options.get)}'.`);
				}
			}

			// Default value or function
			if (options.default) {
				let defaultConstant: Value;

				if (typeof (options.default) === "function") {
					// Always generate a rule for default function
					options.default = { function: options.default, dependsOn: "" };
				} else if (isValue(options.default)) {
					// Constant
					defaultConstant = options.default;

					// Can't set default contant value for entity-typed property
					if (isEntityType(this.propertyType)) {
						throw new Error(`Cannot set a constant default value for a property of type '${this.propertyType.meta.fullName}'.`);
					}

					// Verify that the contant value is of the proper built-in type
					let defaultOptionTypeName = getTypeName(defaultConstant);
					let propertyTypeName = getConstructorName(this.propertyType).toLowerCase();
					if (defaultOptionTypeName !== propertyTypeName) {
						throw new Error(`Cannot set a default value of type '${defaultOptionTypeName}' for a property of type '${propertyTypeName}'.`);
					}

					// If extending baseType property specifically for a child type, use a rule 
					if (this.containingType === targetType)
					 	this._defaultValue = defaultConstant;
					else
						options.default = { function: function () { return defaultConstant; }, dependsOn: "" };
				}

				if (Property.isPropOptions(options.default)) {
					let ruleName: string = null;
					let ruleOptions: CalculatedPropertyRuleOptions;

					if (typeof (options.default.function) !== "function") {
						throw new Error(`Invalid property 'default' function of type '${getTypeName(options.default.function)}'.`);
					}

					if (options.default.dependsOn && typeof (options.default.dependsOn) !== "string") {
						throw new Error(`Invalid property 'default' dependsOn of type '${getTypeName(options.default.dependsOn)}'.`);
					}

					let ruleOnChangeOf = options.default.dependsOn ? PathTokens$normalizePaths([options.default.dependsOn]).map(t => t.expression) : [];

					ruleOptions = {
						property: this,
						calculate: options.default.function,
						onChangeOf: ruleOnChangeOf,
						isDefaultValue: true
					};	

					let rule = new CalculatedPropertyRule(targetType, ruleName, ruleOptions);

					targetType.model.ready(() => {
						rule.register();
					});
				} else if (typeof defaultConstant === "undefined") {
					throw new Error(`Invalid property 'default' option of type '${getTypeName(options.default)}'.`);
				}
			}

			// Allowed Values
			if (options.allowedValues) {
				if (typeof (options.allowedValues) === "function") {
					let originalAllowedValues = options.allowedValues;
					let allowedValuesFunction = function (this: Entity) { return originalAllowedValues.call(this) };
					options.get = { function: allowedValuesFunction, dependsOn: "" };
				}

				if (Property.isPropOptions(options.allowedValues)) {
					let ruleName: string = null;
					let ruleOptions: AllowedValuesRuleOptions;

					if (typeof (options.allowedValues.function) !== "function") {
						throw new Error(`Invalid property 'allowedValues' function of type '${getTypeName(options.allowedValues.function)}'.`);
					}

					if (options.allowedValues.dependsOn && typeof (options.allowedValues.dependsOn) !== "string") {
						throw new Error(`Invalid property 'allowedValues' dependsOn of type '${getTypeName(options.allowedValues.dependsOn)}'.`);
					}

					let ruleOnChangeOf = options.allowedValues.dependsOn ? PathTokens$normalizePaths([options.allowedValues.dependsOn]).map(t => t.expression) : [];

					ruleOptions = {
						property: this,
						source: options.allowedValues.function,
						onChangeOf: ruleOnChangeOf
					};

					let rule = new AllowedValuesRule(targetType, ruleOptions);

					targetType.model.ready(() => {
						rule.register();
					});
				} else {
					throw new Error(`Invalid property 'get' option of type '${getTypeName(options.get)}'.`);
				}
			}

			// Required
			if (options.required) {

				// Always Required
				if (typeof (options.required) === "boolean") {

					let rule = new RequiredRule(this.containingType, { property: this });

					this.containingType.model.ready(() => {
						rule.register();
					});
				}

				// Conditionally Required
				else {
					// required if
				}
			}

			// Error
			if (options.error) {

				let ruleName: string = null;
				let ruleOptions: ValidatedPropertyRuleOptions;
				let ruleFunction: (this: Entity) => boolean = options.error.function;


				if (typeof (ruleFunction) !== "function") {
					throw new Error(`Invalid property 'get' function of type '${getTypeName(options.error.function)}'.`);
				}

				if (options.error.dependsOn && typeof (options.error.dependsOn) !== "string") {
					throw new Error(`Invalid property 'get' dependsOn of type '${getTypeName(options.error.dependsOn)}'.`);
				}

				let ruleOnChangeOf = options.error.dependsOn ? PathTokens$normalizePaths([options.error.dependsOn]).map(t => t.expression) : [];

				ruleOptions = {
					property: this,
					isValid: function () {
						return !ruleFunction.call(this);
					},
					onChangeOf: ruleOnChangeOf,
					message: options.error.message
				};

				let rule = new ValidatedPropertyRule(this.containingType, ruleOptions);

				this.containingType.model.ready(() => {
					rule.register();
				});
			}

		});
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
		}
		else {
			return `this<${this.containingType}>.${this.name}`;
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
				if (valType.jstype === this.propertyType) {
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
				(valObjectType === Array && this.isList && (!this.propertyType || val.every(function (this: Property, child: any) {
					if (isEntityType(this.propertyType)) {
						if (child.constructor && child.constructor.meta) {
							for (let childType: Type = child.constructor.meta; childType; childType = childType.baseType) {
								if (childType.jstype === this.propertyType) {
									return true;
								}
							}
						}

						return false;
					} else {
						var itemObjectType = child.constructor;

						//"Normalize" data type in case it came from another frame as well as ensure that the types are the same
						switch (getTypeName(child)) {
							case "string":
								itemObjectType = String;
								break;
							case "number":
								itemObjectType = Number;
								break;
							case "boolean":
								itemObjectType = Boolean;
								break;
							case "date":
								itemObjectType = Date;
								break;
							case "array":
								itemObjectType = Array;
								break;
						}

						return itemObjectType === this.propertyType;
					}
				}, this)));
		}
	}

	value(obj: Entity = null, val: any = null, additionalArgs: any = null): any {
		var target = (this.isStatic ? this.containingType.jstype : obj);

		if (target === undefined || target === null) {
			throw new Error(`Cannot ${(arguments.length > 1 ? "set" : "get")} value for ${(this.isStatic ? "" : "non-")}static property \"${this.name}\" on type \"${this.containingType}\": target is null or undefined.`)
		}

		if (arguments.length > 1) {
			Property$_setter(this, obj, val, additionalArgs);
		} else {
			return Property$_getter(this, obj);
		}
	}

	isInited(obj: Entity): boolean {

		// If the backing field has been created, the property is initialized
		var target = (this.isStatic ? this.containingType.jstype : obj);
		return target.hasOwnProperty(this.fieldName);
	}
}

export interface PropertyOptions {

	/** The name or Javascript type of the property */
	type?: string | PropertyType,

	/** True if the property is static, or type level. */
	static?: boolean

	/**
	*  The optional label for the property.
	*  The property name will be used as the label when not specified.
	*/
	label?: string,

	/** The optional helptext for the property */
	helptext?: string,

	/** The optional format specifier for the property. */
	format?: string | Format<PropertyType> | PropertyFormatOptions,

	/** An optional function or dependency function object that calculates the value of this property. */
	get?: PropertyValueFunction | PropertyValueFunctionAndDependencies,

	/** An optional function to call when this property is updated. */
	set?: (this: Entity, value: any) => void,

	/** An optional constant default value, or a function or dependency function object that calculates the default value of this property. */
	default?: PropertyValueFunction | PropertyValueFunctionAndDependencies | Value,

	/** An optional constant default value, or a function or dependency function object that calculates the default value of this property. */
	allowedValues?: PropertyValueFunction | PropertyValueFunctionAndDependencies | Value[],

	/** True if the property is always required, or a dependency function object for conditionally required properties. */
	required?: boolean | { function: (this: Entity) => boolean, dependsOn: string },

	/** An optional dependency function object that adds an error with the specified message when true. */
	error?: { function: (this: Entity) => boolean, dependsOn: string, message: string }
}

export interface PropertyFormatOptions {

	/** The human readable description of the format, such as MM/DD/YYY */
	description: string;

	/** A regular expression that the property value must match */
	expression: RegExp;

	/** An optional regular expression reformat string that will be used to correct the value if it matches */
	reformat: string;

}

export type PropertyValueFunction = () => any;

export interface PropertyValueFunctionAndDependencies {
	function: (this: Entity) => any;
	dependsOn: string;
}

export interface PropertyConstructor {
	new(containingType: Type, name: string, jstype: PropertyType, isList: boolean, isStatic: boolean, options?: PropertyOptions): Property;
}

export type PropertyGetMethod = (property: Property, entity: Entity, additionalArgs: any) => any;

export type PropertySetMethod = (property: Property, entity: Entity, val: any, additionalArgs: any, skipTypeCheck: boolean) => void;

export interface PropertyRule extends Rule {

	/** The property that the rule targets */
	readonly property: Property;

}

export interface PropertyRuleOptions extends ConditionRuleOptions {

	// the property being validated (either a Property instance or string property name)
	property: Property;

}

export function Property$format(prop: Property, val: any): string {
	if (prop.format) {
		return prop.format.convert(val);
	}
}

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

	var _ensureInited = function () {
		if (!isInitialized) {
			// Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
			if (!property.isCalculated) {
				Property$pendingInit(obj, property, false);

				val = Property$_getInitialValue(property);

				if (Array.isArray(val)) {
					Property$_subArrayEvents(obj, property, val as ObservableArray<any>);
				}

				// TODO: Account for static properties (obj is undefined)
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
		get: function () {
			_ensureInited();

			// Raise get events
			(property.accessed as EventPublisher<Entity, PropertyAccessEventArgs>).publish(obj, { entity: obj, property, value: val });

			return val;
		},
		set: function (newVal) {
			_ensureInited();

			if (Property$_shouldSetValue(property, obj, val, newVal)) {

				// Update lists as batch remove/add operations
				if (property.isList) {
					let currentArray = val as ObservableArray<any>;
					currentArray.batchUpdate((array) => {
						updateArray(array, newVal);
					});
				} else {
					let old = val;
					val = newVal;

					Property$pendingInit(obj, property, false);

					// Do not raise change if the property has not been initialized. 
					if (old !== undefined) {
						(property.changed as EventPublisher<Entity, PropertyChangeEventArgs>).publish(obj, { entity: obj, property, newValue: val, oldValue: old });
					}
				}
			}	
		}
	});

}

export function Property$pendingInit(obj: Entity | EntityConstructorForType<Entity>, prop: Property, value: boolean = null): boolean | void {
	let pendingInit: ObjectLookup<boolean>;

	var target = (prop.isStatic ? prop.containingType.jstype : obj);

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
			storageTarget = prop.containingType.jstype;
		} else {
			storageTarget = obj;
		}
		let currentValue = storageTarget[prop.fieldName];
		return currentValue === undefined || pendingInit[prop.name] === true;
	}
}

function Property$_subArrayEvents(obj: Entity, property: Property, array: ObservableArray<any>) {

	array.changed.subscribe(function (args) {
		// NOTE: property change should be broadcast before rules are run so that if 
		// any rule causes a roundtrip to the server these changes will be available
		// TODO: Implement notifyListChanged?
		// property.containingType.model.notifyListChanged(target, property, changes);

		// NOTE: oldValue is not currently implemented for lists
		var eventArgs: PropertyChangeEventArgs = { entity: obj, property, newValue: array };

		(eventArgs as any)['changes'] = args.changes;
		(eventArgs as any)['collectionChanged'] = true;

		(property.changed as EventPublisher<Entity, PropertyChangeEventArgs>).publish(obj, eventArgs);
		obj._events.changedEvent.publish(obj, { entity: obj, property });
	});

}

function Property$_getInitialValue(property: Property) {
	var val = property.defaultValue;

    if (Array.isArray(val)) {
		val = ObservableArray.ensureObservable(val as Array<any>);

		// Override the default toString on arrays so that we get a comma-delimited list
		// TODO: Implement toString on observable list?
		// val.toString = Property$_arrayToString.bind(val);
	}

	return val;
}

function Property$_ensureInited(property: Property, obj: Entity) {
	var target = (property.isStatic ? property.containingType.jstype : obj);

    // Determine if the property has been initialized with a value
    // and initialize the property if necessary
    if (!obj.hasOwnProperty(property.fieldName)) {

        // // Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
        // if (!property.isCalculated) {
			Property$pendingInit(target, property, false);

			let val = Property$_getInitialValue(property);

			Object.defineProperty(target, property.fieldName, { value: val, writable: true });

			if (Array.isArray(val)) {
				Property$_subArrayEvents(obj, property, val as ObservableArray<any>);
			}

			// TODO: Implement observable?
			obj._events.changedEvent.publish(obj, { entity: obj, property });

			// Mark the property as pending initialization
			Property$pendingInit(target, property, true);
        // }
    }
}

function Property$_getter(property: Property, obj: Entity) {

    // Ensure that the property has an initial (possibly default) value
	Property$_ensureInited(property, obj);

	// Raise access events
	(property.accessed as EventPublisher<Entity, PropertyAccessEventArgs>).publish(obj, { entity: obj, property, value: (obj as any)[property.fieldName] });
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
        throw new Error("Cannot set " + property.name + "=" + (val === undefined ? "<undefined>" : val) + " for instance " + obj.meta.type.fullName + "|" + obj.meta.id + ": a value of type " + (isEntityType(property.propertyType) ? property.propertyType.meta.fullName : parseFunctionName(property.propertyType)) + " was expected.");
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

function Property$_setValue(property: Property, obj: Entity, currentValue: any, newValue: any, additionalArgs: any = null) {
    // Update lists as batch remove/add operations
    if (property.isList) {
		let currentArray = currentValue as ObservableArray<any>;
		currentArray.batchUpdate((array) => {
			updateArray(array, newValue);
		});
    } else {
		let oldValue = currentValue;

		// Set or create the backing field value
		if (obj.hasOwnProperty(property.fieldName)) {
			(obj as any)[property.fieldName] = newValue;
		} else {
			Object.defineProperty(obj, property.fieldName, { value: newValue, writable: true });
		}

		Property$pendingInit(obj, property, false);

		// Do not raise change if the property has not been initialized. 
		if (oldValue !== undefined) {
			var eventArgs: PropertyChangeEventArgs = { entity: obj, property, newValue, oldValue };
			(property.changed as EventPublisher<Entity, PropertyChangeEventArgs>).publish(obj, additionalArgs ? merge(eventArgs, additionalArgs) : eventArgs);
			obj._events.changedEvent.publish(obj, { entity: obj, property });
		}
    }
}

function Property$_makeGetter(property: Property, getter: PropertyGetMethod) {
    return function (additionalArgs: any = null) {
        // ensure the property is initialized
        return getter(property, this, additionalArgs);
    };
}

function Property$_makeSetter(prop: Property, setter: PropertySetMethod, skipTypeCheck: boolean = false) {
    // TODO: Is setter "__notifies" needed?
    // setter.__notifies = true;

    return function (val: any, additionalArgs: any = null) {
        setter(prop, this, val, additionalArgs, skipTypeCheck);
    };
}
