import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator'
import { SourceAdapter } from './source-adapter';
import { Entity } from '../lib/model.js/src/entity';
import { SourceRootAdapter } from './source-root-adapter';
import { observeEntity } from './entity-observer';

@Component
export class SourceRootMixin extends Vue {

	@Prop(String)
	source: string;

	@Prop(Boolean)
	readonly: boolean;

	@Watch('readonly')
	onReadonlyChanged(value: boolean, oldValue: boolean) {
		this.$source.readonly = this.readonly;
	}

	get $source(): SourceAdapter<Entity> {
		var entity = (this as any)["entry"] as Entity;
		observeEntity(entity).ensureObservable();
		return new SourceRootAdapter<Entity>({ propsData: { entity: entity } });
	}
};