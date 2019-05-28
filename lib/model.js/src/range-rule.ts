import { ValidationRule, ValidationRuleOptions } from "./validation-rule";
import { Property$format } from "./property";
import { Entity } from "./entity";
import { Type } from "./type";

/**
 * A rule that validates that a property value is within a specific range
 */
export class RangeRule extends ValidationRule {
	/**
	 * Creates a rule that validates a property value is within a specific range
	 * @param rootType The model type the rule is for
	 * @param options The options for the rule
	 */
	constructor(rootType: Type, options: RangeRuleOptions) {
		// ensure the rule name is specified
		options.name = options.name || "Range";

		options.message = function(this: Entity): string {
			var range: { min?: any; max?: any } = {};

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

			var val = options.property.value(this);

			if (val == null) {
				return null;
			}

			if ((range.min == null || val >= range.min) && (range.max == null || val <= range.max)) {
				// Value is within range
				return null;
			}

			if (range.min !== undefined && range.max !== undefined)
				return rootType.model.getResource("range-between").replace("{min}", Property$format(options.property, range.min) || range.min).replace("{max}", Property$format(options.property, range.max) || range.max);

			if (options.property.propertyType === Date) {
				if (range.min != null)
					return rootType.model.getResource("range-on-or-after").replace("{min}", Property$format(options.property, range.min) || range.min);
				else
					return rootType.model.getResource("range-on-or-before").replace("{max}", Property$format(options.property, range.max) || range.max);
			}

			if (range.min != null)
				return rootType.model.getResource("range-at-least").replace("{min}", Property$format(options.property, range.min) || range.min);
			else
				return rootType.model.getResource("range-at-most").replace("{max}", Property$format(options.property, range.max) || range.max);
		};

		// call the base type constructor
		super(rootType, options);
	}

	// get the string representation of the rule
	toString(): string {
		return `${this.property.containingType.fullName}.${this.property.name} in range, min: , max: `;
	}
}

export interface RangeRuleOptions extends ValidationRuleOptions {
	min: (this: Entity) => any;
	max: (this: Entity) => any;
}
