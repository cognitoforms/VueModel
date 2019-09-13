import Vue, { VNode } from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { SourceAdapter, isSourceAdapter, applyOverridesToSourceAdapter, hasOverrideValue } from "./source-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { Entity } from "@cognitoforms/model.js";

@Component
export class VMSource extends Vue {
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
		if (isSourceAdapter(this.source)) {
			return applyOverridesToSourceAdapter(this.source, this);
		}

		return new SourcePathAdapter<Entity, any>({ parent: this, propsData: { source: this.source, overrides: this } });
	}

	render(): VNode {
		var slotNodes = this.$scopedSlots.default({
			$source: this.$source
		});

		if (slotNodes.length !== 1) {
			throw new Error("Found " + slotNodes.length + " nodes in default slot for component 'vm-source'.");
		}

		return slotNodes[0];
	}

	onOverrideValueChanged(value: string | boolean, type: StringConstructor | BooleanConstructor): void {
		if (isSourceAdapter(this.source) && hasOverrideValue(value, type)) {
			throw new Error("Cannot apply overrides to source of type '" + this.source.constructor.name + "'.");
		}
	}
}
