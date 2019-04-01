import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Entity } from "../lib/model.js/src/entity";
import { Property } from "../lib/model.js/src/property";
import { Format } from "../lib/model.js/src/format";
import { SourceAdapter, SourcePropertyAdapter, isSourceAdapter } from "./source-adapter";
import { SourceOptionAdapter } from "./source-option-adapter";
import { AllowedValuesRule } from "../lib/model.js/src/allowed-values-rule";
import { observeEntity, observeArray, getObjectMetaObserver } from "./vue-model-observability";
import { PropertyChain } from "../lib/model.js/src/property-chain";
import { ObservableArray, updateArray } from "../lib/model.js/src/observable-array";
import { PropertyPath } from "../lib/model.js/src/property-path";
import { SourceItemAdapter } from "./source-item-adapter";
import { isEntityType, isValueType } from "../lib/model.js/src/type";
import { Condition } from "../lib/model.js/src/condition";
import { ConditionTarget } from "../lib/model.js/src/condition-target";
import { FormatError } from "../lib/model.js/src/format-error";

export type SourcePathOverrides = {
	label?: string,
	helptext?: string,
	readonly?: boolean
};

@Component
export class SourcePathAdapter<TEntity extends Entity, TValue> extends Vue implements SourcePropertyAdapter<TValue>, SourceAdapter<TValue> {
	@Prop(String)
	source!: string;

	@Prop(Object)
	overrides!: SourcePathOverrides;

	viewState: { formatError: ConditionTarget } = { formatError: null };

	get parent(): SourceAdapter<TEntity> {
		for (let parentVm: Vue = this.$parent.$parent, parentLevel = 1; parentVm != null; parentVm = parentVm.$parent, parentLevel += 1) {
			if (isSourceAdapter((parentVm as any).$source)) {
				return (parentVm as any).$source as SourceAdapter<TEntity>;
			}
		}

		throw new Error("Parent source not found!");
	}

	get property(): PropertyPath {
		let property = this.parent.value.meta.type.getPath(this.source);

		// Make sure Property and PropertyChain aren't made observable by Vue
		const Observer = Object.getPrototypeOf((this as any)._data.__ob__).constructor;
		(property as any).__ob__ = new Observer({});

		return property;
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
			if (Format.hasTokens(this.property.label)) {
				label = this.parent.value.toString(this.property.label);
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
			if (Format.hasTokens(this.property.helptext)) {
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
	 *  Gets the value of the source property on the entity.
	 *
	 *  @returns The observable raw value of the property
	 */
	get value(): TValue {
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

	get conditions(): ConditionTarget[] {
		let vs = this.viewState;
		if (!vs) {
			this.viewState = Vue.observable({ formatError: null });
		}

		let meta = this.parent.value.meta;
		let metaOb = getObjectMetaObserver(meta);
		let conditionsList = meta.conditions;
		metaOb.onPropertyAccess("conditions", conditionsList);

		let formatError: ConditionTarget = vs.formatError;

		let thisPathConditions: ConditionTarget[] = null;

		var property = this.property instanceof Property ? this.property : this.property instanceof PropertyChain ? this.property.lastProperty : null;
		if (property) {
			thisPathConditions = conditionsList.filter(c => c.properties.indexOf(property) >= 0);
		}

		return (formatError ? [formatError] : []).concat(thisPathConditions || []);
	}

	get formatError(): FormatError {
		let vs = this.viewState;
		if (!vs) {
			this.viewState = Vue.observable({ formatError: null });
		}

		var formatErrorConditionTarget = vs.formatError;
		if (formatErrorConditionTarget) {
			var formatErrorCondition = formatErrorConditionTarget.condition;
			if (formatErrorCondition) {
				return (formatErrorCondition as any)["formatError"] as FormatError;
			}
		}
	}

	set formatError(err: FormatError) {
		let vs = this.viewState;
		if (!vs) {
			this.viewState = Vue.observable({ formatError: null });
		}

		if (err) {
			var formatErrorCondition = err.createCondition(this.property.getLastTarget(this.parent.value), this.property.lastProperty);

			(formatErrorCondition as any)["formatError"] = err;

			formatErrorCondition.targets.forEach(formatErrorConditionTarget => {
				(formatErrorConditionTarget as any)["formatError"] = err;
				vs.formatError = formatErrorConditionTarget;
				(err as any)["conditionTarget"] = formatErrorConditionTarget;
			});
		}
		else {
			vs.formatError = null;
		}
	}

	get invalidValue(): string {
		if (this.formatError) {
			return this.formatError.invalidValue;
		}
	}

	get firstError(): Condition {
		if (this.formatError) {
			let formatErrorConditionTarget = (this.formatError as any)["conditionTarget"] as ConditionTarget;
			if (formatErrorConditionTarget) {
				return formatErrorConditionTarget.condition;
			}
		}

		var property = this.property instanceof Property ? this.property : this.property instanceof PropertyChain ? this.property.lastProperty : null;
		if (property) {
			var conditions = this.conditions.filter(c => c.condition.type.category === "Error");
			var thisPathConditions = conditions.filter(c => c.properties.indexOf(property) >= 0);
			if (thisPathConditions.length) {
				return thisPathConditions[0].condition;
			}
		}
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
		return property.rules.filter(r => r instanceof AllowedValuesRule)[0] as AllowedValuesRule;
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

		return allowedValuesFromRule;
	}

	get options(): SourceOptionAdapter<TValue>[] {
		// Destroy existing option components
		let optionsToDestroy = this.$children.filter(function(c) { return c instanceof SourceOptionAdapter; });
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
		let existingItemsToDestroy = this.$children.filter(function(c) { return c instanceof SourceItemAdapter; }) as SourceItemAdapter<TEntity, any>[];

		let value = this.value;

		if (Array.isArray(value)) {
			if (isEntityType(this.property.propertyType)) {
				let existingItemsMap: { [key: string]: SourceItemAdapter<TEntity, Entity> } = {};
				existingItemsToDestroy.forEach(function(c) {
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

	ensureObservable(value: TValue) {
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
	let displayValue: string | Array<string>;

	let property = adapter.property;

	if (value === null || value === undefined) {
		displayValue = "";
	}
	else if (property.format != null) {
		// Use a markup or property format if available
		if (Array.isArray(value)) {
			let array = value as Array<any>;
			displayValue = array.map((item: TValue) => property.format.convert(item));
		}
		else {
			displayValue = property.format.convert(value);
		}
	}
	else if (Array.isArray(value)) {
		// If no format exists, then fall back to toString
		let array = value as Array<any>;
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
