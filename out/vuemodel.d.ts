/// <reference path="../ref/vue.d.ts" />
/// <reference path="../ref/model.d.ts" />

declare module 'VueModel/helpers' {
	export function getProp(obj: any, prop: string): any;
	export function setProp(target: any, key: string, value: any): void;
	export function hasOwnProperty(obj: any, prop: string): any;
	export function debug(message: string): void;

}
declare module 'VueModel/vue-helpers' {
	export function Vue$isReserved(str: string): boolean;
	export function Vue$dependArray(value: Array<any>): void;

}
declare module 'VueModel/entity-observer' {
	import { Model, ModelConstructor, Entity, EntityConstructor, PropertyConstructor } from "Model";
	import { Observer, ObserverConstructor, DepConstructor } from "vue";
	export interface EntityObserver extends Observer {
	}
	export interface EntityObserverConstructor {
	    new (entity: Entity): EntityObserver;
	}
	export type ObserveEntityMethod = (entity: Entity, asRootData?: boolean) => EntityObserver;
	export interface EntityObserverDependencies {
	    entitiesAreVueObservable?: boolean;
	    Model$Model: ModelConstructor;
	    Model$Entity: EntityConstructor;
	    Model$Property: PropertyConstructor;
	    Vue$Observer: ObserverConstructor;
	    Vue$Dep: DepConstructor;
	    VueModel$EntityObserver?: EntityObserverConstructor;
	    VueModel$observeEntity?: ObserveEntityMethod;
	}
	export function VueModel$makeEntitiesVueObservable(model: Model, dependencies: EntityObserverDependencies): EntityObserverDependencies;

}
declare module 'VueModel/vue-plugin' {
	import { ComponentConstructor, ObserverConstructor, DepConstructor } from "vue";
	import { ModelConstructor, EntityConstructor, PropertyConstructor } from "model";
	export interface VuePluginDependencies {
	    entitiesAreVueObservable: boolean;
	    Model$Model: ModelConstructor;
	    Model$Entity: EntityConstructor;
	    Model$Property: PropertyConstructor;
	    Vue$Observer?: ObserverConstructor;
	    Vue$Dep?: DepConstructor;
	}
	export function VueModel$installPlugin(Vue: ComponentConstructor, dependencies: VuePluginDependencies): void;

}
declare module 'VueModel/vue-model' {
	import { Model } from "Model";
	export interface VueModelOptions {
	    createOwnProperties: boolean;
	}
	export class VueModel {
	    readonly $meta: Model;
	    constructor(options: VueModelOptions);
	}

}
declare module 'VueModel/field-adapter' {
	import { Entity, Property } from "model";
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
declare module 'VueModel/main' {
	 let api: any;
	export default api;

}
