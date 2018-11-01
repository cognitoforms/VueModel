/// <reference path="../ref/vue.d.ts" />
/// <reference path="../ref/model.d.ts" />

declare module 'VueModel' {
	import { Model, ModelConstructor, Entity, EntityConstructor, Property, PropertyConstructor } from "Model";
	import { ComponentConstructor, Observer, ObserverConstructor, DepConstructor } from "vue";
	export interface EntityObserver extends Observer {
	}
	export interface EntityObserverConstructor {
	    new (entity: Entity): EntityObserver;
	}
	export interface VueModelOptions {
	    createOwnProperties: boolean;
	}
	export class VueModel {
	    readonly $meta: Model;
	    constructor(options: VueModelOptions);
	}
	export interface VueModelConstructor {
		new(options: VueModelOptions): VueModel;
		install(Vue: ComponentConstructor): void;
	}
	export class FieldAdapter<TEntity extends Entity, TValue> {
	    readonly entity: TEntity;
	    readonly path: string;
	    constructor(entity: TEntity, path: string);
	    readonly property: Property;
	    readonly label: string;
	    readonly helptext: string;
	    value: TValue;
	    displayValue: string;
	}
}
