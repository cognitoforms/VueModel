import { ValidatedPropertyRule, ValidatedPropertyRuleOptions } from "./validated-property-rule";
import { Property } from "./property";
import { PropertyChain } from "./property-chain";
import { Entity } from "./entity";
import { Type } from "./type";
import { ConditionType } from "./condition-type";
import { ConditionRuleOptions } from "./condition-rule";
import { RuleOptions } from "./rule";
import { Model$getPropertyOrPropertyChain } from "./model";
import { Resource } from "./resource";

export class AllowedValuesRule extends ValidatedPropertyRule {

	private _source: Property | PropertyChain;
	private _sourcePath: string;
	private _sourceFn: string | ((entity: Entity) => any[]);

	ignoreValidation: boolean;

	/**
	 * Creates a rule that validates whether a selected value or values is in a list of allowed values.
	 * @param rootType The root type to bind the rule to
	 * @param options The rule configuration options
	 */
	constructor(rootType: Type, options: AllowedValuesRuleOptions & ValidatedPropertyRuleOptions & ConditionRuleOptions & RuleOptions, skipRegistration: boolean = false) {

		// ensure the rule name is specified
		options.name = options.name || "AllowedValues";

		// ensure the error message is specified
		// options.message = options.message || Resource.get("allowed-values");
		options.message = options.message || Resource.get("allowed-values");

		let source: Property | PropertyChain;
		let sourcePath: string;
		let sourceFn: string | ((entity: Entity) => any[]);
	
		// subscribe to changes to the source property
		if (options.source) {
			// define properties for the rule
			if (options.source instanceof Property || options.source instanceof PropertyChain) {
				sourcePath = options.source.getPath();
				source = options.source;
				options.onChangeOf = [options.source];
			}
			else if (options.source instanceof Function) {
				sourceFn = options.source;
			}
			else {
				sourcePath = options.source as string;
				options.onChangeOf = [options.source];
			}
		}

		// Default condition category to Error if a condition category was not specified
		if (!options.conditionType) {
			options.category = "Error";
		}

		// never run allowed values rules during initialization of existing instances
		if (!options.hasOwnProperty("onInitExisting") && options.conditionType instanceof ConditionType && (options.conditionType as ConditionType).origin === "server") {
			options.onInitExisting = false;
		}

		// call the base type constructor
		super(rootType, options, true);

		if (source) {
			Object.defineProperty(this, "_source", { enumerable: false, value: source });
		}

		if (sourcePath) {
			Object.defineProperty(this, "_sourcePath", { enumerable: false, value: sourcePath });
		}

		if (sourceFn) {
			Object.defineProperty(this, "_sourceFn", { enumerable: false, value: sourceFn });
		}
		
		if (options.ignoreValidation) {
			Object.defineProperty(this, "ignoreValidation", { value: options.ignoreValidation });
		}

		if (!skipRegistration) {
			// Register the rule after loading has completed
			rootType.model.registerRule(this);
		}

	}

	onRegister() {

		// get the allowed values source, if only the path was specified
		if (!this._source && !this._sourceFn) {
			this._source = Model$getPropertyOrPropertyChain(this._sourcePath, this.rootType, this.rootType.model._allTypesRoot) as Property | PropertyChain;
		}

		super.onRegister();

	}

	isValid(obj: Entity, prop: Property, value: any): boolean {

		//gives the ability to create a drop down of available options
		//but does not need validatin (combo box)
		if (this.ignoreValidation) {
			return true;
		}

		// return true if no value is currently selected
		if (!value) {
			return true;
		}

		// get the list of allowed values of the property for the given object
		var allowed = this.values(obj);

		// TODO: Lazy loading?
		// return undefined if the set of allowed values cannot be determined
		// if (!LazyLoader.isLoaded(allowed)) {
		// 	return;
		// }

		// ensure that the value or list of values is in the allowed values list (single and multi-select)				
		if (value instanceof Array) {
			return value.every(function (item) { return allowed.indexOf(item) >= 0; });
		} else {
			return allowed.indexOf(value) >= 0;
		}
	}

	// // Subscribes to changes to the allow value predicates, indicating that the allowed values have changed
	// addChanged(handler, obj, once) {
	// 	for (var p = 0; p < this.predicates.length; p++) {
	// 		var predicate = this.predicates[p];
	// 		if (predicate !== this.property)
	// 			predicate.addChanged(handler, obj, once);
	// 	}
	// }

	// // Unsubscribes from changes to the allow value predicates
	// removeChanged(handler, obj, once) {
	// 	for (var p = 0; p < this.predicates.length; p++) {
	// 		var predicate = this.predicates[p];
	// 		if (predicate !== this.property)
	// 			predicate.removeChanged(handler, obj, once);
	// 	}
	// }

	values(obj: Entity, exitEarly: boolean = false) {
		if (!this._source && !this._sourceFn) {
			// TODO: Log warning?
			// logWarning("AllowedValues rule on type \"" + this.prop.get_containingType().get_fullName() + "\" has not been initialized.");
			return;
		}

		// Function-based allowed values
		if (this._sourceFn) {

			// convert string functions into compiled functions on first execution
			if (typeof this._sourceFn === "string") {
				this._sourceFn = (new Function("obj", this._sourceFn)) as (entity: Entity) => any[];
			}

			return this._sourceFn.call(obj, obj);
		}

		// Property path-based allowed values
		else {
			// For non-static properties, verify that a final target exists and
			// if not return an appropriate null or undefined value instead.
			if (!(this._source instanceof Property) || !this._source.isStatic) {
				// Get the value of the last target for the source property (chain).
				var target = obj;
				if (this._source instanceof PropertyChain) {
					this._source.getLastTarget(obj, exitEarly);
				}

				// Use the last target to distinguish between the absence of data and
				// data that has not been loaded, if a final value cannot be obtained.
				if (target === undefined) {
					// Undefined signifies unloaded data
					return undefined;
				} else if (target === null) {
					// Null signifies the absensce of a value
					return null;
				}
			}

			// Return the value of the source for the given object
			return this._source.value(obj);
		}
	}

	toString() {
		return `${this.property.containingType.fullName}.${this.property.name} allowed values = ${this._sourcePath}`;
	}

}

export interface AllowedValuesRuleOptions {

	/** The property being validated (either a Property instance or string property name). */
	property?: string | Property;

	/** The source property for the allowed values (either a Property or PropertyChain instance or a string property path). */
	source?: string | Property | PropertyChain | ((entity: Entity) => any[]);

	ignoreValidation?: boolean;

}
