import { ValidationRule, ValidationRuleOptions } from "./validation-rule";
import { Property } from "./property";
import { PropertyChain } from "./property-chain";
import { Entity } from "./entity";
import { Type } from "./type";
import { getResource } from "./resource";
import { PropertyPath } from "./property-path";

export class AllowedValuesRule extends ValidationRule {
	readonly source: ((this: Entity) => any[]);
	readonly ignoreValidation: boolean;

	/**
	 * Creates a rule that validates whether a selected value or values is in a list of allowed values.
	 * @param rootType The root type to bind the rule to
	 * @param options The rule configuration options
	 */
	constructor(rootType: Type, options: AllowedValuesRuleOptions) {
		// ensure the rule name is specified
		options.name = options.name || "AllowedValues";

		// ensure the error message is specified
		options.message = options.message || getResource("allowed-values", rootType.model.$locale);
	
		// convert property path sources into a source function
		let source: (this: Entity) => any[];
		if (options.source instanceof Property || options.source instanceof PropertyChain) {
			let sourcePath = options.source;
			options.onChangeOf = [sourcePath];
			options.source = source = function () { return sourcePath.value(this); };
		}
		else
			source = options.source as (this: Entity) => any[];

		// create the validation function
		options.isValid = function(this: Entity, prop: Property, value: any): boolean {
			if (options.ignoreValidation) {
				return true;
			}
	
			// return true if no value is currently selected
			if (!value) {
				return true;
			}
	
			// get the list of allowed values of the property for the given object
			var allowed = source.call(this);
	
			// ensure that the value or list of values is in the allowed values list (single and multi-select)				
			if (value instanceof Array) {
				return value.every(function (item) { return allowed.indexOf(item) >= 0; });
			} 
			else {
				return allowed.indexOf(value) >= 0;
			}
		};

		// call the base type constructor
		super(rootType, options);

		// store the allowed values source
		this.source = source;
		this.ignoreValidation = !!options.ignoreValidation;
	}

	values(obj: Entity): any[] {
		return this.source.call(obj);
	}

	toString(): string {
		return `${this.property.containingType.fullName}.${this.property.name} allowed values`;
	}
}

export interface AllowedValuesRuleOptions extends ValidationRuleOptions {

	/** The source property for the allowed values (either a Property or PropertyChain instance). */
	source?: PropertyPath | ((this: Entity) => any[]);

	ignoreValidation?: boolean;
}
