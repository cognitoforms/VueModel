import { ConditionRule, ConditionRuleOptions } from "./condition-rule";
import { registerPropertyRule, RuleOptions } from "./rule";
import { PropertyRule, Property, PropertyRuleOptions } from "./property";
import { Entity } from "./entity";
import { Type } from "./type";
import { Format } from "./format";

export class ValidatedPropertyRule extends ConditionRule implements PropertyRule {

	property: Property;

	private _isValid: (this: Entity, prop: Property, val: any) => boolean;

	constructor(rootType: Type, options: ValidatedPropertyRuleOptions) {
		// ensure the rule name is specified
		options.name = options.name || "ValidatedProperty";

		// store the property being validated
		var property = typeof options.property === "string" ? rootType.getProperty(options.property) as Property : options.property as Property;

		// ensure the properties and predicates to include the target property

		if (!options.properties) {
			options.properties = [property.name];
		} else if (options.properties.indexOf(property.name) < 0 && options.properties.indexOf(property) < 0) {
			options.properties.push(property.name);
		}

		if (!options.onChangeOf) {
			options.onChangeOf = [property];
		} else if (options.onChangeOf.indexOf(property.name) < 0 && options.onChangeOf.indexOf(property) < 0) {
			options.onChangeOf.push(property);
		}

		// Default condition category to Error if a condition category was not specified
		if (!options.conditionType) {
			options.category = "Error";
		}

		// replace the property label token in the validation message if present
		if (options.message && typeof (options.message) !== "function") {
			if (Format.hasTokens(property.label)) {
				let format = Format.fromTemplate(rootType, property.label);
				let message = options.message;
				options.message = function () { return message.replace('{property}', format.convert(this)); }
			}
			else {
				options.message = options.message.replace('{property}', property.label);
			}
		}

		// call the base rule constructor
		super(rootType, options);

		Object.defineProperty(this, "property", { value: property });

		// override the prototype isValid function if specified
		if (options.isValid instanceof Function) {
			Object.defineProperty(this, "_isValid", { value: options.isValid });
		}
	}

	// returns false if the property is valid, true if invalid, or undefined if unknown
	isValid(obj: Entity, prop: Property, val: any): boolean {
		return this._isValid.call(obj, prop, val);
	}

	// returns false if the property is valid, true if invalid, or undefined if unknown
	assert(obj: Entity): boolean {
		var isValid = this.isValid(obj, this.property as Property, this.property.value(obj));
		return isValid === undefined ? isValid : !isValid;
	}

	// perform addition initialization of the rule when it is registered
	onRegister(): void {

		// register the rule with the target property
		registerPropertyRule(this);
	}

}

export interface ValidatedPropertyRuleOptions extends PropertyRuleOptions {

	// function (obj, prop, val) { return true; } (a predicate that returns true when the property is valid)
	isValid?: string | ((this: Entity, prop: Property, val: any) => boolean);

	message?: string | ((this: Entity) => string);
}

export interface ValidatedPropertyRuleConstructor {
	new(rootType: Type, options: ValidatedPropertyRuleOptions) : ValidatedPropertyRule;
}
