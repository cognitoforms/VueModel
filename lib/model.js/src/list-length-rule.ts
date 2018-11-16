import { RangeRule } from "./range-rule";
import { Property, Property$format } from "./property";
import { Entity } from "./entity";
import { Type } from "./type";
import { Resource } from "./resource";

export class ListLengthRule extends RangeRule {

	constructor(rootType: Type, options: any, skipRegistration: boolean = false) {
		/// <summary>Creates a rule that validates a list property contains a specific range of items.</summary>
		/// <param name="rootType" type="Type">The model type the rule is for.</param>
		/// <param name="options" type="Object">
		///		The options for the rule, including:
		///			property:			the property being validated (either a Property instance or string property name)
		///			min:				the minimum valid value of the property (or function)
		///			max:				the maximum valid value of the property (or function)
		///			name:				the optional unique name of the type of validation rule
		///			conditionType:		the optional condition type to use, which will be automatically created if not specified
		///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
		///			message:			the message to show the user when the validation fails
		///		    onChangeOf:			an array of property paths (strings, Property or PropertyChain instances) that drive when the rule should execute due to property changes
		/// </param>
		/// <returns type="ListLengthRule">The new list length rule.</returns>

		// ensure the rule name is specified
		options.name = options.name || "ListLength";

		let min = options.min;
		delete options.min;

		let max = options.max;
		delete options.max;

		// call the base type constructor
		super(rootType, options, true);

		// store the min and max lengths
		Object.defineProperty(this, "_min", { value: min });
		Object.defineProperty(this, "_max", { value: max });

		if (!skipRegistration) {
			// Register the rule after loading has completed
			rootType.model.registerRule(this);
		}
	}

	// returns true if the property is valid, otherwise false
	isValid(obj: Entity, prop: Property, val: any): boolean {
		var range = this.range(obj);
		return val === null || val === undefined || ((!range.min || val.length >= range.min) && (!range.max || val.length <= range.max));
	}

	getMessage(obj: Entity): string {

		var range = this.range(obj);

		// ensure the error message is specified
		var message =
			(range.min && range.max ? Resource.get("listlength-between").replace("{min}", Property$format(this.property, range.min) || range.min).replace("{max}", Property$format(this.property, range.max) || range.max) :
				range.min ?
					Resource.get("listlength-at-least").replace("{min}", Property$format(this.property, range.min) || range.min) : // at least ordinal
					Resource.get("listlength-at-most").replace("{max}", Property$format(this.property, range.max) || range.max)); // at most ordinal

		return message.replace('{property}', this.property.label);
	}

}
