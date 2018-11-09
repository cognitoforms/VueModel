import { Entity as IEntity } from "./interfaces";
import { Property as IProperty, PropertyChangeEventArgs, PropertyAccessEventArgs } from "./interfaces";
import { Rule as IRule, RuleOptions } from "./interfaces";
import { PropertyChain as IPropertyChain } from "./interfaces";
import { Property$addChanged, Property$addAccessed, hasPropertyChangedSubscribers, Property$pendingInit, Property$isProperty } from "./property";
import { PropertyChain$isPropertyChain } from "./property-chain";
import { Type as IType } from "./interfaces";
import { Type } from "./type";
import { Model$getPropertyOrPropertyChain } from "./model";
import { RuleInvocationType } from "./rule-invocation-type";
import { EventScope$current, EventScope$perform, EventScope$onExit, EventScope$onAbort } from "./event-scope";
import { Signal } from "./signal";
import { ObjectMeta as IObjectMeta } from "./interfaces";
import { PathTokens$normalizePaths } from "./path-tokens";
import { Entity$_getEventDispatchers } from "./entity";

// TODO: Make `detectRunawayRules` an editable configuration value
const detectRunawayRules = true;

// TODO: Make `nonExitingScopeNestingCount` an editable configuration value
// Controls the maximum number of times that a child event scope can transfer events
// to its parent while the parent scope is exiting. A large number indicates that
// rules are not reaching steady-state. Technically something other than rules could
// cause this scenario, but in practice they are the primary use-case for event scope. 
const nonExitingScopeNestingCount: number = 100;

let Rule$customRuleIndex: number = 0

export class Rule implements IRule {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the object is
	readonly rootType: IType;
	readonly name: string;

	execute: (entity: IEntity) => void;
	invocationTypes: RuleInvocationType = 0;
	predicates: (IProperty | IPropertyChain)[] = [];
	returnValues: IProperty[] = [];

	private _registered: boolean;

	/**
	 * Creates a rule that executes a delegate when specified model events occur.
	 * @param rootType The model type the rule is for.
	 * @param options The options for the rule.
	 */
	constructor(rootType: IType, name: string, options: RuleOptions) {

		// Track the root type
		this.rootType = rootType;

		this.name = name || (options ? options.name : null) || (rootType.fullName + ".Custom." + (++Rule$customRuleIndex));

		// Configure the rule based on the specified options
		if (options) {
			options = normalizeRuleOptions(options);

			if (options.onInit)
				this.onInit();
			if (options.onInitNew)
				this.onInitNew();
			if (options.onInitExisting)
				this.onInitExisting();
			if (options.onChangeOf)
				this.onChangeOf(options.onChangeOf);
			if (options.returns)
				this.returns(options.returns);
			if (options.execute instanceof Function)
				this.execute = options.execute;
		}

		// Register the rule after loading has completed
		rootType.model.registerRule(this);
	}

	// Indicates that the rule should run only for new instances when initialized
	onInitNew(): this {

		// ensure the rule has not already been registered
		if (this._registered)
			throw new Error("Rules cannot be configured once they have been registered: " + this.name);

		// configure the rule to run on init new
		this.invocationTypes |= RuleInvocationType.InitNew;
		return this;
	}

	// indicates that the rule should run only for existing instances when initialized
	onInitExisting(): this {

		// ensure the rule has not already been registered
		if (this._registered)
			throw new Error("Rules cannot be configured once they have been registered: " + this.name);

		// configure the rule to run on init existingh
		this.invocationTypes |= RuleInvocationType.InitExisting;
		return this;
	}

	// indicates that the rule should run for both new and existing instances when initialized
	onInit(): this {

		// ensure the rule has not already been registered
		if (this._registered)
			throw new Error("Rules cannot be configured once they have been registered: " + this.name);

		// configure the rule to run on both init new and init existing
		this.invocationTypes |= RuleInvocationType.InitNew | RuleInvocationType.InitExisting;
		return this;
	}

