import Vue, { ComponentOptions } from "vue";
import { DefaultData, DefaultMethods, DefaultComputed, PropsDefinition, DefaultProps } from "vue/types/options";

export interface VueConstructor {
    mixin<V extends Vue, Data=DefaultData<V>, Methods=DefaultMethods<V>, Computed=DefaultComputed, PropsDef=PropsDefinition<DefaultProps>, Props=DefaultProps>(options: ComponentOptions<V, Data, Methods, Computed, PropsDef, Props>): void;
}

export declare class Dep {
    depend(): void;
    notify(): void;
}

export interface DepConstructor {
    new(): Dep;
    target: any;
}

export declare class Observer {
    value: any;
    dep: Dep;
    vmCount: number;
}

export interface ObserverConstructor {
    new(value: any): Observer;
}

export interface Plugin {
    install(Vue: VueConstructor): void;
}
