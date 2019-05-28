import { ConditionRule, ConditionRuleOptions } from "./condition-rule";
import { PropertyRule, Property, PropertyRuleOptions } from "./property";
import { Entity } from "./entity";
import { Type } from "./type";
import { Format } from "./format";

export class ValidationRule extends ConditionRule implements PropertyRule {
	property: Property;

	constructor(rootType: Type, options: ValidationRuleOptions) {
		// ensure the rule name is specified
		options.name = options.name || "ValidatedProperty";

		// store the property being validated
		var property = options.property;

		// ensure the properties and predicates to include the target property
		if (!options.properties) {
			options.properties = [property];
		}
		else if (options.properties.indexOf(property) < 0) {
			options.properties.push(property);
		}

		if (!options.onChangeOf) {
			options.onChangeOf = [property];
		}
		else if (options.onChangeOf.indexOf(property) < 0) {
			options.onChangeOf.push(property);
		}

		// default condition category to Error if a condition category was not specified
		if (!options.conditionType) {
			options.category = "Error";
		}

		// replace the property label token in the validation message if present
		if (options.message && (typeof options.message === "function" || (typeof options.message === "string" && options.message.indexOf("{property}") >= 0))) {
			// Property label with dynamic format tokens
			if (Format.hasTokens(property.label)) {
				// convert the property label into a model format
				let format = rootType.model.getFormat(rootType.jstype, property.label);

				// ensure tokens included in the format trigger rule execution
				format.paths.forEach(p => {
					rootType.getPaths(p).forEach(prop => {
						if (!options.onChangeOf) {
							options.onChangeOf = [prop];
						}
						else if (options.onChangeOf.indexOf(prop) < 0) {
							options.onChangeOf.push(prop);
						}
					});
				});

				if (typeof options.message === "function") {
					let messageFunction = options.message;

					// Create a function to apply the format to the property label when generating the message
					options.message = function () {
						let message = messageFunction.call(this);
						if (typeof message === "string" && message.trim().length > 0 && message.indexOf("{property}") >= 0) {
							message = message.replace("{property}", format.convert(this));
						}
						return message;
					};
				}
				else if (typeof options.message === "string") {
					let messageTemplate = options.message;

					// Create a function to apply the format to the property label when generating the message
					options.message = function () {
						return messageTemplate.replace("{property}", format.convert(this));
					};
				}
			}
			// Static property label
			else if (typeof options.message === "string") {
				options.message = options.message.replace("{property}", property.label);
			}
			// Use static property label in function return value
			else if (typeof options.message === "function") {
				let messageFunction = options.message;

				// Create a function to apply the format to the property label when generating the message
				options.message = function () {
					let message = messageFunction.call(this);
					if (typeof message === "string" && message.trim().length > 0 && message.indexOf("{property}") >= 0) {
						message = message.replace("{property}", property.label);
					}
					return message;
				};
			}
		}

		if (options.isValid) {
			options.assert = function(this: Entity): boolean {
				var isValid = options.isValid.call(this, options.property as Property, options.property.value(this));
				return isValid === undefined ? isValid : !isValid;
			};
		}

		// call the base rule constructor
		super(rootType, options);

		Object.defineProperty(this, "property", { value: property });

		// register the rule with the target property
		this.property.rules.push(this);
	}
}

export interface ValidationRuleOptions extends ConditionRuleOptions, PropertyRuleOptions {

	// function (obj, prop, val) { return true; } (a predicate that returns true when the property is valid)
	isValid?: ((this: Entity, prop: Property, val: any) => boolean);

}

export interface ValidationRuleConstructor {
	new(rootType: Type, options: ValidationRuleOptions): ValidationRule;
}
