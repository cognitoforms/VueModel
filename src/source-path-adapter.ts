import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator'
import { Entity } from "../lib/model.js/src/entity";
import { Property, PropertyChangeEventArgs, PropertyChangeEventHandler, Property$addChanged, Property$removeChanged } from "../lib/model.js/src/property";
import { SourceAdapter, SourcePropertyAdapter, isSourceAdapter } from "./source-adapter";
import { hasOwnProperty } from "../lib/model.js/src/helpers";
import { SourceOptionAdapter } from "./source-option-adapter";
import { AllowedValuesRule } from "../lib/model.js/src/allowed-values-rule";
import { EventHandler } from "../lib/model.js/src/events";
import { observeEntity, getEntityObserver } from "./entity-observer";
import { PropertyChain, PropertyChainChangeEventArgs, PropertyChainChangeEventHandler } from "../lib/model.js/src/property-chain";
import { ObservableArray, updateArray, ArrayChangedEventArgs, ArrayChangeType } from "../lib/model.js/src/observable-array";

export type SourcePathOverrides = {
	label?: string,
	helptext?: string,
	readonly?: boolean
};

@Component
export class SourcePathAdapter<TEntity extends Entity, TValue> extends Vue implements SourcePropertyAdapter<TValue>, SourceAdapter<TValue> {

	private _allowedValuesRule: AllowedValuesRule;
	private _allowedValues: ObservableArray<TValue>;
	private _allowedValuesSource: Property | PropertyChain;
	private _allowedValuesExistHandler: PropertyChangeEventHandler | PropertyChainChangeEventHandler;
	private _allowedValuesChangedHandler: PropertyChangeEventHandler | PropertyChainChangeEventHandler;
	private _allowedValuesCollectionChangedHandler: EventHandler<ObservableArray<TValue>, ArrayChangedEventArgs<TValue>>;
	private _options: SourceOptionAdapter<TValue>[];

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

