/// <reference path="model.js.d.ts" />
import Vue from "vue";
import { DefaultData, DefaultMethods, DefaultComputed, PropsDefinition, DefaultProps, ComponentOptions } from "vue/types/options";
import { Model, ModelConstructor, Entity, EntityConstructor, Property, PropertyConstructor } from "model.js";
declare module 'vuemodel' {
	export interface VueConstructor {
	    mixin<V extends Vue, Data = DefaultData<V>, Methods = DefaultMethods<V>, Computed = DefaultComputed, PropsDef = PropsDefinition<DefaultProps>, Props = DefaultProps>(options: ComponentOptions<V, Data, Methods, Computed, PropsDef, Props>): void;
	}
	export class Dep {
	    depend(): void;
	    notify(): void;
	}
	export interface DepConstructor {
	    new (): Dep;
	    target: any;
	}
	export class Observer {
	    dep: Dep;
	    vmCount: number;
	}
	export interface ObserverConstructor {
	    new (value: any): Observer;
	}
	export interface Plugin {
	    install(Vue: VueConstructor): void;
	}
	export class EntityObserver extends Observer {
		constructor(entity: Entity);
	}
	export interface EntityObserverConstructor {
		new(entity: Entity): EntityObserver;
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
		install(Vue: VueConstructor): void;
		SourceAdapter: SourceAdapterConstructor;
	}
	export class SourceAdapter<TEntity extends Entity, TValue> {
		readonly entity: TEntity;
		readonly path: string;
		constructor(entity: TEntity, path: string);
		readonly property: Property;
		readonly label: string;
		readonly helptext: string;
		value: TValue;
		displayValue: string;
	}
	export interface SourceAdapterConstructor {
		new <TEntity extends Entity, TValue>(entity: TEntity, path: string): SourceAdapter<TEntity, TValue>;
	}
}
