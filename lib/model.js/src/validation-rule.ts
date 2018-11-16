import { ValidatedPropertyRule } from "./validated-property-rule";
import { Property } from "./property";
import { Entity } from "./entity";
import { Type } from "./type";
import { Resource } from "./resource";

export class ValidationRule extends ValidatedPropertyRule {

	_isError: string | ((this: Entity) => boolean);

	constructor(rootType: Type, options: any, skipRegistration: boolean = false) {
		/// <summary>Creates a rule that performs custom validation for a property.</summary>
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
		options.name = options.name || "Validation";

		// ensure the error message is specified
		if (Resource.get(options.message))
			options.message = "\"" + Resource.get(options.message) + "\"";
		else
			options.message = options.message || Resource.get("validation");

		var prop = options.property instanceof Property ? options.property : rootType.getProperty(options.property);
		options.message = options.message.replace('{property}', prop.get_label().replace(/\"/g, "\\\""));

		// call the base type constructor
		super(rootType, options, true);

		// predicate-based rule
		if (options.isError || options.fn) {
			Object.defineProperty(this, "_isError", { value: options.isError || options.fn, writable: true });
		}

		if (!skipRegistration) {
			// Register the rule after loading has completed
			rootType.model.registerRule(this);
		}

	}

	/**
	 * returns true if the property is valid, otherwise false
	 * @param entity the entity being validated
	 * @param prop the property to validate
	 * @param val the value to test
	 */
	isValid(entity, prop, val) {

		// convert string functions into compiled functions on first execution
		if (typeof this._isError === "string") {
			this._isError = (new Function(this._isError)) as ((this: Entity) => boolean);
		}

		// convert string functions into compiled functions on first execution
		if (typeof this._message === "string") {
			var message = (new Function(this._message));
			this._message = function (this: Entity) {
				try { return message.call(this); } catch (e) { return ""; }
			};
		}

		try {
			return !this._isError.call(entity) || !this._message.call(entity);
		}
		catch (e) {
			return true;
		}
	}

	/**
	 *	Gets the string representation of the rule.
	 * */
	toString() {
		return `${this.property.containingType.fullName}.${this.property.name} is invalid`;
	}

}