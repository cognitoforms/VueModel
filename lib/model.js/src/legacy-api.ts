import { Type } from "./type";
import { Property } from "./property";
import { mixin } from "./helpers";
import { ConditionType } from "./condition-type";
import { CalculatedPropertyRule, CalculatedPropertyRuleOptions } from "./calculated-property-rule";
import { ValidatedPropertyRule, ValidatedPropertyRuleOptions } from "./validated-property-rule";
import { RuleOptions, RuleTypeOptions } from "./rule";
import { ConditionRuleOptions } from "./condition-rule";
import { RequiredRule } from "./required-rule";
import { RequiredIfRule } from "./required-if-rule";
import { AllowedValuesRule } from "./allowed-values-rule";
import { RangeRule } from "./range-rule";
import { StringLengthRule } from "./string-length-rule";
import { StringFormatRule } from "./string-format-rule";
import { ListLengthRule } from "./list-length-rule";

function preparePropertyRuleOptions(property: Property, options: any, error: string | ConditionType) {
	options.property = property;
	if (error && error.constructor === String) {
		options.message = error;
	}
	else if (error instanceof ConditionType) {
		options.conditionType = error;
	}
	return options;
}

declare module "./property" {
	interface Property {
		calculated: (options: RuleOptions & RuleTypeOptions & CalculatedPropertyRuleOptions) => Property;
		conditionIf: (options: RuleOptions & ConditionRuleOptions & RuleTypeOptions & ValidatedPropertyRuleOptions, error: string | ConditionType) => Property;
	}
}

mixin(Property, {
    calculated: function Property$calculated(this: Property, options: RuleOptions & RuleTypeOptions & CalculatedPropertyRuleOptions): Property {
        options.property = this;
		var definedType = options.rootType ? options.rootType.meta : this.containingType;
		delete options.rootType;

		new CalculatedPropertyRule(definedType as Type, options.name, options);
		return this; 
    },
    conditionIf: function Property$conditionIf(this: Property, options: RuleOptions & ConditionRuleOptions & RuleTypeOptions & ValidatedPropertyRuleOptions, error: string | ConditionType) {
        var definedType = options.rootType ? options.rootType.meta : this.containingType;
        delete options.rootType;

        options = preparePropertyRuleOptions(this, options, error);
        new ValidatedPropertyRule(definedType as Type, options);
        return this;
	},
	required: function Property$required(this: Property, error: string | ConditionType) {
		var options = preparePropertyRuleOptions(this, {}, error);
		new RequiredRule(this.containingType, options);
		return this;
	},
	requiredIf: function Property$requiredIf(this: Property, options: any, error: string | ConditionType) {
		var definedType = options.rootType ? options.rootType.meta : this.containingType;
		delete options.rootType;
		var options = preparePropertyRuleOptions(this, options, error);

		new RequiredIfRule(definedType, options);
		return this;
	},
	allowedValues: function (this: Property, source: string, error: string | ConditionType) {
		var options = preparePropertyRuleOptions(this, { source: source }, error);
		new AllowedValuesRule(this.containingType, options);
		return this;
	},
	optionValues: function (this: Property, source: string, error: string | ConditionType) {
	    var options = preparePropertyRuleOptions(this, { source: source, onInit: false, onInitNew: false, onInitExisting: false }, error);
	    options.ignoreValidation = true;
	    new AllowedValuesRule(this.containingType, options);
	    return this;
	},
	range: function (this: Property, min: number | Function, max: number | Function, error: string | ConditionType) {
		var options = preparePropertyRuleOptions(this, { min: min, max: max }, error);
		new RangeRule(this.containingType, options);
		return this;
	},
	stringLength: function (this: Property, min: number | Function, max: number | Function, error: string | ConditionType) {
		var options = preparePropertyRuleOptions(this, { min: min, max: max }, error);
		new StringLengthRule(this.containingType, options);
		return this;
	},
	stringFormat: function (this: Property, description: string, expression: string | RegExp, reformat: string | Function, error: string | ConditionType) {
		var options = preparePropertyRuleOptions(this, { description: description, expression: expression, reformat: reformat }, error);
		new StringFormatRule(this.containingType, options);
		return this;
	},
	listLength: function (this: Property, min: number | Function, max: number | Function, error: string | ConditionType) {
		var options = preparePropertyRuleOptions(this, { min: min, max: max }, error);
		new ListLengthRule(this.containingType, options);
		return this;
	}
});
