import { Rule, registerPropertyRule } from "./rule";
import { CalculatedPropertyRule as ICalculatedPropertyRule, CalculatedPropertyRuleOptions } from "./interfaces";
import { RuleOptions } from "./interfaces";
import { Type as IType } from "./interfaces";
import { Property as IProperty } from "./interfaces";
import { Entity as IEntity } from "./interfaces";
import { Property$isProperty } from "./property";

let calculationErrorDefault: any;

export class CalculatedPropertyRule extends Rule implements ICalculatedPropertyRule {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the object is
	readonly property: IProperty;

	// Public settable properties that are simple values with no side-effects or logic
	defaultIfError: any;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
	private _calculateFn: string | ((entity: IEntity) => any);

	constructor(rootType: IType, name: string, options: CalculatedPropertyRuleOptions & RuleOptions, skipRegistration: boolean = false) {

		let property: IProperty;
		let defaultIfError: any = calculationErrorDefault;
		let calculateFn: string | ((entity: IEntity) => any);

		if (!name) {
			name = options.name;
		}

		if (options) {
			let thisOptions = extractCalculatedPropertyRuleOptions(options);

			if (thisOptions.property) {
				property = Property$isProperty(thisOptions.property) ? thisOptions.property as IProperty : rootType.getProperty(thisOptions.property as string);

				// indicate that the rule is responsible for returning the value of the calculated property
				options.returns = [thisOptions.property];
			}

			if (!name) {
				// Generate a reasonable default rule name if not specified
				name = options.name = (rootType.fullName + "." + (typeof property === "string" ? property : property.name) + ".Calculated");	
			}

			defaultIfError = thisOptions.defaultIfError;
			calculateFn = thisOptions.calculate;
		}

		// Call the base rule constructor 
		super(rootType, name, options, true);

		// Public read-only properties
		Object.defineProperty(this, "property", { enumerable: true, value: property });

		// Public settable properties
		this.defaultIfError = defaultIfError;

		// Backing fields for properties
		if (calculateFn) Object.defineProperty(this, "_calculateFn", { enumerable: false, value: calculateFn, writable: true });

		if (!skipRegistration) {
			// Register the rule after loading has completed
			rootType.model.registerRule(this);
		}

	}

	execute(obj: IEntity) {

		let calculateFn: (this: IEntity) => any;

		// Convert string functions into compiled functions on first execution
		if (this._calculateFn.constructor === String) {
			// TODO: Calculation expression support
			let calculateExpr = this._calculateFn as string;
			let calculateCompiledFn = new Function("return " + calculateExpr + ";");
			calculateFn = this._calculateFn = calculateCompiledFn as (this: IEntity) => any;
		} else {
			calculateFn = this._calculateFn as (this: IEntity) => any;
		}

		// Calculate the new property value
		var newValue;
		if (this.defaultIfError === undefined) {
			newValue = calculateFn.call(obj);
		} else {
			try {
				newValue = calculateFn.apply(obj);
			} catch (e) {
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
			var curList = this.property.value(obj);

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
			// curList.beginUpdate();
			// update(curList, newList);
			// curList.endUpdate();
			throw new Error("Calculated list properties are not yet implemented.");
		} else {
			// Otherwise, just set the property to the new value
			this.property.value(obj, newValue, { calculated: true });
		}
	}

	toString() {
		return "calculation of " + this.property.name;
	}

	// perform addition initialization of the rule when it is registered
	onRegister() {

		// register the rule with the target property
		registerPropertyRule(this);

		(this.property as any).isCalculated = true;

	}

}

export function CalcualatedPropertyRule$create(rootType: IType, property: IProperty, optionsOrFunction: ((this: IEntity) => any) | (CalculatedPropertyRuleOptions & RuleOptions)): CalculatedPropertyRule {

	let options: CalculatedPropertyRuleOptions & RuleOptions;

	if (optionsOrFunction) {
		// The options are the function to execute
		if (optionsOrFunction instanceof Function) {
			options = { calculate: optionsOrFunction };
		} else {
			options = optionsOrFunction as CalculatedPropertyRuleOptions;
		}
	}

	options.property = property;

	return new CalculatedPropertyRule(rootType, options.name, options);

}

function extractCalculatedPropertyRuleOptions(obj: any): CalculatedPropertyRuleOptions {

	if (!obj) {
		return;
	}

	let options: CalculatedPropertyRuleOptions = {};

	let keys = Object.keys(obj);

	let extractedKeys = keys.filter(key => {
		let value = obj[key];
		if (key === 'property') {
			if (Property$isProperty(value)) {
				options.property = value as IProperty;
				return true;
			}
		} else if (key === 'calculate' || key === 'fn') {
			if (value instanceof Function) {
				options.calculate = value as (this: IEntity) => any;
				return true;
			} else if (typeof value === "string") {
				options.calculate = value as string;
				return true;
			}
		} else if (key === 'defaultIfError') {
			options.defaultIfError = value;
			return true;
		} else {
			// TODO: Warn about unsupported rule options?
			return;
		}

		// TODO: Warn about invalid rule option value?
		return;
	}).forEach(key => {
		delete obj[key];
	});

	return options;

}
