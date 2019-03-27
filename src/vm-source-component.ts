import Vue, { VNode } from "vue";
import { Component, Prop } from "vue-property-decorator";
import { SourceAdapter, isSourceAdapter } from "./source-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { Entity } from "../lib/model.js/src/entity";

@Component
export class VMSource extends Vue {
	@Prop({ type: [String, Object] })
	source: string | SourceAdapter<any>;

	get $source() : SourceAdapter<any> {
		if (isSourceAdapter(this.source)) {
			return this.source;
		}

		return new SourcePathAdapter<Entity, any>({ parent: this, propsData: { source: this.source } });
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
}
