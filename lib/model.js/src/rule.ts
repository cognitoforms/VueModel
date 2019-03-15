import { Entity, EntityConstructorForType, EntityChangeEventArgs } from "./entity";
import { PropertyChangeEventArgs, PropertyAccessEventArgs, PropertyPath } from "./property-path";
import { Property$pendingInit, Property } from "./property";
import { PropertyChain } from "./property-chain";
import { Event } from "./events";
import { Type } from "./type";
import { RuleInvocationType } from "./rule-invocation-type";
import { EventScope$current, EventScope$perform, EventScope$onExit, EventScope$onAbort } from "./event-scope";
import { ObjectMeta } from "./object-meta";
import { ErrorConditionType, WarningConditionType, ConditionType, ErrorConditionTypeConstructor, WarningConditionTypeConstructor } from "./condition-type";

// TODO: Make `detectRunawayRules` an editable configuration value
const detectRunawayRules = true;

// TODO: Make `nonExitingScopeNestingCount` an editable configuration value
// Controls the maximum number of times that a child event scope can transfer events
// to its parent while the parent scope is exiting. A large number indicates that
// rules are not reaching steady-state. Technically something other than rules could
// cause this scenario, but in practice they are the primary use-case for event scope. 
const nonExitingScopeNestingCount: number = 100;

let Rule$customRuleIndex: number = 0

export class Rule {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the object is
	readonly rootType: Type;
	readonly name: string;

	invocationTypes: RuleInvocationType = 0;
	predicates: PropertyPath[] = [];
	returnValues: Property[] = [];
	
	private _execute: (this: Entity) => void;
	private _registered: boolean;

	/**
	 * Creates a rule that executes a delegate when specified model events occur.
	 * @param rootType The model type the rule is for.
	 * @param options The options for the rule.
	 */
	constructor(rootType: Type, name: string, options: RuleOptions & RuleInvocationOptions) {

		// Track the root type
		this.rootType = rootType;

		this.name = name || (options ? options.name : null) || (rootType.fullName + ".Custom." + (++Rule$customRuleIndex));

		// Configure the rule based on the specified options
		if (options) {

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
				this._execute = options.execute;
		}
	}

