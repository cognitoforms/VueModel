import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Entity, EntityConstructor, RequiredRule } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { Property, evaluateLabel, isPropertyBooleanFunction, isPropertyBooleanFunctionAndOptions } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { SourceAdapter, SourcePropertyAdapter, isSourceAdapter, SourceType } from "./source-adapter";
import { SourceOptionAdapter } from "./source-option-adapter";
import { AllowedValuesRule } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { observeEntity, observeArray, getObjectMetaObserver, preventVueObservability } from "./vue-model-observability";
import { PropertyChain } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { ObservableArray, updateArray } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { PropertyPath } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { SourceItemAdapter } from "./source-item-adapter";
import { isEntityType, isValueType } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { Condition } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { FormatError } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { isEntity } from "./helpers";

export type SourcePathOverrides = {
	label?: string;
	helptext?: string;
	readonly?: boolean;
	required?: boolean;
};

let _id = 0;

@Component
export class SourcePathAdapter<TEntity extends Entity, TValue> extends Vue implements SourcePropertyAdapter<TValue>, SourceAdapter<TValue> {
	@Prop(String)
	source: string;

	@Prop(Object)
	overrides: SourcePathOverrides;

	// viewState: { formatError: ConditionTarget } = { formatError: null };
	// formatError: FormatError = null;
	formatErrorCondition: Condition = null;

	id = `${_id++}`;

	get parent(): SourceAdapter<TEntity> {
		for (let parentVm: Vue = this.$parent.$parent, parentLevel = 1; parentVm != null; parentVm = parentVm.$parent, parentLevel += 1) {
			if (isSourceAdapter((parentVm as any).$source)) {
				return (parentVm as any).$source as SourceAdapter<TEntity>;
			}
		}

		throw new Error("Parent source not found!");
	}

	get property(): PropertyPath {
		let property = (this.parent.type as EntityConstructor).meta.getPath(this.source);
		preventVueObservability(property);
		return property;
	}

	get type(): SourceType {
		// If possible, determine the type based on the actual entity instance
		if (this.value && isEntity(this.value))
			return this.value.meta.type.jstype;

		return this.property.propertyType;
	}

	get isList(): boolean {
		return this.property.isList;
	}

	get lastTarget(): Entity {
		let property = this.property;
		return property.getLastTarget(this.parent.value);
	}

	/**
	 *  Gets the label for the source property.
	 *
	 *  @returns The source override label if specified, or the model property label if not
	 */
	get label(): string {
		let label = this.overrides ? this.overrides.label : null;
		if (label === undefined || label === null) {
			if (this.property.labelIsFormat) {
				label = evaluateLabel(this.property, this.parent.value);
			}
			else {
				label = this.property.label;
			}
		}
		return label;
	}

	/**
	 *  Gets the helptext for the source property.
	 *
	 *  @returns The source override helptext if specified, or the model property helptext if not
	 */
	get helptext(): string {
		let helptext = this.overrides ? this.overrides.helptext : null;
		if (helptext === undefined || helptext === null) {
			if (this.property.helptextIsFormat) {
				helptext = this.parent.value.toString(this.property.helptext);
			}
			else {
				helptext = this.property.helptext;
			}
		}
		return helptext;
	}

	/**
	 *  Indicants whether the source property is readonly.
	 *
	 *  @returns True if either the parent source or the source override is read only, otherwise false
	 */
	get readonly(): boolean {
		return this.parent.readonly || (this.overrides ? !!this.overrides.readonly : false);
	}

	/**
	*  Indicants whether the source property is required.
	*
	*  @returns True if the property is required, otherwise false
	*/
	get required(): boolean {
		if (this.overrides && this.overrides.required != null)
			return this.overrides.required;
		if (isPropertyBooleanFunctionAndOptions(this.property.required)) {
			if (isPropertyBooleanFunction(this.property.required.function)) {
				return this.property.required.function.call(this.parent.value);
			}
			else {
				return true;
			}
		}
		if (isPropertyBooleanFunction(this.property.required))
			return this.property.required.call(this.parent.value);
		return this.property.required === true;
	}