	/**
	 * Indicates that the rule should automatically run when one of the specified property paths changes.
	 * @param predicates An array of property paths (strings, Property or PropertyChain instances) that drive when the rule should execute due to property changes.
	 */
	onChangeOf(predicates: (string | IProperty | IPropertyChain)[]): this
	onChangeOf(...predicates: (string | IProperty | IPropertyChain)[]): this
	onChangeOf(predicates: any) {

		// ensure the rule has not already been registered
		if (this._registered)
			throw new Error("Rules cannot be configured once they have been registered: " + this.name);

		// allow change of predicates to be specified as a parameter array without []'s
		if (predicates && predicates.constructor === String) {
			predicates = Array.prototype.slice.call(arguments);
		}

		// add to the set of existing change predicates
		this.predicates = this.predicates.length > 0 ? this.predicates.concat(predicates) : predicates;

		// also configure the rule to run on property change unless it has already been configured to run on property get
		if ((this.invocationTypes & RuleInvocationType.PropertyGet) === 0)
			this.invocationTypes |= RuleInvocationType.PropertyChanged;

		return this;
	}

	/**
	 * Indicates that the rule is responsible for calculating and returning values of one or more properties on the root type.
	 * @param properties An array of properties (string name or IProperty instance) that the rule is responsible to calculating the value of.
	 */
	returns(properties: (string | IProperty)[]): this
	returns(...properties: (string | IProperty)[]): this
	returns(properties: any) {

		// Ensure the rule has not already been registered
		if (this._registered)
			throw new Error("Rules cannot be configured once they have been registered: " + this.name);

		// Allow return properties to be specified as a parameter array without []'s
		if (properties && properties.constructor === String)
			properties = Array.prototype.slice.call(arguments);

		if (!properties) 
			throw new Error("Rule must specify at least one property for returns.");

		// Add to the set of existing return value properties
		this.returnValues = this.returnValues.length > 0 ? this.returnValues.concat(properties) : properties;

		// Configure the rule to run on property get and not on property change
		this.invocationTypes |= RuleInvocationType.PropertyGet;
		this.invocationTypes &= ~RuleInvocationType.PropertyChanged;

		return this;
	}

	// registers the rule based on the configured invocation types, predicates, and return values
	register() {

		if (this._registered) {
			throw new Error("Rules cannot be registered more than once: " + this.name);
		}

		// TODO: track the rule with the root type?
		// this.rootType.rules.push(rule);

		// Indicate that the rule should now be considered registered and cannot be reconfigured
		Object.defineProperty(this, '_registered', { enumerable: false, value: true, writable: false });

		prepareRuleForRegistration(this, registerRule);

	}

	// // creates a condition type for the specified rule and type or property, of the specified category type (usually Error or Warning)
	// static ensureConditionType(ruleName: string, typeOrProp, category, sets) {
	// 	var generatedCode =
	// 		typeOrProp instanceof IProperty ? $format("{0}.{1}.{2}", [typeOrProp.get_containingType().fullName, typeOrProp.get_name(), ruleName]) :
	// 			typeOrProp instanceof Type ? $format("{0}.{1}", [typeOrProp.fullName, ruleName]) :
	// 				ruleName;
	// 	var counter = "";

	// 	while (ConditionType.get(generatedCode + counter))
	// 		counter++;

	// 	// return a new client condition type of the specified category
	// 	return new category(generatedCode + counter, $format("Generated condition type for {0} rule.", [ruleName]), null, "client");
	// }

	// // creates an error for the specified rule and type or property
	// static ensureError = function Rule$ensureError(ruleName, typeOrProp, sets) {
	// 	return Rule.ensureConditionType(ruleName, typeOrProp, ConditionType.Error, sets);
	// }

	// // creates an error for the specified rule and type or property
	// static ensureWarning = function Rule$ensureWarning(ruleName, typeOrProp, sets) {
	// 	return Rule.ensureConditionType(ruleName, typeOrProp, ConditionType.Warning, sets);
	// }

}

export function Rule$create(rootType: IType, optionsOrFunction: ((entity: IEntity) => void) | RuleOptions): Rule {

	let options: RuleOptions;

	if (optionsOrFunction) {
		// The options are the function to execute
		if (optionsOrFunction instanceof Function) {
			options = { execute: optionsOrFunction };
		} else {
			options = optionsOrFunction as RuleOptions;
		}
	}

	return new Rule(rootType, options.name, options);

}

function pendingInvocation(target: IType | IObjectMeta, rule: IRule, value: boolean = null): boolean | void {
	let pendingInvocation: IRule[];

	if (Object.prototype.hasOwnProperty.call(target, "_pendingInvocation")) {
		pendingInvocation = (target as any)._pendingInvocation;
	} else {
		Object.defineProperty(target, "_pendingInvocation", { enumerable: false, value: (pendingInvocation = []), writable: true });
	}

	var indexOfRule = pendingInvocation.indexOf(rule);
	if (arguments.length > 2) {
		if (value && indexOfRule < 0) {
			pendingInvocation.push(rule);
		}
		else if (!value && indexOfRule >= 0) {
			pendingInvocation.splice(indexOfRule, 1);
		}
	} else {
		return indexOfRule >= 0;
	}
}

