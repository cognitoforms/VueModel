import { ValidatedPropertyRule, ValidatedPropertyRuleOptions } from "./validated-property-rule";
import { ConditionRuleOptions } from "./condition-rule";
import { Property, PropertyRuleOptions } from "./property";
import { Entity } from "./entity";
import { Type } from "./type";
import { Resource } from "./resource";
import { RuleOptions } from "./rule";

export class StringFormatRule extends ValidatedPropertyRule {

	description: string;
	expression: RegExp;
	reformat: string | ((val: any) => string);

	/**
	 * Creates a rule that validates that a string property value is correctly formatted.
	 * @param rootType The model type the rule is for.
	 * @param options The options for the rules.
	 */
	constructor(rootType: Type, options: StringFormatRuleOptions) {

		// exit immediately if called with no arguments
		if (arguments.length == 0) return;

		// ensure the rule name is specified
		options.name = options.name || "StringFormat";

		// ensure the error message is specified
		if (typeof options.message === "string") {
			if (Resource.get(options.message)) {
				options.message = Resource.get(options.message);
			} else {
				delete options.message;
			}
		}

		if (!options.message) {
			options.message = Resource.get("string-format").replace("{formatDescription}", options.description);
		}

		// call the base type constructor
		super(rootType, options);
	
		// define properties for the rule
		Object.defineProperty(this, "description", { value: options.description });
		Object.defineProperty(this, "expression", { value: options.expression instanceof RegExp ? options.expression : RegExp(options.expression) });
		Object.defineProperty(this, "reformat", { value: options.reformat });
	}

	// returns true if the property is valid, otherwise false
	isValid(obj: Entity, prop: Property, val: any): boolean {
		var isValid = true;
		if (val && val != "") {
			this.expression.lastIndex = 0;
			isValid = this.expression.test(val);
			if (isValid && this.reformat) {
				if (this.reformat instanceof Function) {
					val = this.reformat(val);
				}
				else {
					this.expression.lastIndex = 0;
					val = val.replace(this.expression, this.reformat);
				}
				prop.value(obj, val);
			}
		}
		return isValid;
	}

	// get the string representation of the rule
	toString() {
		return `${this.property.containingType.fullName}.${this.property.name} formatted as ${this.description}`;
	}

}

export interface StringFormatRuleOptions extends ValidatedPropertyRuleOptions {

	/** The human readable description of the format, such as MM/DD/YYY */
	description: string;

	/** A regular expression instance or string that the property value must match */
	expression: RegExp | string;

	/** An optional regular expression reformat string or reformat function that will be used to correct the value if it matches */
	reformat: string | ((val: any) => string);

}
