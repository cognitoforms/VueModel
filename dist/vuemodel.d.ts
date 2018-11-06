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
	export interface VueModelMixins {
		SourceProvider: any;
		SourceConsumer: any;
	}
	export interface VueModelConstructor {
		new(options: VueModelOptions): VueModel;
		install(Vue: VueConstructor): void;
		mixins: VueModelMixins;
		SourceRootAdapter: SourceRootAdapterConstructor;
		SourcePathAdapter: SourcePathAdapterConstructor;
		SourceIndexAdapter: SourceIndexAdapterConstructor;
	}
	export class SourcePathAdapter<TEntity extends Entity, TValue> implements SourcePropertyAdapter, SourceAdapter<TValue> {
	    readonly source: SourceAdapter<TEntity>;
	    readonly path: string;
	    constructor(source: SourceAdapter<TEntity>, path: string);
	    readonly property: Property;
	    readonly label: string;
	    readonly helptext: string;
	    value: TValue;
	    displayValue: string;
	    toString(): string;
	}
	export interface SourcePathAdapterConstructor {
	    new <TEntity extends Entity, TValue>(source: SourceAdapter<TEntity>, path: string): SourcePathAdapter<TEntity, TValue>;
	}
	export class SourceIndexAdapter<TEntity extends Entity, TValue> implements SourceAdapter<TValue> {
	    readonly source: SourcePathAdapter<TEntity, TValue[]>;
	    readonly index: number;
	    constructor(source: SourcePathAdapter<TEntity, TValue[]>, index: number);
	    value: TValue;
	    displayValue: string;
	    toString(): string;
	}
	export interface SourceIndexAdapterConstructor {
	    new <TEntity extends Entity, TValue>(source: SourcePathAdapter<TEntity, TValue[]>, index: number): SourceIndexAdapter<TEntity, TValue>;
	}
	export interface SourceAdapter<TValue> {
	    value: TValue;
	    displayValue: string;
	}
	export interface SourcePropertyAdapter {
	    readonly label: string;
	    readonly helptext: string;
	    readonly property: Property;
	}
	export class SourceRootAdapter<TEntity extends Entity> implements SourceAdapter<TEntity> {
	    readonly entity: TEntity;
	    constructor(entity: TEntity);
	    readonly value: TEntity;
	    readonly displayValue: string;
	    toString(): string;
	}
	export interface SourceRootAdapterConstructor {
	    new <TEntity extends Entity>(entity: TEntity): SourceRootAdapter<TEntity>;
	}
}
