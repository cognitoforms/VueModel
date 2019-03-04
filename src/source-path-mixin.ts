import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator'
import { SourceAdapter } from "./source-adapter";
import { Entity } from "../lib/model.js/src/entity";
import { SourcePathAdapter } from "./source-path-adapter";


@Component
export class SourcePathMixin extends Vue {

	@Prop(String)
	source: string;

	@Prop(String)
	label: string;

	@Prop(String)
	helptext: string;

	@Prop(Boolean)
	readonly: boolean
	
	get $source() : SourceAdapter<Entity> {
		return new SourcePathAdapter<Entity, any>({ parent: this, propsData: { source: this.source, overrides: this } });
	}
};
