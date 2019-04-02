import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { Entity } from "../lib/model.js/src/entity";
import { SourceAdapter, isSourceAdapter, isSourcePropertyAdapter } from "./source-adapter";
import { SourcePathAdapter, SourcePathOverrides } from "./source-path-adapter";
import { ObservableArray, ArrayChangeType } from "../lib/model.js/src/observable-array";

@Component
export class SourceItemAdapter<TEntity extends Entity, TValue> extends Vue implements SourceAdapter<TValue> {
    @Prop(Number)
    index: number;

    @Prop(Object)
    parentSource: SourceAdapter<TValue[]>;

	@Prop(Object)
    overrides: SourcePathOverrides;
    
    @Prop({ type: Boolean, default: false })
    suppressChangeTracking: boolean;

    isOrphaned: boolean = false;

    internalIndex: number = -1;
    
    isSubscribedToSourceChanges: boolean = false;

    created(): void {
    	// Track the intial index internally
    	this.internalIndex = this.index;

    	// Track changes to the list and update the component's state appropriately
    	if (!this.suppressChangeTracking) {
    		this.subscribeToSourceChanges();
    	}
    }

	@Watch("index")
    onIndexChanged(index: number): void {
    	this.internalIndex = index;
    }

	get parent(): SourceAdapter<TValue[]> {
		if (isSourceAdapter(this.parentSource)) {
			return this.parentSource;
		}

		for (let parentVm: Vue = this.$parent.$parent, parentLevel = 1; parentVm != null; parentVm = parentVm.$parent, parentLevel += 1) {
			if (isSourceAdapter((parentVm as any).$source)) {
				return (parentVm as any).$source as SourcePathAdapter<TEntity, TValue[]>;
			}
		}

		throw new Error("Parent source not found!");
	}

	/**
	 *  Indicants whether the source property is readonly.
	 *
	 *  @returns True if either the parent source or the source override is read only, otherwise false
	 */
	get readonly(): boolean {
		return this.parent.readonly || (this.overrides ? this.overrides.readonly : false);
	}

	subscribeToSourceChanges(): void {
		if (this.isSubscribedToSourceChanges) {
			return;
		}

		let _this = this;
		let array = ObservableArray.ensureObservable(this.parent.value);
		array.changed.subscribe(function (args) {
			let index: number = _this.internalIndex;
			let isOrphaned: boolean = _this.isOrphaned;
			args.changes.forEach(function (c) {
				if (c.type === ArrayChangeType.remove) {
					if (c.startIndex === index) {
						index = -1;
						isOrphaned = true;
					}
					else if (c.startIndex < index) {
						if (c.items.length > index - c.startIndex) {
							index = -1;
							isOrphaned = true;
						}
						else {
							index -= c.items.length;
						}
					}
				}
				else if (c.type === ArrayChangeType.add) {
					if (c.startIndex >= 0) {
						if (c.startIndex <= index) {
							index += c.items.length;
						}
					}
				}
			});
			if (isOrphaned !== _this.isOrphaned) {
				Vue.set(_this, "isOrphaned", isOrphaned);
			}
			if (index !== _this.internalIndex) {
				Vue.set(_this, "internalIndex", index);
			}
		});

		this.isSubscribedToSourceChanges = true;
	}

	get value(): TValue {
		let list = this.parent.value;
		let value = list[this.internalIndex];
		return value as TValue;
	}

	get displayValue(): string {
		let list = this.parent.value;

		let value = list[this.internalIndex];

		let displayValue: string | string[];

		if (isSourcePropertyAdapter(this.parent) && this.parent.property.format != null) {
			// Use a markup or property format if available
			displayValue = this.parent.property.format.convert(value);
		}
		else {
			displayValue = value.toString();
		}

		return displayValue;
	}

	toString(): string {
		return "Source[" + this.internalIndex + "]";
	}
}