	/**
	 *  Gets the value of the source property on the entity.
	 *
	 *  @returns The observable raw value of the property
	 */
	get value(): TValue {
		// This adapter has no value if its parent has no value
		if (!this.parent.value)
			return;

		return this.ensureObservable(this.property.value(this.parent.value));
	}

	/**
	 *  Sets the value of the source property on the entity.
	 *
	 *  @param value - The new value to assign to the property
	 */
	set value(value: TValue) {
		if (this.property.isList) {
			let valueArray = (value as any) as any[];
			let observableArray = this.property.value(this.parent.value) as ObservableArray<any>;
			observableArray.batchUpdate(() => updateArray(observableArray, valueArray));
		}
		else {
			this.property.value(this.parent.value, this.ensureObservable(value));
		}
	}

	get conditions(): Condition[] {
		let meta = this.parent.value.meta;

		let metaOb = getObjectMetaObserver(meta);

		// Make sure that the meta object is observable, ex: subscribes to conditions array changed
		metaOb.ensureObservable();

		let conditionTargets = meta.conditions;

		conditionTargets.forEach(condition => { preventVueObservability(condition); });

		// Raise property access to let Vue know that array was accessed
		// Changes to conditions will result in a Vue change notification for the 'conditions' property
		metaOb.onPropertyAccess("conditions", conditionTargets);
		const formatErrorConditions = this.formatErrorCondition? [this.formatErrorCondition] : [];

		var property = this.property instanceof Property ? this.property : this.property instanceof PropertyChain ? this.property.lastProperty : null;
		if (!property)
			return formatErrorConditions;

		let conditions = conditionTargets.filter(c => c.properties.indexOf(property) >= 0).map((conditionTarget) => {
			return conditionTarget.condition;
		});

		conditions = conditions.concat(formatErrorConditions);

		conditions = conditions.sort((conditionA, conditionB) => {
			return this.compare(conditionA, conditionB);
		});

		return conditions;
	}

	get formatError(): FormatError {
		return this.formatErrorCondition ? (this.formatErrorCondition as any)["formatError"] as FormatError : null;
	}

	set formatError(err: FormatError) {
		if (err) {
			preventVueObservability(err);

			var formatErrorCondition = err.createCondition(this.property.getLastTarget(this.parent.value), this.property.lastProperty);

			preventVueObservability(formatErrorCondition);

			(formatErrorCondition as any)["formatError"] = err;
			this.formatErrorCondition = formatErrorCondition;
		}
		else {
			this.formatErrorCondition = null;
		}
	}

	get invalidValue(): string {
		if (this.formatError) {
			return this.formatError.invalidValue;
		}
	}

	get firstError(): Condition {
		return this.conditions.length ? this.conditions[0] : null;
	}

	get displayValue(): string {
		if (this.formatError) {
			return this.formatError.invalidValue;
		}
		let value = this.ensureObservable(this.property.value(this.parent.value));
		return formatDisplayValue(this, value);
	}

	set displayValue(text: string) {
		if (isEntityType(this.property.propertyType)) {
			throw new Error("Cannot set displayValue property of Adapters for entity types.");
		}

		/// / TODO: Implement auto-reformat?
		// var initialValue = text;

		var newValue;

		var formatter;
		if (this.property.format != null) {
			formatter = this.property.format;
		}
		else if (isValueType(this.property.propertyType) && this.property.propertyType !== String) {
			// Try to use the general format by default
			formatter = this.property.containingType.model.getFormat(this.property.propertyType, "G");
		}

		if (this.formatError) {
			this.parent.value.meta.clearCondition(FormatError.ConditionType); // TODO: This shouldn't do anything...
			this.formatError = null;
		}

		if (formatter) {
			newValue = formatter.convertBack(text);

			if (newValue instanceof FormatError) {
				preventVueObservability(newValue);
				this.formatError = newValue;
				return;
			}
		}
		else if (this.property.propertyType === String && typeof text === "string" && text.length === 0) {
			// Convert blank string to null
			newValue = null;
		}
		else {
			newValue = text;
		}

		this.value = newValue;
	}

