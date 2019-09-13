import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { SourceAdapter } from "./source-adapter";
import { Entity } from "@cognitoforms/model.js";
import { SourceRootAdapter } from "./source-root-adapter";
import { observeEntity } from "./vue-model-observability";

@Component
export class SourceRootMixin extends Vue {
	@Prop({ type: [Object, String] })
	source: string | Entity;

	@Prop({ type: Boolean, default: null })
	readonly: boolean;

	@Watch("readonly")
	onReadonlyChanged(readonly: boolean): void {
		this.$source.readonly = readonly;
	}

	get $source(): SourceAdapter<Entity> {
		let entity: Entity;

		if (this.source instanceof Entity) {
			entity = this.source;
		}
		else {
			entity = (this as any)[this.source || "entity"];
			if (!entity || !(entity instanceof Entity)) {
				throw new Error("No entity data!");
			}
		}

		observeEntity(entity).ensureObservable();

		return new SourceRootAdapter<Entity>({ parent: this, propsData: { entity: entity } });
	}
}
