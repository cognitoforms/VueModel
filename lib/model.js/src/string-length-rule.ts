import { ValidationRule, ValidationRuleOptions } from "./validation-rule";
import { Entity } from "./entity";
import { Type } from "./type";

/**
 * A rule that validates that validates that the length of a string property is within a specific range
 */
export class StringLengthRule extends ValidationRule {
	/**
	 * Creates a rule that validates that the length of a string property is within a specific range
	 * @param rootType The model type the rule is for
	 * @param options The options for the rule
	 */
	constructor(rootType: Type, options: any) {
		// ensure the rule name is specified
		options.name = options.name || "StringLength";

		options.message = function(this: Entity): string {
			var range: { min?: number; max?: number } = {};

			if (options.min && options.min instanceof Function) {
				try {
					range.min = options.min.call(this);
				}
				catch (e) {
					// Silently ignore min errors
				}
			}

			if (options.max && options.max instanceof Function) {
				try {
					range.max = options.max.call(this);
				}
				catch (e) {
					// Silently ignore max errors
				}
			}

			var val: string = options.property.value(this);

			if (val == null || typeof val !== "string" || val.length === 0) {
				return null;
			}

			if ((range.min == null || val.length >= range.min) && (range.max == null || val.length <= range.max)) {
				// Value is within range
				return null;
			}

			if (range.min != null && range.max != null)
				return rootType.model.getResource("string-length-between").replace("{min}", range.min.toString()).replace("{max}", range.max.toString());

			if (range.min != null)
				return rootType.model.getResource("string-length-at-least").replace("{min}", range.min.toString());
			else
				return rootType.model.getResource("string-length-at-most").replace("{max}", range.max.toString());
		};

		// call the base type constructor
		super(rootType, options);
	}

	// get the string representation of the rule
	toString(): string {
		return `${this.property.containingType.fullName}.${this.property.name} string length, min: , max: `;
	}
}

export interface StringLengthRuleOptions extends ValidationRuleOptions {
	min?: (this: Entity) => number;
	max?: (this: Entity) => number;
}
