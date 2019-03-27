import { ValidationRule, ValidationRuleOptions } from "./validation-rule";
import { Resource } from "./resource";
import { Type } from "./type";
import { Entity } from "./entity";
import { Property } from "./property";

/**
 * A rule that validates that a property has a value
 */
export class RequiredRule extends ValidationRule {

	/**
	 * Creates a rule that validates that a property has a value.
	 * @param rootType The model type the rule is for
	 * @param options The options for the rule
	 */
	constructor(rootType: Type, options: RequiredRuleOptions) {

		// ensure the rule name is specified
		options.name = options.name || "Required";

		// ensure the error message is specified
		options.message = options.message || Resource.get("required");

		// create the validation function based on the rule options
		options.isValid = function(this: Entity, prop: Property, val: any): boolean {
			if (options.when && !options.when.call(this)) {
				// Valid whether or not there is a value, since requiredness is not in effect
				return true;
			}

			return val !== undefined && val !== null && (val.constructor !== String || val.trim() !== "") && (!(val instanceof Array) || val.length > 0);
		}

		// call the base type constructor
		super(rootType, options);
	}

	// get the string representation of the rule
	toString(): string {
		return `${this.property.containingType.fullName}.${this.property.name} is required`;
	}
}

export interface RequiredRuleOptions extends ValidationRuleOptions {
	when?: ((this: Entity) => boolean);
}
