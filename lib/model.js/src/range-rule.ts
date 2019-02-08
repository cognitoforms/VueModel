import { ValidatedPropertyRule } from "./validated-property-rule";
import { Property, Property$format } from "./property";
import { Entity } from "./entity";
import { Type } from "./type";
import { Resource } from "./resource";

export class RangeRule extends ValidatedPropertyRule {

	_min: string | ((this: Entity) => any);

	_max: string | ((this: Entity) => any);

	constructor(rootType: Type, options: any) {
		/// <summary>Creates a rule that validates a property value is within a specific range.</summary>
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
		/// <returns type="RangeRule">The new range rule.</returns>

		// exit immediately if called with no arguments
		if (arguments.length == 0) return;

		// ensure the rule name is specified
		options.name = options.name || "Range";

		// get the property being validated in order to determine the data type
		var property: Property = options.property instanceof Property ? options.property : rootType.getProperty(options.property);

		// coerce date range constants
		if (options.min && !(options.min instanceof Function) && typeof options.min !== "string" && property.propertyType === Date) {
			options.min = new Date(options.min);
		}
		if (options.max && !(options.max instanceof Function) && typeof options.max !== "string" && property.propertyType === Date) {
			options.max = new Date(options.max);
		}

		// coerce null ranges to undefined
		if (options.min === null) {
			options.min = undefined;
		}
		if (options.max === null) {
			options.max = undefined;
		}

		// call the base type constructor
		super(rootType, options);

		// Store the min and max functions
		Object.defineProperty(this, "_min", { value: options.min, writable: true });
		Object.defineProperty(this, "_max", { value: options.max, writable: true });
	}

	// get the min and max range in effect for this rule for the specified instance
	range(obj: Entity): { min?: any, max?: any } {

		// convert string functions into compiled functions on first execution
		if (this._min && !(this._min instanceof Function)) {
			if (typeof this._min === "string") {
				this._min = (new Function(this._min)) as (this: Entity) => any;
			} else {
				// convert constant values into functions
				let min = this._min;
				this._min = function () { return min; };
			}
		}
		if (this._max && !(this._max instanceof Function)) {
			if (typeof this._max === "string") {
				this._max = (new Function(this._max)) as (this: Entity) => any;
			} else {
				// convert constant values into functions
				let max = this._max;
				this._max = function () { return max; };
			}
		}

		// determine the min and max values based on the current state of the instance
		var range: { min?: any, max?: any } = {};
		if (this._min && this._min instanceof Function)
			try { range.min = this._min.call(obj); } catch (e) { }
		if (this._max && this._max instanceof Function)
			try { range.max = this._max.call(obj); } catch (e) { }
		range.min = range.min == null ? undefined : range.min;
		range.max = range.max == null ? undefined : range.max;

		return range;
	}

	// returns true if the property is valid, otherwise false
	isValid(obj: Entity, prop: Property, val: any) {
		var range = this.range(obj);
		return val === null || val === undefined || ((range.min === undefined || val >= range.min) && (range.max === undefined || val <= range.max));
	}

	getMessage(obj: Entity): string {

		var range = this.range(obj);

		// ensure the error message is specified
		var message =
			(range.min !== undefined && range.max !== undefined ? Resource.get("range-between").replace("{min}", Property$format(this.property, range.min) || range.min).replace("{max}", Property$format(this.property, range.max) || range.max) : // between date or ordinal
				this.property.propertyType === Date ?
					range.min !== undefined ?
						Resource.get("range-on-or-after").replace("{min}", Property$format(this.property, range.min) || range.min) : // on or after date
						Resource.get("range-on-or-before").replace("{max}", Property$format(this.property, range.max) || range.max) : // on or before date
					range.min !== undefined ?
						Resource.get("range-at-least").replace("{min}", Property$format(this.property, range.min) || range.min) : // at least ordinal
						Resource.get("range-at-most").replace("{max}", Property$format(this.property, range.max) || range.max)); // at most ordinal

		return message.replace('{property}', this.property.label);
	}

	// get the string representation of the rule
	toString() {
		return `${this.property.containingType.fullName}.${this.property.name} in range, min: , max: `;
	}

}