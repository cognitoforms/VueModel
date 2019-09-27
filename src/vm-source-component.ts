import { VNode } from "vue";
import { Component } from "vue-property-decorator";
import { mixins } from "vue-class-component";
import { SourcePathMixin } from "./source-path-mixin";

@Component
export class VMSource extends mixins(SourcePathMixin) {
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