	get allowedValuesRule(): AllowedValuesRule {
		let property: Property;
		if (this.property instanceof PropertyChain) {
			property = this.property.lastProperty;
		}
		else if (this.property instanceof Property) {
			property = this.property;
		}
		let allowedValuesRules = property.rules.filter(r => r instanceof AllowedValuesRule);
		if (allowedValuesRules.length) {
			let allowedValuesRule = allowedValuesRules[0] as AllowedValuesRule;
			preventVueObservability(allowedValuesRule);
			return allowedValuesRule;
		}
	}

	get allowedValues(): TValue[] {
		var allowedValuesRule = this.allowedValuesRule;

		if (!allowedValuesRule) {
			// If there is no rule, return an empty list
			return;
		}

		let targetObj: Entity;
		if (this.property instanceof PropertyChain) {
			targetObj = this.property.getLastTarget(this.parent.value);
		}
		else {
			targetObj = this.parent.value;
		}

		// Retrieve the value of allowed values property
		let allowedValuesFromRule = allowedValuesRule.values(targetObj);
		if (allowedValuesFromRule) {
			// Clear our values that are no longer valid
			if (!allowedValuesRule.ignoreValidation) {
				this.clearInvalidOptions(allowedValuesFromRule);
			}
		}
		else if (!allowedValuesRule.ignoreValidation) {
			// Clear out values since the property doesn't currently have any allowed values
			this.clearInvalidOptions(null);
		}

		allowedValuesFromRule.forEach(value => {
			if (value instanceof Entity) {
				observeEntity(value).ensureObservable();
			}
			else if (typeof value === "object") {
				preventVueObservability(value);
			}
		});

		return allowedValuesFromRule;
	}

	get options(): SourceOptionAdapter<TValue>[] {
		// Destroy existing option components
		let optionsToDestroy = this.$children.filter(function (c) { return c instanceof SourceOptionAdapter; });
		optionsToDestroy.forEach(c => c.$destroy());

		// TODO: preserve option adapters if possible?

		let allowedValues = this.allowedValues;

		if (!allowedValues && this.property.propertyType === Boolean) {
			// Provide true and false as special allowed values for booleans
			allowedValues = ([true, false] as any) as TValue[];
		}

		if (!allowedValues) {
			return [];
		}

		// Map the allowed values to option adapters
		return allowedValues.map(v => new SourceOptionAdapter<any>({ parent: this, propsData: { value: v } }));
	}

	get items(): SourceItemAdapter<TEntity, any>[] {
		let items: SourceItemAdapter<TEntity, any>[] = [];

		// Collect existing option components to potentially be destroyed
		let existingItemsToDestroy = this.$children.filter(function (c) { return c instanceof SourceItemAdapter; }) as SourceItemAdapter<TEntity, any>[];

		let value = this.value;

		if (Array.isArray(value)) {
			if (isEntityType(this.property.propertyType)) {
				let existingItemsMap: { [key: string]: SourceItemAdapter<TEntity, Entity> } = {};
				existingItemsToDestroy.forEach(function (c) {
					let adapter = c as SourceItemAdapter<TEntity, Entity>;
					if (!adapter.isOrphaned) {
						let key = adapter.value ? adapter.value.meta.id : null;
						if (key) {
							existingItemsMap[key] = adapter;
						}
					}
				});

				for (var i = 0; i < value.length; i++) {
					let key = value[i].meta.id;
					let existingItem = existingItemsMap[key];
					if (existingItem) {
						// Delete the existing item from the map so that it can't be fetched more than once
						delete existingItemsMap[key];

						// Remove the component from the list of items to destroy since we're going to reuse it
						let existingItemIndex = existingItemsToDestroy.indexOf(existingItem);
						if (existingItemIndex >= 0) {
							existingItemsToDestroy.splice(existingItemIndex, 1);
						}

						// Set the backing storage for the 'index' prop, the internal data should
						// already have this value, this just makes the component's state consistent,
						// since the inconsistency is just a side-effect of reusing item adapters
						let propsData: any = existingItem.$options.propsData;
						propsData.index = i;

						// Include the existing item in the return value
						items.push(existingItem);
					}
					else {
						// Create a new item adapter
						let newItem = new SourceItemAdapter<TEntity, any>({ parent: this, propsData: { index: i, parentSource: this } });

						// Subscribes to changes to its underlying list source in order to update its index and detect when it becomes orphaned
						newItem.subscribeToSourceChanges();

						// Include the new item in the return value
						items.push(newItem);
					}
				}
			}
		}

		existingItemsToDestroy.forEach(c => c.$destroy());

		return items;
	}