	execute(entity: Entity, ...args: any[]): void {
		if (this._execute) {
			this._execute.call(entity);
		} else {
			// TODO: Warn about execute function not implemented?
		}
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
	onChangeOf(predicates: PropertyPath[]): this
	onChangeOf(...predicates: PropertyPath[]): this
	onChangeOf(predicates: any) {

		// ensure the rule has not already been registered
		if (this._registered)
			throw new Error("Rules cannot be configured once they have been registered: " + this.name);

		// allow change of predicates to be specified as a parameter array without []'s
		if (!(predicates instanceof Array)) {
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
	 * @param properties An array of properties (string name or Property instance) that the rule is responsible to calculating the value of.
	 */
	returns(properties: (string | Property)[]): this
	returns(...properties: (string | Property)[]): this
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

		let rule = this;

		if (rule._registered) {
			throw new Error("Rules cannot be registered more than once: " + rule.name);
		}

		// Indicate that the rule should now be considered registered and cannot be reconfigured
		Object.defineProperty(this, '_registered', { enumerable: false, value: true, writable: false });

		// register for init new
		if (rule.invocationTypes & RuleInvocationType.InitNew) {
			rule.rootType.initNew.subscribe(function (args) { executeRule(rule, args.entity, args) });
		}

		// register for init existing
		if (rule.invocationTypes & RuleInvocationType.InitExisting) {
			rule.rootType.initExisting.subscribe(function (args) { executeRule(rule, args.entity, args) });
		}

		// register for property change
		if (rule.invocationTypes & RuleInvocationType.PropertyChanged) {
			rule.predicates.forEach(function (predicate) {
				predicate.changed.subscribe(
					function (args) {
						if (canExecuteRule(rule, args.entity, args) && !pendingInvocation(args.entity.meta, rule)) {
							pendingInvocation(args.entity.meta, rule, true);
							EventScope$onExit(function () {
								pendingInvocation(args.entity.meta, rule, false);
								executeRule(rule, args.entity, args);
							});
							EventScope$onAbort(function () {
								pendingInvocation(args.entity.meta, rule, false);
							});
						}
					}
				);
			});
		}

		// register for property get
		if (rule.invocationTypes & RuleInvocationType.PropertyGet && rule.returnValues) {

			// register for property get events for each return value to calculate the property when accessed
			rule.returnValues.forEach(function (returnValue) {
				returnValue.accessed.subscribe(
					function (args) {
						// run the rule to initialize the property if it is pending initialization
						if (canExecuteRule(rule, args.entity, args) && Property$pendingInit(args.entity, returnValue)) {
							Property$pendingInit(args.entity, returnValue, false);
							executeRule(rule, args.entity, args);
						}
					}
				);
			});

			// register for property change events for each predicate to invalidate the property value when inputs change
			rule.predicates.forEach(function (predicate) {
				predicate.changed.subscribe(
					function (args) {
						if (rule.returnValues.some((returnValue) => returnValue.changed.hasSubscribers())) {
							// Immediately execute the rule if there are explicit event subscriptions for the property
							if (canExecuteRule(rule, args.entity, args) && !pendingInvocation(args.entity.meta, rule)) {
								pendingInvocation(args.entity.meta, rule, true);
								EventScope$onExit(() => {
									pendingInvocation(args.entity.meta, rule, false);
									executeRule(rule, args.entity, args);
								});
								EventScope$onAbort(() => {
									pendingInvocation(args.entity.meta, rule, false);
								});
							}
						} else {
							// Otherwise, just mark the property as pending initialization and raise property change for UI subscribers
							rule.returnValues.forEach((returnValue) => {
								Property$pendingInit(args.entity, returnValue, true);
							});
							// Defer change notification until the scope of work has completed
							EventScope$onExit(() => {
								rule.returnValues.forEach((returnValue) => {
									// TODO: Implement observable?
									(args.entity.changed as Event<Entity, EntityChangeEventArgs>).publish(args.entity, { entity: args.entity, property: returnValue });
								});
							});
						}
					}
				);
			});
		}

		// allow rule subclasses to perform final initialization when registered
		if ((rule as any).onRegister instanceof Function) {
			(rule as any).onRegister();
		}

	}
}

export interface RuleOptions {

	/** The optional unique name of the rule. */
	name?: string;

	/** The source property for the allowed values (either a Property or PropertyChain instance or a string property path). */
	execute?: (this: Entity) => void;

	/** Array of property paths (strings, Property or PropertyChain instances) that trigger rule execution when changed. */
	onChangeOf?: PropertyPath[];

	/** Array of properties (strings or Property instances) that the rule is responsible for calculating */
	returns?: Property[];

	rootType?: EntityConstructorForType<Entity>;
}

export interface RuleInvocationOptions {
	/** Indicates that the rule should run when an instance of the root type is initialized. */
	onInit?: boolean;

	/** Indicates that the rule should run when a new instance of the root type is initialized. */
	onInitNew?: boolean;

	/** Indicates that the rule should run when an existing instance of the root type is initialized. */
	onInitExisting?: boolean;
}

export interface RuleRegisteredEventArgs {
	rule: Rule;
}

function pendingInvocation(target: Type | ObjectMeta, rule: Rule, value: boolean = null): boolean | void {
	let pendingInvocation: Rule[];

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

function canExecuteRule(rule: Rule, obj: Entity, eventArgument: any): boolean {
	// ensure the rule target is a valid rule root type
	return obj instanceof rule.rootType.jstype;
}

function executeRule(rule: Rule, obj: Entity, eventArgument: any): void {
	// Ensure that the rule can be executed.
	if (!canExecuteRule(rule, obj, eventArgument)) {
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

		rule.execute(obj);
	});
};

export function Rule$ensureConditionType<DesiredConditionType = ErrorConditionType | WarningConditionType>(ruleName: string, typeOrProp: Type | Property, category: string = "Error"): ErrorConditionType | WarningConditionType {
	var generatedCode =
		typeOrProp instanceof Property ? `${typeOrProp.containingType.fullName}.${typeOrProp.name}.${ruleName}` :
		typeOrProp instanceof Type ? `${typeOrProp}.${ruleName}` : 
		ruleName;

	var counter: string | number = "";

	while (ConditionType.get(generatedCode + counter))
		counter = (typeof counter === "string" ? 0 : counter) + 1;

	let DesiredConditionType: ErrorConditionTypeConstructor | WarningConditionTypeConstructor;

	if (category === "Error") {
		DesiredConditionType = ErrorConditionType;
	} else if (category === "Warning") {
		DesiredConditionType = WarningConditionType;
	} else {
		throw new Error("Cannot create condition type for unsupported category '" + category + "'.");
	}

	// return a new client condition type of the specified category
	return new DesiredConditionType(generatedCode + counter, `Generated condition type for ${ruleName} rule.`);
}
