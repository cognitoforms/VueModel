import { ValidatedPropertyRule } from "./validated-property-rule";
import { Resource } from "./resource";
import { Type } from "./type";
import { Entity } from "./entity";
import { Property } from "./property";

export class RequiredRule extends ValidatedPropertyRule {

	requiredValue: any;

	constructor(rootType: Type, options: any, skipRegistration: boolean = false) {
		/// <summary>Creates a rule that validates that a property has a value.</summary>
		/// <param name="rootType" type="Type">The model type the rule is for.</param>
		/// <param name="options" type="Object">
		///		The options for the rule, including:
		///			property:			the property being validated (either a Property instance or string property name)
		///			name:				the optional unique name of the type of validation rule
		///			conditionType:		the optional condition type to use, which will be automatically created if not specified
		///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
		///			message:			the message to show the user when the validation fails
		///			requiredValue:		the optional required value
		/// </param>
		/// <returns type="RequiredRule">The new required rule.</returns>

		// ensure the rule name is specified
		options.name = options.name || "Required";

		// ensure the error message is specified
		options.message = options.message || Resource.get("required");

		// call the base type constructor
		super(rootType, options, true);

		if (options.requiredValue)
			Object.defineProperty(this, "requiredValue", { value: options.requiredValue });

		if (!skipRegistration) {
			// Register the rule after loading has completed
			rootType.model.registerRule(this);
		}
	}

	// define a global function that determines if a value exists
	static hasValue(val: any) {
		return val !== undefined && val !== null && (val.constructor !== String || val.trim() !== "") && (!(val instanceof Array) || val.length > 0);
	}

	// returns true if the property is valid, otherwise false
	isValid(obj: Entity, prop: Property, val: any) {
		if (this.requiredValue)
			return val === this.requiredValue;
		else
			return RequiredRule.hasValue(val);
	}

	// get the string representation of the rule
	toString() {
		return `${this.property.containingType.fullName}.${this.property.name} is required`;
	}

}