		throw "Parent source not found!";
	}

	get property(): Property {
		const Observer = Object.getPrototypeOf((this as any)._data.__ob__).constructor;
		let property = this.parent.value.meta.type.getProperty(this.source);
		(property as any).__ob__ = new Observer({});
		return property;
	}

	/**
	 *  Gets the label for the source property.
	 *
	 *  @returns The source override label if specified, or the model property label if not
	 */
	get label(): string {
		let label = this.overrides.label;
		return label === undefined || label === null ? this.property.label : label;
	}

	/**
	 *  Gets the helptext for the source property.
	 *
	 *  @returns The source override helptext if specified, or the model property helptext if not
	 */
	get helptext(): string {
		let helptext = this.overrides.helptext;
		return helptext === undefined || helptext === null ? this.property.helptext : helptext;
	}

	/**
	 *  Indicants whether the source property is readonly.
	 *
	 *  @returns True if either the parent source or the source override is read only, otherwise false
	 */
	get readonly(): boolean {
		return this.parent.readonly || this.overrides.readonly;
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
		this.property.value(this.parent.value, this.ensureObservable(value));
	}

	get displayValue(): string {
		let value = this.ensureObservable(this.property.value(this.parent.value));
		return SourcePathAdapter$_formatDisplayValue.call(this, value);
	}

	set displayValue(text: string) {
		this.value = this.property.format != null ? this.property.format.convertBack(text) : text;
	}

	get allowedValuesRule(): AllowedValuesRule {
		let allowedValuesRule: AllowedValuesRule;
		if (hasOwnProperty(this, "_allowedValuesRule")) {
			allowedValuesRule = this._allowedValuesRule;
		} else {
			let property = this.property;
			allowedValuesRule = property._rules.filter(r => r instanceof AllowedValuesRule)[0] as AllowedValuesRule;
			Object.defineProperty(this, '_allowedValuesRule', { enumerable: false, value: allowedValuesRule, writable: true });
		}
		return allowedValuesRule;
	}

	get allowedValuesSource(): Property | PropertyChain {
		let allowedValuesSource: Property | PropertyChain;
		if (hasOwnProperty(this, "_allowedValuesSource")) {
			allowedValuesSource = this._allowedValuesSource;
		} else {
			let allowedValuesRule = this.allowedValuesRule;
			if (allowedValuesRule) {
				allowedValuesSource = (allowedValuesRule as any)._source as Property | PropertyChain;
				if (allowedValuesSource) {
					Object.defineProperty(this, '_allowedValuesSource', { enumerable: false, value: allowedValuesSource, writable: true });
				}
			}
		}
		return allowedValuesSource;
	}

	get allowedValues(): ObservableArray<TValue> {
		let allowedValues: ObservableArray<TValue>;
		if (hasOwnProperty(this, "_allowedValues")) {
			allowedValues = this._allowedValues;
		} else {

			var allowedValuesRule = this.allowedValuesRule;
			
			if (!allowedValuesRule) {
				this._allowedValues = null;
				return;
			}

			// Cache the last target
			// TODO: Support property chains...
			// var targetObj = property.getLastTarget(this.source.value);
			var targetObj = this.parent.value;

			// Retrieve the value of allowed values property
			let allowedValuesFromRule = allowedValuesRule.values(targetObj);
			/*
			if (allowedValuesFromRule) {
				// Create an observable copy of the allowed values that we can keep up to date in our own time
				allowedValues = ObservableArray.create(allowedValuesFromRule.slice());

				if (!this._allowedValuesChangedHandler && this.allowedValuesSource) {
					// Respond to changes to allowed values
					let allowedValuesSource = this.allowedValuesSource;
					let allowedValuesChangedHandler = SourcePathAdapter$_allowedValuesChanged.bind(this);
					Object.defineProperty(this, '_allowedValuesChangedHandler', { enumerable: false, value: allowedValuesChangedHandler, writable: true });
					Property$addChanged(allowedValuesSource, allowedValuesChangedHandler, targetObj, true);
				}

				// Clear our values that are no longer valid
				if (!allowedValuesRule.ignoreValidation) {
					SourcePathAdapter$_clearInvalidOptions.call(this, allowedValues);
				}

				this._allowedValues = allowedValues;
			} else {
				// Subscribe to property/chain change for the entity in order to populate the options when available
				let allowedValuesSource = this.allowedValuesSource;
				if (allowedValuesSource && !this._allowedValuesExistHandler) {
					let allowedValuesExistHandler = SourcePathAdapter$_checkAllowedValuesExist.bind(this);
					Object.defineProperty(this, '_allowedValuesExistHandler', { enumerable: false, value: allowedValuesExistHandler, writable: true });
					Property$addChanged(allowedValuesSource, allowedValuesExistHandler, targetObj);
				}

				// Clear out values since the property doesn't currently have any allowed values
				if (!allowedValuesRule.ignoreValidation) {
					SourcePathAdapter$_clearInvalidOptions.call(this);
				}

				this._allowedValues = null;
				return;
			}
			*/
		}
		
		return allowedValues;
	}

	get options(): SourceOptionAdapter<TValue>[] {
		let options: SourceOptionAdapter<TValue>[];
		if (hasOwnProperty(this, "_options")) {
			options = this._options;
		} else {
			let allowedValues = this.allowedValues;

			if (this._allowedValuesCollectionChangedHandler) {
				allowedValues.changed.unsubscribe(this._allowedValuesCollectionChangedHandler);
				delete this._allowedValuesCollectionChangedHandler;
			}
			/*
			if (allowedValues) {
				// Respond to changes to allowed values
				let allowedValuesCollectionChangedHandler = SourcePathAdapter$_allowedValuesCollectionChanged.bind(this);
				Object.defineProperty(this, '_allowedValuesCollectionChangedHandler', { enumerable: false, value: allowedValuesCollectionChangedHandler, writable: true });
				allowedValues.changed.subscribe(allowedValuesCollectionChangedHandler);
			} else if (this.property.propertyType === Boolean) {
				// Provide true and false as special allowed values for booleans
				allowedValues = ObservableArray.create(([true, false] as any) as TValue[]);
			}
			*/
			if (allowedValues) {
				// Map the allowed values to option adapters
				options = allowedValues.map(v => new SourceOptionAdapter(this, v));
			} else {
				options = null;
			}

			this._options = options;
		}
		
		return options;
	}

	ensureObservable(value: TValue) {

		if (Array.isArray(value)) {
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

export function SourcePathAdapter$_formatDisplayValue<TEntity extends Entity, TValue>(this: SourcePathAdapter<TEntity, TValue>, value: any): string {

	let displayValue: string | Array<string>;

	let property = this.property;

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

/*
// Notify subscribers that options are available
function SourcePathAdapter$_signalOptionsReady<TEntity extends Entity, TValue>(this: SourcePathAdapter<TEntity, TValue>) {
	// if (this._disposed) {
	// 	return;
	// }

	// Delete backing fields so that options can be recalculated (and loaded)
	delete this._options;

	// Get the `Dep` object for the options property
	var optionsPropertyDep = this.__ob__.getPropertyDep('options');
	if (optionsPropertyDep) {
		// Notify of change in order to cause subscribers to fetch the new value
		optionsPropertyDep.notify();
	}
}

function SourcePathAdapter$_clearInvalidOptions<TEntity extends Entity, TValue>(this: SourcePathAdapter<TEntity, TValue>, allowedValues: any[]): void {
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
		let array = (value as any) as ObservableArray<any>;
		array.splice(0, array.length);
	} else if (value !== null) {
		property.value(this.parent.value, null);
	}
}

function SourcePathAdapter$_checkAllowedValuesExist<TEntity extends Entity, TValue>(this: SourcePathAdapter<TEntity, TValue>, args: PropertyChangeEventArgs | PropertyChainChangeEventArgs): void {
	// TODO: Support property chains
	// var lastProperty = this._propertyChain.lastProperty();
	let property = this.property;

	var allowedValuesRule = this.allowedValuesRule;

	// TODO: Support property chains...
	// var targetObj = property.getLastTarget(this.source.value);
	var targetObj = this.parent.value;

	var allowedValues = allowedValuesRule.values(targetObj);

	if (allowedValues instanceof Array) {
		let allowedValuesSource = this.allowedValuesSource;
		if (allowedValuesSource) {
			Property$removeChanged(allowedValuesSource, this._allowedValuesExistHandler);
			delete this._allowedValuesExistHandler;
		}
		SourcePathAdapter$_signalOptionsReady.call(this);
	}
}

function SourcePathAdapter$_allowedValuesChanged<TEntity extends Entity, TValue>(this: SourcePathAdapter<TEntity, TValue>, args: PropertyChangeEventArgs | PropertyChainChangeEventArgs): void {

	// TODO: Support property chains
	// var lastProperty = this._propertyChain.lastProperty();
	let property = this.property;

	// TODO: Support property chains...
	// var targetObj = property.getLastTarget(this.source.value);
	var targetObj = this.parent.value;

	var allowedValuesRule = this.allowedValuesRule;
	var allowedValuesFromRule = allowedValuesRule.values(targetObj);

	let allowedValues = this._allowedValues;

	allowedValues.batchUpdate(array => {
		updateArray(array, allowedValuesFromRule);
	});

	// Clear out invalid selections
	if (!allowedValuesRule.ignoreValidation) {
		SourcePathAdapter$_clearInvalidOptions.call(this, allowedValues);
	}

	// TODO: Lazy load allowed values?
	// ensureAllowedValuesLoaded(newItems, refreshOptionsFromAllowedValues.prependArguments(optionsSourceArray), this);

	// Get the `Dep` object for the options property
	var allowedValuesPropertyDep = this.__ob__.getPropertyDep('allowedValues');
	if (allowedValuesPropertyDep) {
		// Notify of change in order to cause subscribers to fetch the new value
		allowedValuesPropertyDep.notify();
	}

}

function SourcePathAdapter$_allowedValuesCollectionChanged<TEntity extends Entity, TValue>(this: SourcePathAdapter<TEntity, TValue>, args: ArrayChangedEventArgs<TValue>): void {
	let allowedValues = this._allowedValues;
	let options = this._options;
	if (options) {
		// Attempt to project changes to allowed values onto the options list
		let canUpdateOptions = true;
		args.changes.forEach(c => {
			if (canUpdateOptions) {
				if (c.type === ArrayChangeType.add) {
					let newOptions = c.items.map(i => new SourceOptionAdapter(this, i));
					options.splice(c.startIndex, 0, ...newOptions);
				} else if (c.type === ArrayChangeType.remove) {
					options.splice(c.startIndex, c.items.length);
				} else {
					canUpdateOptions = false;
				}
			}
		});

		// Fall back to rebuilding the list if needed
		if (!canUpdateOptions) {
			delete this._options;
			if (this._allowedValuesCollectionChangedHandler) {
				allowedValues.changed.unsubscribe(this._allowedValuesCollectionChangedHandler);
				delete this._allowedValuesCollectionChangedHandler;
			}
		}

		// Get the `Dep` object for the options property
		var optionsPropertyDep = this.__ob__.getPropertyDep('options');
		if (optionsPropertyDep) {
			// Notify of change in order to cause subscribers to fetch the new value
			optionsPropertyDep.notify();
		}
	}
}

*/