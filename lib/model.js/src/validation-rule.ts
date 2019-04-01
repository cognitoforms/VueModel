import { ConditionRule } from "./condition-rule";
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
		if (options.message && typeof (options.message) !== "function" && options.message.indexOf("{property}") >= 0) {
			// Property label with dynamic format tokens
			if (Format.hasTokens(property.label)) {
				// convert the property label into a model format
				let format = Format.fromTemplate(rootType, property.label);

				// create a function to apply the format to the property label when generating the message
				let message = options.message;
				options.message = function () { return message.replace("{property}", format.convert(this)); };

				// ensure tokens included in the format trigger rule execution
				Array.prototype.push.apply(options.properties, format.paths);
			}

			// Static property label
			else {
				options.message = options.message.replace("{property}", property.label);
			}
		}

		options.assert = function(this: Entity): boolean {
			var isValid = options.isValid.call(this, options.property as Property, options.property.value(this));
			return isValid === undefined ? isValid : !isValid;
		};

		// call the base rule constructor
		super(rootType, options);

		Object.defineProperty(this, "property", { value: property });

		// register the rule with the target property
		this.property.rules.push(this);
	}
}

export interface ValidationRuleOptions extends PropertyRuleOptions {

	// function (obj, prop, val) { return true; } (a predicate that returns true when the property is valid)
	isValid?: ((this: Entity, prop: Property, val: any) => boolean);

	message?: string | ((this: Entity) => string);
}

export interface ValidationRuleConstructor {
	new(rootType: Type, options: ValidationRuleOptions): ValidationRule;
}