	compare(conditionTargetA: Condition, conditionTargetB: Condition): number {
		if (conditionTargetA["formatError"] instanceof FormatError || conditionTargetB["formatError"] instanceof FormatError) {
			return conditionTargetA["formatError"] instanceof FormatError && conditionTargetB["formatError"] instanceof FormatError ? 0 :
				conditionTargetA["formatError"] instanceof FormatError ? -1 : 1;
		}
		else if (conditionTargetA["source"] instanceof RequiredRule || conditionTargetB["source"] instanceof RequiredRule)
			return conditionTargetA["source"] instanceof RequiredRule && conditionTargetB["source"] instanceof RequiredRule ? 0 :
				conditionTargetA["source"] instanceof RequiredRule ? -1 : 1;
		else if (conditionTargetA.type.category === "Error" || conditionTargetB.type.category === "Error")
			return conditionTargetA.type.category === "Error" && conditionTargetB.type.category === "Error" ? 0 :
				conditionTargetA.type.category === "Error" ? -1 : 1;
		else
			return 0;
	}

	clearInvalidOptions(allowedValues: any[]): void {
		let property = this.property;
		let value = this.value;
		if (allowedValues) {
			// Remove option values that are no longer valid
			if (value instanceof Array) {
				let array = (value as any) as ObservableArray<any>;
				array.batchUpdate(function (array) {
					// From the `purge()` function in ExoWeb...
					for (var i = 0; i < array.length; i++) {
						let item = array[i];
						if (allowedValues.indexOf(item) < 0) {
							array.splice(i--, 1);
						}
					}
				});
			}
			else if (value !== null && allowedValues.indexOf(value) < 0) {
				property.value(this.parent.value, null);
			}
		}
		else if (value instanceof Array) {
			value.splice(0, value.length);
		}
		else if (value !== null) {
			property.value(this.parent.value, null);
		}
	}

	ensureObservable(value: TValue): TValue {
		if (Array.isArray(value)) {
			if (ObservableArray.isObservableArray(value)) {
				observeArray(value).ensureObservable();
			}
			for (let i = 0; i < value.length; i++) {
				let item = value[i];
				if (item instanceof Entity) {
					observeEntity(item).ensureObservable();
				}
			}
		}
		else if (value instanceof Entity) {
			observeEntity(value).ensureObservable();
		}

		return value;
	}

	toString(): string {
		return "Source['" + this.source + "']";
	}
}

export function formatDisplayValue<TValue>(adapter: SourcePropertyAdapter<TValue>, value: any): string {
	let displayValue: string | string[];

	let property = adapter.property;

	if (value === null || value === undefined) {
		displayValue = "";
	}
	else if (property.format != null) {
		// Use a markup or property format if available
		if (Array.isArray(value)) {
			let array = value as any[];
			displayValue = array.map((item: TValue) => property.format.convert(item));
		}
		else {
			displayValue = property.format.convert(value);
		}
	}
	else if (Array.isArray(value)) {
		// If no format exists, then fall back to toString
		let array = value as any[];
		displayValue = array.map((item: TValue) => {
			if (value === null || value === undefined) {
				return "";
			}
			else {
				return item.toString();
			}
		});
	}
	else {
		displayValue = value.toString();
	}

	displayValue = Array.isArray(displayValue) ? displayValue.join(", ") : displayValue;

	return displayValue;
}