function canExecuteRule(rule: Rule, obj: IEntity, args: any): boolean {
	// ensure the rule target is a valid rule root type
	return obj instanceof rule.rootType.ctor;
};

function executeRule(rule: Rule, obj: IEntity, args: any): void {
	// Ensure that the rule can be executed.
	if (!canExecuteRule(rule, obj, args)) {
		// TODO: Warn that rule can't be executed?
		return;
	}

	EventScope$perform(function () {
		if (detectRunawayRules) {
			if (EventScope$current.parent) {
				let parentEventScope = EventScope$current.parent as any;
				if (parentEventScope._exitEventVersion) {
					// Determine the maximum number nested calls to EventScope$perform
					// before considering a rule to be a "runaway" rule. 
					var maxNesting;
					if (typeof nonExitingScopeNestingCount === "number") {
						maxNesting = nonExitingScopeNestingCount - 1;
					} else {
						maxNesting = 99;
					}

					if (parentEventScope._exitEventVersion > maxNesting) {
						// TODO: logWarning("Aborting rule '" + rule.name + "'.");
						return;
					}
				}
			}
		}

		rule.execute.call(rule, obj, args);
	});
};

function prepareRuleForRegistration(rule: Rule, callback: (rule: Rule) => void) {

	// resolve return values, which should all be loaded since the root type is now definitely loaded
	if (rule.returnValues) {
		rule.returnValues.forEach(function (returnValue, i) {
			if (!Property$isProperty(returnValue)) {
				rule.returnValues[i] = rule.rootType.getProperty((returnValue as any) as string);
			}
		});
	}

	// resolve all predicates, because the rule cannot run until the dependent types have all been loaded
	if (rule.predicates) {
		var signal: Signal = null;

		// setup loading of each property path that the calculation is based on
		for (let i = 0; i < rule.predicates.length; i++) {
			let predicate = rule.predicates[i];

			if (typeof predicate === "string") {

				// Parse string inputs, which may be paths containing nesting {} hierarchial syntax

				// create a signal if this is the first string-based input
				if (!signal) {
					signal = new Signal("prepare rule predicates");
				}

				let predicateIndex = i;

				// normalize the paths to accommodate {} hierarchial syntax
				PathTokens$normalizePaths([predicate]).forEach(function (path) {
					Model$getPropertyOrPropertyChain(path, rule.rootType, false, signal.pending(function (propertyChain: IPropertyChain) {
						rule.predicates[predicateIndex] = propertyChain;
					}, this, true), this);
				}, this);
			} else if (!Property$isProperty(predicate) || PropertyChain$isPropertyChain(predicate)) {
				// TODO: Remove invalid predicates?
				rule.predicates.splice(i--, 1);
			}
		}

		if (signal) {
			// Wait until all property information is available to initialize the rule
			signal.waitForAll(callback, this, true, [rule]);
		} else {
			// Otherwise, just immediately proceed with rule registration
			callback(rule);
		}
	}

}

