import { ValidationRule, ValidationRuleOptions } from "./validation-rule";
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

		if (typeof options.message === "function") {
			if (options.when) {
				let messageFn = options.message;
				options.message = function(this: Entity): string {
					if (options.when && !options.when.call(this))
						return null;
					return messageFn.call(this);
				};
			}
		} else {
			// ensure the error message is specified
			options.message = options.message || rootType.model.getResource("required");

			if (options.isValid) {
				if (options.when) {
					let isValidFn = options.isValid;
					options.isValid = function(this: Entity, prop: Property, val: any): boolean {
						if (options.when && !options.when.call(this)) {
							// Valid whether or not there is a value, since requiredness is not in effect
							return true;
						}

						return isValidFn.apply(this, arguments);
					};
				}
			} else if (typeof options.message !== "function") {
				// create the validation function based on the rule options
				options.isValid = function(this: Entity, prop: Property, val: any): boolean {
					if (options.when && !options.when.call(this)) {
						// Valid whether or not there is a value, since requiredness is not in effect
						return true;
					}

					if (val === undefined || val === null)
						return false;

					// Blank string does not pass required check
					if (typeof val === "string" && val.trim() === "")
						return false;

					// Empty array does not pass required check
					if (Array.isArray(val) && val.length === 0)
						return false;

					// False does not pass required check
					if (typeof val === "boolean" && val === false)
						return false;

					return true;
				};
			}
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
