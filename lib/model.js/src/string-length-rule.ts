import { RangeRule } from "./range-rule";
import { Property } from "./property";
import { Entity } from "./entity";
import { Type } from "./type";
import { getResource } from "./resource";

export class StringLengthRule extends RangeRule {
	constructor(rootType: Type, options: any) {
		/// <summary>Creates a rule that validates that the length of a string property is within a specific range.</summary>
		/// <param name="rootType" type="Type">The model type the rule is for.</param>
		/// <param name="options" type="Object">
		///		The options for the rule, including:
		///			property:			the property being validated (either a Property instance or string property name)
		///			min:				the minimum length of the property
		///			max:				the maximum length of the property
		///			name:				the optional unique name of the type of validation rule
		///			conditionType:		the optional condition type to use, which will be automatically created if not specified
		///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
		///			message:			the message to show the user when the validation fails
		/// </param>
		/// <returns type="RangeRule">The new range rule.</returns>

		// ensure the rule name is specified
		options.name = options.name || "StringLength";

		// ensure the error message is specified
		options.message = options.message ||
			(options.min && options.max ? getResource("string-length-between", rootType.model.$locale).replace("{min}", options.min).replace("{max}", options.max) :
				options.min ? getResource("string-length-at-least", rootType.model.$locale).replace("{min}", options.min) :
					getResource("string-length-at-most", rootType.model.$locale).replace("{max}", options.max));

		let min = options.min;
		delete options.min;

		let max = options.max;
		delete options.max;

		// call the base type constructor
		super(rootType, options);

		// store the min and max lengths
		Object.defineProperty(this, "_min", { value: min });
		Object.defineProperty(this, "_max", { value: max });
	}

	// returns true if the property is valid, otherwise false
	isValid(obj: Entity, prop: Property, val: any): boolean {
		return !val || val === "" || ((!this._min || val.length >= this._min) && (!this._max || val.length <= this._max));
	}

	// get the string representation of the rule
	toString(): string {
		return `${this.property.containingType.fullName}.${this.property.name} in range, min: , max: `;
	}
}