import { VNode } from "vue";
import { Component } from "vue-property-decorator";
import { mixins } from "vue-class-component";
import { SourceRootMixin } from "./source-root-mixin";

@Component
export class VMRoot extends mixins(SourceRootMixin) {
	render(): VNode {
		var slotNodes = this.$scopedSlots.default({
			$source: this.$source
		});

		if (slotNodes.length !== 1) {
			throw new Error("Found " + slotNodes.length + " nodes in default slot for component 'vm-root'.");
		}

		return slotNodes[0];
	}
}