function registerRule (rule: Rule) {

	// register for init new
	if (rule.invocationTypes & RuleInvocationType.InitNew)
		(rule.rootType as Type).initNewEvent.subscribe((sender, args) => executeRule(rule, args.entity, args));

	// register for init existing
	if (rule.invocationTypes & RuleInvocationType.InitExisting) {
		(rule.rootType as Type).initExistingEvent.subscribe((sender, args) => executeRule(rule, args.entity, args));
	}

	// register for property change
	if (rule.invocationTypes & RuleInvocationType.PropertyChanged) {
		rule.predicates.forEach(function (predicate) {
			Property$addChanged(predicate,
				function (sender, args) {
					if (canExecuteRule(rule, sender, args) && !pendingInvocation(sender.meta, rule)) {
						pendingInvocation(sender.meta, rule, true);
						EventScope$onExit(function () {
							pendingInvocation(sender.meta, rule, false);
							executeRule(rule, sender, args);
						});
						EventScope$onAbort(function () {
							pendingInvocation(sender.meta, rule, false);
						});
					}
				},
				null, // no object filter
				// false, // subscribe for all time, not once
				true // tolerate nulls since rule execution logic will handle guard conditions
			);
		});
	}

	// register for property get
	if (rule.invocationTypes & RuleInvocationType.PropertyGet && rule.returnValues) {

		// register for property get events for each return value to calculate the property when accessed
		rule.returnValues.forEach(function (returnValue) {
			Property$addAccessed(returnValue, (sender: IEntity, args: PropertyAccessEventArgs) => {

				// run the rule to initialize the property if it is pending initialization
				if (canExecuteRule(rule, sender, args) && Property$pendingInit(sender.meta, returnValue)) {
					Property$pendingInit(sender.meta, returnValue, false);
					executeRule(rule, sender, args);
				}
			});
		});

		// register for property change events for each predicate to invalidate the property value when inputs change
		rule.predicates.forEach(function (predicate) {
			Property$addChanged(predicate,
				(sender: IEntity, args: PropertyChangeEventArgs) => {
					if (rule.returnValues.some(function (returnValue) { return hasPropertyChangedSubscribers(returnValue, sender); })) {
						// Immediately execute the rule if there are explicit event subscriptions for the property
						if (canExecuteRule(rule, sender, args) && !pendingInvocation(sender.meta, rule)) {
							pendingInvocation(sender.meta, rule, true);
							EventScope$onExit(function () {
								pendingInvocation(sender.meta, rule, false);
								executeRule(rule, sender, args);
							});
							EventScope$onAbort(function () {
								pendingInvocation(sender.meta, rule, false);
							});
						}
					} else {
						// Otherwise, just mark the property as pending initialization and raise property change for UI subscribers
						rule.returnValues.forEach(function (returnValue) {
							Property$pendingInit(sender.meta, returnValue, true);
						});
						// Defer change notification until the scope of work has completed
						EventScope$onExit(function () {
							rule.returnValues.forEach(function (returnValue) {
								// TODO: Implement observable?
								Entity$_getEventDispatchers(sender).changedEvent.dispatch(returnValue, { entity: sender, property: returnValue });
							});
						});
					}
				},
				null, // no object filter
				// false, // subscribe for all time, not once
				true // tolerate nulls since rule execution logic will handle guard conditions
			);
		});
	}

	// allow rule subclasses to perform final initialization when registered
	if ((rule as any).onRegister instanceof Function) {
		(rule as any).onRegister();
	}
}

function normalizeRuleOptions(obj: any): RuleOptions {

	if (!obj) {
		return;
	}

	let options: RuleOptions = {};

	let keys = Object.keys(obj);

	let values = keys.map(key => {
		let value = obj[key];
		if (key === 'onInit') {
			if (typeof value === "boolean") {
				return options.onInit = value;
			}
		} else if (key === 'onInitNew') {
			if (typeof value === "boolean") {
				return options.onInitNew = value;
			}
		} else if (key === 'onInitExisting') {
			if (typeof value === "boolean") {
				return options.onInitExisting = value;
			}
		} else if (key === 'onChangeOf') {
			if (Array.isArray(value)) {
				return options.onChangeOf = (value as any[]).filter(p => {
					if (typeof p === "string" || PropertyChain$isPropertyChain(p) || Property$isProperty(p)) {
						return true;
					} else {
						// TODO: Warn about invalid 'onChangeOf' item?
						return false;
					}
				});
			} else if (typeof value === "string") {
				return options.onChangeOf = [value] as string[];
			} else if (PropertyChain$isPropertyChain(value)) {
				return options.onChangeOf = [value] as IPropertyChain[];
			} else if (Property$isProperty(value)) {
				return options.onChangeOf = [value] as IProperty[];
			}
		} else if (key === 'returns') {
			if (Array.isArray(value)) {
				return options.returns = (value as any[]).filter(p => {
					if (typeof p === "string" || PropertyChain$isPropertyChain(p) || Property$isProperty(p)) {
						return true;
					} else {
						// TODO: Warn about invalid 'returns' item?
						return false;
					}
				});
			} else if (typeof value === "string") {
				return options.returns = [value] as string[];
			} else if (Property$isProperty(value)) {
				return options.returns = [value] as IProperty[];
			}
		} else if (key === 'execute') {
			if (value instanceof Function) {
				return options.execute = value as (entity: IEntity) => void;
			}
		} else {
			// TODO: Warn about unsupported rule options?
			return;
		}

		// TODO: Warn about invalid rule option value?
		return;
	});

	return options;

}
