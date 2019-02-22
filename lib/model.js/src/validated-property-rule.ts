import { ConditionRule, ConditionRuleOptions } from "./condition-rule";
import { registerPropertyRule, RuleOptions } from "./rule";
import { PropertyRule, Property, PropertyRuleOptions } from "./property";
import { Entity } from "./entity";
import { Type } from "./type";

export class ValidatedPropertyRule extends ConditionRule implements PropertyRule {

	property: Property;

	private _isValid: (this: Entity, prop: Property, val: any) => boolean;

	constructor(rootType: Type, options: RuleOptions & ConditionRuleOptions & ValidatedPropertyRuleOptions) {
		/// <summary>Creates a rule that validates the value of a property in the model.</summary>
		/// <param name="rootType" type="Type">The model type the rule is for.</param>
		/// <param name="options" type="Object">
		///		The options for the rule, including:
		///			property:			the property being validated (either a Property instance or string property name)
		///			isValid:			function (obj, prop, val) { return true; } (a predicate that returns true when the property is valid)
		///			name:				the optional unique name of the type of validation rule
		///			conditionType:		the optional condition type to use, which will be automatically created if not specified
		///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
		///			message:			the message to show the user when the validation fails
		///			properties:			an array of property paths the validation condition should be attached to when asserted, in addition to the target property
		///			onInit:				true to indicate the rule should run when an instance of the root type is initialized, otherwise false
		///			onInitNew:			true to indicate the rule should run when a new instance of the root type is initialized, otherwise false
		///			onInitExisting:		true to indicate the rule should run when an existing instance of the root type is initialized, otherwise false
		///			onChangeOf:			an array of property paths (strings, Property or PropertyChain instances) that drive when the rule should execute due to property changes
		/// </param>
		/// <returns type="ValidatedPropertyRule">The new validated property rule.</returns>

		// exit immediately if called with no arguments
		if (arguments.length == 0) return;

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
			options.message = options.message.replace('{property}', property.label);
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

	message?: string
}

export interface ValidatedPropertyRuleConstructor {
	new(rootType: Type, options: ValidatedPropertyRuleOptions) : ValidatedPropertyRule;
}
