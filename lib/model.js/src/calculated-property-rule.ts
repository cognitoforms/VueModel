import { Rule, RuleInvocationOptions } from "./rule";
import { Type } from "./type";
import { Property, PropertyRuleOptions } from "./property";
import { Entity } from "./entity";
import { ObservableArray, updateArray } from "./observable-array";
import { RuleInvocationType } from "./rule-invocation-type";

let calculationErrorDefault: any;

export class CalculatedPropertyRule extends Rule {
	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the object is
	readonly property: Property;

	// Public settable properties that are simple values with no side-effects or logic
	defaultIfError: any;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
	private _calculateFn: string | ((this: Entity) => any);

	constructor(rootType: Type, name: string, options: CalculatedPropertyRuleOptions) {
		let property: Property;
		let defaultIfError: any = calculationErrorDefault;
		let calculateFn: string | ((this: Entity) => any);
		
		if (!name) {
			name = options.name;
		}

		if (options) {
			if (options.property) {
				property = typeof options.property === "string" ? rootType.getProperty(options.property) as Property : options.property as Property;

				if (!options.isDefaultValue) {
					// indicate that the rule is responsible for returning the value of the calculated property
					options.returns = [property];
				}
				else {
					// Ensure the default value rule runs on init of a new instance
					(options as RuleInvocationOptions).onInitNew = true;
				}
			}

			if (!name) {
				// Generate a reasonable default rule name if not specified
				name = options.name = (rootType.fullName + "." + (typeof property === "string" ? property : property.name) + ".Calculated");	
			}

			defaultIfError = options.defaultIfError;
			calculateFn = options.calculate;
		}

		// Call the base rule constructor 
		super(rootType, name, options);

		// Public read-only properties
		Object.defineProperty(this, "property", { enumerable: true, value: property });

		// Public settable properties
		this.defaultIfError = defaultIfError;

		// Backing fields for properties
		if (calculateFn) Object.defineProperty(this, "_calculateFn", { enumerable: false, value: calculateFn, writable: true });

		// register the rule with the target property
		this.property.rules.push(this);

		// mark the property as calculated if the rule runs on property access
		if (this.invocationTypes & RuleInvocationType.PropertyGet)
			this.property.isCalculated = true;
	}

	execute(obj: Entity): void {
		let calculateFn: (this: Entity) => any;

		// Convert string functions into compiled functions on first execution
		if (this._calculateFn.constructor === String) {
			// TODO: Calculation expression support
			let calculateExpr = this._calculateFn as string;
			let calculateCompiledFn = new Function("return " + calculateExpr + ";");
			calculateFn = this._calculateFn = calculateCompiledFn as (this: Entity) => any;
		}
		else {
			calculateFn = this._calculateFn as (this: Entity) => any;
		}

		// Calculate the new property value
		var newValue;
		if (this.defaultIfError === undefined) {
			newValue = calculateFn.call(obj);
		}
		else {
			try {
				newValue = calculateFn.call(obj);
			}
			catch (e) {
				newValue = this.defaultIfError;
			}
		}

		// Exit immediately if the calculated result was undefined
		if (newValue === undefined) {
			return;
		}

		// modify list properties to match the calculated value instead of overwriting the property
		if (this.property.isList) {

			// re-calculate the list values
			var newList = newValue;

			// compare the new list to the old one to see if changes were made
			var curList = this.property.value(obj) as ObservableArray<any>;

			if (newList.length === curList.length) {
				var noChanges = true;

				for (var i = 0; i < newList.length; ++i) {
					if (newList[i] !== curList[i]) {
						noChanges = false;
						break;
					}
				}

				if (noChanges) {
					return;
				}
			}

			// update the current list so observers will receive the change events
			curList.batchUpdate((array) => {
				updateArray(array, newList);
			});
		}
		else {
			// Otherwise, just set the property to the new value
			this.property.value(obj, newValue, { calculated: true });
		}
	}

	toString(): string {
		return "calculation of " + this.property.name;
	}
}

export interface CalculatedPropertyRuleOptions extends PropertyRuleOptions {
	/** A function that returns the value to assign to the property, or undefined if the value cannot be calculated */
	calculate?: string | ((this: Entity) => any);

	/** A function that returns the value to assign to the property, or undefined if the value cannot be calculated */
	fn?: (this: Entity) => any;

	/** The value to return if an error occurs, or undefined to cause an exception to be thrown */
	defaultIfError?: any;

	/** Specifies whether or not the rule is to calculate a property's default value */
	isDefaultValue?: boolean;
}

export interface CalculatedPropertyRuleConstructor {
	/**
	 * Creates a rule that calculates the value of a property in the model
	 * @param rootType The model type the rule is for
	 * @param name The name of the rule
	 * @param options The options of the rule of type 'CalculatedPropertyRuleOptions'
	 */
	new(rootType: Type, name: string, options: CalculatedPropertyRuleOptions): Rule;
}
