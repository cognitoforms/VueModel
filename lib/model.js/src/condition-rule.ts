import { Rule, Rule$ensureConditionType, RuleOptions } from "./rule";
import { hasOwnProperty } from "./helpers";
import { Property } from "./property";
import { ConditionType } from "./condition-type";
import { Entity } from "./entity";
import { Type } from "./type";
import { ConditionTypeSet } from "./condition-type-set";

export class ConditionRule extends Rule {

	_message: string | ((this: Entity) => string);

	_assert: (obj: Entity) => boolean;

	// an array of property paths the validation condition should be attached to when asserted, in addition to the target property
	_properties: Property[];

	// The condition type to raise when asserted
	conditionType: ConditionType;

	/**
	 * Creates a rule that asserts a condition based on a predicate
	 * @param rootType The model type the rule is for
	 * @param options The options for the rule, of type ConditionRuleOptions
	 */
	constructor(rootType: Type, options: ConditionRuleOptions & RuleOptions, skipRegistration: boolean = false) {

		// Exit immediately if called with no arguments
		if (arguments.length === 0) return;

		// automatically run the condition rule during initialization of new instances
		if (!options.hasOwnProperty("onInitNew")) {
			options.onInitNew = true;
		}

		// coerce string to condition type
		var conditionType = options.conditionType;
		if (typeof conditionType === "string") {
			conditionType = ConditionType.get(conditionType);
		}

		// automatically run the condition rule during initialization of existing instances if the condition type was defined on the client
		if (!options.hasOwnProperty("onInitExisting") && conditionType && conditionType.origin !== "server") {
			options.onInitExisting = true;
		}

		// Call the base rule constructor
		super(rootType, name, options, true);
	
		// store the condition predicate
		var assert = options.assert || options.fn;
		if (assert) {
			this._assert = assert;
		}

		if (!conditionType) {
			// create a condition type if not passed in, defaulting to Error if a condition category was not specified
			conditionType = Rule$ensureConditionType(options.name, rootType, options.category || "ErrorConditionType");
		}
	
		Object.defineProperty(this, "conditionType", { enumerable: true, value: conditionType });

		// store the condition message and properties
		if (options.message) {
			Object.defineProperty(this, "_message", { value: options.message, writable: true });
		}

		Object.defineProperty(this, "_properties", { value: options.properties || [], writable: true });

		if (!skipRegistration) {
			// Register the rule after loading has completed
			rootType.model.registerRule(this);
		}

	}

	// subclasses may override this function to return the set of properties to attach conditions to for this rule
	getProperties(): Property[] {
		return hasOwnProperty(this, "_properties") ? this._properties : [];
	}

	// subclasses may override this function to calculate an appropriate message for this rule during the registration process
	getMessage(obj: Entity): string {
		if (hasOwnProperty(this, "_message")) {
			if (typeof this._message === "string") {
				let compiledMessageFn = new Function(this._message);
				this._message = compiledMessageFn as ((this: Entity) => string);
			}

			if (this._message instanceof Function) {
				return this._message.call(obj);
			}
		}

		return this.conditionType.message;
	}

	// subclasses may override this function to indicate whether the condition should be asserted
	assert(obj: Entity): boolean {
		throw new Error("ConditionRule.assert() must be passed into the constructor or overriden by subclasses.");
	}

	// asserts the condition and adds or removes it from the model if necessary
	execute(obj: Entity, args: any = null) {

		var assert;

		// call assert the root object as "this" if the assertion function was overriden in the constructor
		if (hasOwnProperty(this, "assert")) {

			// convert string functions into compiled functions on first execution
			if (typeof this.assert === "string") {
				this.assert = (new Function("obj", (this.assert as any) as string)) as (obj: Entity) => boolean;
			}

			assert = this.assert.call(obj, obj, args);
		}

		// otherwise, allow "this" to be the current rule to support subclasses that override assert
		else {
			assert = this.assert(obj);
		}

		let message: ((entity: Entity) => string);
		if (hasOwnProperty(this, "message")) {
			message = ConditionRule.prototype.getMessage.bind(this);
		}

		// create or remove the condition if necessary
		if (assert !== undefined) {
			this.conditionType.when(assert, obj,
				this._properties instanceof Function ? this._properties.call(obj) : this._properties,
				message);
		}
	}

	// gets the string representation of the condition rule
	toString() {
		return typeof this._message === "string" ? this._message : this.conditionType.message;
	}

}

export type ConditionTypeCategory = "Error" | "Warning";

export interface ConditionRuleOptions {

	// a predicate that returns true when the condition should be asserted
	assert?: (obj: Entity) => boolean;

	// a predicate that returns true when the condition should be asserted
	fn?: (obj: Entity) => boolean;

	// an array of property paths the validation condition should be attached to when asserted, in addition to the target property
	properties?: (Property | string)[];

	// The condition type to raise when asserted
	conditionType?: ConditionType | string;

	// The condition type category ("Error" or "Warning", defaults to "Error")
	category?: ConditionTypeCategory;

	// the message to show the user when the validation fails
	message?: string | (() => string);

	// the optional array of condition type sets to associate the condition with
	sets?: ConditionTypeSet[];

}
