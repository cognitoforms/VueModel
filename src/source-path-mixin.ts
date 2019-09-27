import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { SourceAdapter, isSourceAdapter, hasOverrideValue, isSourcePropertyAdapter } from "./source-adapter";
import { SourcePathAdapter, SourcePathOverrides } from "./source-path-adapter";
import { Entity } from "@cognitoforms/model.js";

@Component
export class SourcePathMixin extends Vue implements SourcePathOverrides {
	@Prop({ type: [String, Object] })
	source: string | SourceAdapter<any>;

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

	@Prop({ type: Boolean, default: null })
	required: boolean;

	@Watch("required")
	onRequiredChanged(required: boolean): void {
		this.onOverrideValueChanged(required, Boolean);
	}

	get $source(): SourceAdapter<any> {
		// If the source is an adapter, then potentially apply overrides, and return it
		if (isSourceAdapter(this.source)) {
			this.ensureOverridesAppliedToSourceAdapter(this.source);
			return this.source;
		}

		return new SourcePathAdapter<Entity, any>({ parent: this, propsData: { source: this.source, overrides: this } });
	}

	ensureOverridesAppliedToSourceAdapter(source: SourceAdapter<any>): void {
		let hasOverrides = hasOverrideValue(this.label, String) || hasOverrideValue(this.helptext, String) || hasOverrideValue(this.readonly, Boolean) || hasOverrideValue(this.required, Boolean);
		if (isSourcePropertyAdapter(source)) {
			if (hasOverrides) {
				if (source.overrides && source.overrides !== this) {
					throw new Error("Overrides have already been applied to source of type '" + source.constructor.name + "'.");
				}
	
				// Apply the given overrides as the overrides for the source
				source.overrides = this;
			}
		}
		else {
			if (hasOverrides) {
				throw new Error("Cannot apply overrides to source of type '" + source.constructor.name + "'.");
			}
		}
	}

	onOverrideValueChanged(value: string | boolean, type: StringConstructor | BooleanConstructor): void {
		// If the source is an adapter, and an override value is set, then ensure that the
		if (isSourceAdapter(this.source) && hasOverrideValue(value, type)) {
			this.ensureOverridesAppliedToSourceAdapter(this.source);
		}
	}
}
