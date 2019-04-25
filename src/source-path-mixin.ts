import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { isSourceAdapter, isSourcePropertyAdapter } from "./source-adapter";
import { Entity } from "../lib/model.js/src/entity";
import { SourcePathAdapter } from "./source-path-adapter";

@Component
export class SourcePathMixin extends Vue {
	@Prop({ type: [String, Object] })
	source: string | SourcePathAdapter<Entity, any>;

	@Prop(String)
	label: string;

	@Watch("label")
	onLabelChanged(label: string): void {
		this.onOverrideValueChanged(label, String);
	}

	@Prop(String)
	helptext: string;

	@Watch("helptext")
	onHelptextChanged(helptext: string): void {
		this.onOverrideValueChanged(helptext, String);
	}

	@Prop({ type: Boolean, default: null })
	readonly: boolean;

	@Watch("readonly")
	onReadonlyChanged(readonly: boolean): void {
		this.onOverrideValueChanged(readonly, Boolean);
	}

	get $source(): SourcePathAdapter<Entity, any> {
		// If the source is an adapter, then potentially apply overrides, and return it
		if (isSourceAdapter(this.source)) {
			let hasOverrides = hasOverrideValue(this.label, String) || hasOverrideValue(this.helptext, String) || hasOverrideValue(this.readonly, Boolean);
			if (isSourcePropertyAdapter(this.source)) {
				if (hasOverrides) {
					if (this.source.overrides) {
						throw new Error("Overrides have already been applied to source of type '" + this.source.constructor.name + "'.");
					}

					// Apply this component as the overrides for the source
					this.source.overrides = this;
				}

				return this.source;
			}
			else {
				if (hasOverrides) {
					throw new Error("Cannot apply overrides to source of type '" + (this.source as any).constructor.name + "'.");
				}

				return this.source;
			}
		}

		return new SourcePathAdapter<Entity, any>({ parent: this, propsData: { source: this.source, overrides: this } });
	}

	onOverrideValueChanged(value: string | boolean, type: StringConstructor | BooleanConstructor): void {
		if (isSourceAdapter(this.source) && hasOverrideValue(value, type)) {
			throw new Error("Cannot apply overrides to source of type '" + this.source.constructor.name + "'.");
		}
	}
}

function hasOverrideValue(value: any, type: StringConstructor | BooleanConstructor): boolean {
	if (type === String) {
		return typeof value === "string" && value.length > 0;
	}
	else if (type === Boolean) {
		return typeof value === "boolean";
	}
}
