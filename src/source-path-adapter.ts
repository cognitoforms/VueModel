import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator'
import { Entity } from "../lib/model.js/src/entity";
import { Property } from "../lib/model.js/src/property";
import { Format } from "../lib/model.js/src/format";
import { SourceAdapter, SourcePropertyAdapter, isSourceAdapter } from "./source-adapter";
import { SourceOptionAdapter } from "./source-option-adapter";
import { AllowedValuesRule } from "../lib/model.js/src/allowed-values-rule";
import { observeEntity, observeArray } from "./vue-model-observability";
import { PropertyChain } from "../lib/model.js/src/property-chain";
import { ObservableArray, updateArray } from "../lib/model.js/src/observable-array";
import { getPropertyOrPropertyChain } from '../lib/model.js/src/model';
import { Condition } from '../lib/model.js/src/condition';
import { ConditionType } from '../lib/model.js/src/condition-type';
import { SourceItemAdapter } from './source-item-adapter';
import { isEntityType } from '../lib/model.js/src';

export type SourcePathOverrides = {
	label?: string,
	helptext?: string,
	readonly?: boolean
};

@Component
export class SourcePathAdapter<TEntity extends Entity, TValue> extends Vue implements SourcePropertyAdapter<TValue>, SourceAdapter<TValue> {

	@Prop(String)
	source: string;

	@Prop(Object)
	overrides: SourcePathOverrides;

	get parent(): SourceAdapter<TEntity> {
		for (let parentVm: Vue = this.$parent.$parent, parentLevel = 1; parentVm != null; parentVm = parentVm.$parent, parentLevel += 1) {
			if (isSourceAdapter((parentVm as any).$source)) {
				return (parentVm as any).$source as SourceAdapter<TEntity>;
			}
		}

		throw new Error("Parent source not found!");
	}

	get property(): Property | PropertyChain {
		let property = getPropertyOrPropertyChain(this.source, this.parent.value.meta.type);

		// Make sure Property and PropertyChain aren't made observable by Vue
		const Observer = Object.getPrototypeOf((this as any)._data.__ob__).constructor;
		(property as any).__ob__ = new Observer({});

		return property;
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
		return helptext === undefined || helptext === null ? this.property.helptext : helptext;
	}

	/**
	 *  Indicants whether the source property is readonly.
	 *
	 *  @returns True if either the parent source or the source override is read only, otherwise false
	 */
	get readonly(): boolean {
		return this.parent.readonly || (this.overrides ? this.overrides.readonly : false);
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
		} else {
			this.property.value(this.parent.value, this.ensureObservable(value));
		}
	}

	get displayValue(): string {
		let value = this.ensureObservable(this.property.value(this.parent.value));
		return formatDisplayValue(this, value);
	}

	set displayValue(text: string) {
		this.value = this.property.format != null ? this.property.format.convertBack(text) : text;
	}

	get allowedValuesRule(): AllowedValuesRule {
		let property: Property;
		if (this.property instanceof PropertyChain) {
			property = this.property.lastProperty;
		} else {
			property = this.property;
		}
		return property._rules.filter(r => r instanceof AllowedValuesRule)[0] as AllowedValuesRule;
	}

	get allowedValuesSource(): Property | PropertyChain {
		let allowedValuesRule = this.allowedValuesRule;
		if (allowedValuesRule) {
			return (allowedValuesRule as any)._source as Property | PropertyChain;
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
		} else {
			targetObj = this.parent.value;
		}

		// Retrieve the value of allowed values property
		let allowedValuesFromRule = allowedValuesRule.values(targetObj);
		if (allowedValuesFromRule) {
			// Clear our values that are no longer valid
			if (!allowedValuesRule.ignoreValidation) {
				this.clearInvalidOptions(allowedValuesFromRule);
			}
		} else if (!allowedValuesRule.ignoreValidation) {
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
					} else {
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
			} else if (value !== null && allowedValues.indexOf(value) < 0) {
				property.value(this.parent.value, null);
			}
		} else if (value instanceof Array) {
			value.splice(0, value.length);
		} else if (value !== null) {
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
		} else if (value instanceof Entity) {
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
	} else if (property.format != null) {
		// Use a markup or property format if available
		if (Array.isArray(value)) {
			let array = value as Array<any>;
			displayValue = array.map((item: TValue) => property.format.convert(item));
		} else {
			displayValue = property.format.convert(value);
		}
	} else if (Array.isArray(value)) {
		// If no format exists, then fall back to toString
		let array = value as Array<any>;
		displayValue = array.map((item: TValue) => {
			if (value === null || value === undefined) {
				return "";
			} else {
				return item.toString();
			}
		});
	} else {
		displayValue = value.toString();
	}

	displayValue = Array.isArray(displayValue) ? displayValue.join(", ") : displayValue;

	return displayValue;

}
