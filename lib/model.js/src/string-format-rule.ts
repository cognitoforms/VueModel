import { ValidationRule, ValidationRuleOptions } from "./validation-rule";
import { Property } from "./property";
import { Entity } from "./entity";
import { Type } from "./type";

export class StringFormatRule extends ValidationRule {
	private readonly description: string;

	/**
	 * Creates a rule that validates that a string property value is correctly formatted.
	 * @param rootType The model type the rule is for.
	 * @param options The options for the rules.
	 */
	constructor(rootType: Type, options: StringFormatRuleOptions) {
		// exit immediately if called with no arguments
		if (arguments.length > 0) {
			// ensure the rule name is specified
			options.name = options.name || "StringFormat";

			// ensure the error message is specified
			if (typeof options.message === "string") {
				if (rootType.model.getResource(options.message)) {
					options.message = rootType.model.getResource(options.message);
				}
				else {
					delete options.message;
				}
			}

			// get the default validation message if not specified
			if (!options.message) {
				options.message = rootType.model.getResource("string-format").replace("{formatDescription}", options.description);
			}

			let expression = options.expression instanceof RegExp ? options.expression : RegExp(options.expression);
			let reformat = options.reformat;

			// create the string format validation function
			options.isValid = function(this: Entity, prop: Property, val: any): boolean {
				var isValid = true;
				if (val && val !== "") {
					expression.lastIndex = 0;
					isValid = expression.test(val);
					if (isValid && options.reformat) {
						if (reformat instanceof Function) {
							val = reformat(val);
						}
						else {
							expression.lastIndex = 0;
							val = val.replace(expression, reformat);
						}
						prop.value(this, val);
					}
				}
				return isValid;
			};
		}

		// call the base type constructor
		super(rootType, options);
	
		// define properties for the rule
		this.description = options.description;
	}

	// get the string representation of the rule
	toString(): string {
		return `${this.property.containingType.fullName}.${this.property.name} formatted as ${this.description}`;
	}
}

export interface StringFormatRuleOptions extends ValidationRuleOptions {

	/** The human readable description of the format, such as MM/DD/YYY */
	description: string;

	/** A regular expression instance or string that the property value must match */
	expression: RegExp | string;

	/** An optional regular expression reformat string or reformat function that will be used to correct the value if it matches */
	reformat: string | ((val: any) => string);
}
