import { ValidatedPropertyRule } from "./validated-property-rule";
import { Resource } from "./resource";
import { Type } from "./type";
import { Entity } from "./entity";
import { RequiredRule } from "./required-rule";

export class RequiredIfRule extends ValidatedPropertyRule {

	requiredValue: any;

	_isRequired: string | ((this: Entity) => boolean);

	constructor(rootType: Type, options: any) {
		/// <summary>Creates a rule that conditionally validates whether a property has a value.</summary>
		/// <param name="rootType" type="Type">The model type the rule is for.</param>
		/// <param name="options" type="Object">
		///		The options for the rule, including:
		///			property:			the property being validated (either a Property instance or string property name)
		///			isRequired:			a predicate function indicating whether the property should be required
		///			name:				the optional unique name of the type of validation rule
		///			conditionType:		the optional condition type to use, which will be automatically created if not specified
		///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
		///			message:			the message to show the user when the validation fails
		///		    onInit:				true to indicate the rule should run when an instance of the root type is initialized, otherwise false
		///		    onInitNew:			true to indicate the rule should run when a new instance of the root type is initialized, otherwise false
		///		    onInitExisting:		true to indicate the rule should run when an existing instance of the root type is initialized, otherwise false
		///		    onChangeOf:			an array of property paths (strings, Property or PropertyChain instances) that drive when the rule should execute due to property changes
		///			requiredValue:		the optional required value
		/// </param>
		/// <returns type="RequiredIfRule">The new required if rule.</returns>

		options.name = options.name || "RequiredIf";

		// ensure changes to the compare source triggers rule execution
		if (!options.onChangeOf && options.compareSource) {
			options.onChangeOf = [options.compareSource];
		}

		if (!options.isRequired && options.fn) {
			options.isRequired = options.fn;
			options.fn = null;
		}

		// predicate-based rule
		if (options.isRequired) {
			options.message = options.message || Resource.get("required");
		}

		// call the base type constructor
		super(rootType, options);

		// predicate-based rule
		if (options.isRequired) {
			Object.defineProperty(this, "_isRequired", { value: options.isRequired, writable: true });
		}

		if (options.requiredValue)
			Object.defineProperty(this, "requiredValue", { value: options.requiredValue });
	}

	// returns false if the property is valid, true if invalid, or undefined if unknown
	assert(obj: Entity): boolean {
		var isReq;

		// convert string functions into compiled functions on first execution
		if (typeof this._isRequired === "string") {
			this._isRequired = (new Function(this._isRequired)) as (this: Entity) => boolean;
		}

		try {
			isReq = this._isRequired.call(obj);
		} catch (e) {
			isReq = false;
		}

		if (this.requiredValue) {
			return isReq && this.property.value(obj) !== this.requiredValue;
		} else {
			return isReq && !RequiredRule.hasValue(this.property.value(obj));
		}
	}

}
