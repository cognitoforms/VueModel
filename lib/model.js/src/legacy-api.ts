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
});
