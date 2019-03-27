import { Rule, Rule$ensureConditionType, RuleOptions, RuleInvocationOptions } from "./rule";
import { ConditionType } from "./condition-type";
import { Entity } from "./entity";
import { Type } from "./type";
import { ConditionTypeSet } from "./condition-type-set";
import { PropertyPath } from "./property-path";

export class ConditionRule extends Rule {

	// Assertion function indicating whether the condition exists
	assert: (this: Entity) => boolean;

	// The message describing the state of the condition
	message: string | ((this: Entity) => string);

	// Array of property paths the validation condition should be attached to when asserted, in addition to the target property
	properties: PropertyPath[];

	// The condition type to raise when asserted
	conditionType: ConditionType;

	/**
	 * Creates a rule that asserts a condition based on a predicate
	 * @param rootType The model type the rule is for
	 * @param options The options for the rule, of type ConditionRuleOptions
	 */
	constructor(rootType: Type, options: ConditionRuleOptions & RuleInvocationOptions) {

		// automatically run the condition rule during initialization of new and existing instances
		options.onInit = true;

		// call the base rule constructor
		super(rootType, name, options);
	
		// assertion function
		this.assert = options.assert;

		// message
		this.message = options.message;

		// condition type
		this.conditionType = options.conditionType ? (typeof options.conditionType === "string" ? 
			ConditionType.get(options.conditionType) : 
			options.conditionType) :
			Rule$ensureConditionType(options.name, rootType, options.category || "ErrorConditionType");

		// properties
		this.properties = options.properties;
	}

	// asserts the condition and adds or removes it from the model if necessary
	execute(entity: Entity) {

		let assert = this.assert.call(entity);

		let message = typeof this.message === "string" ?
			this.message :
			this.message.call(entity);

		// create or remove the condition if necessary
		if (typeof assert !== "undefined") {
			this.conditionType.when(assert, entity, this.properties, message);
		}
	}

	// gets the string representation of the condition rule
	toString() {
		return typeof this.message === "string" ? this.message : this.conditionType.message;
	}

}

export type ConditionTypeCategory = "Error" | "Warning";

export interface ConditionRuleOptions extends RuleOptions {

	// a predicate that returns true when the condition should be asserted
	assert?: (this: Entity) => boolean;

	// the message to show the user when the validation fails
	message?: string | (() => string);

	// an array of property paths the validation condition should be attached to when asserted, in addition to the target property
	properties?: PropertyPath[];

	// The condition type to raise when asserted
	conditionType?: ConditionType | string;

	// The condition type category ("Error" or "Warning", defaults to "Error")
	category?: ConditionTypeCategory;

	// the optional array of condition type sets to associate the condition with
	sets?: ConditionTypeSet[];

}
