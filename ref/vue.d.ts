declare module 'vue' {
    export interface Component {
        $options: ComponentOptionsObject;
    }
    export interface ComponentOptionsObject {
        props?: Array<any> | object;
        methods?: object;
    }
    export interface ComponentConstructor {
        mixin(options: ComponentOptions): void;
    }
    // https://012.vuejs.org/api/options.html
    // Only defining the members we need at the moment...
    export interface ComponentOptions {
        beforeCreate?(): void;
        created?(): void;
        beforeCompile?(): void;
        compiled?(): void;
        ready?(): void;
        attached?(): void;
        detached?(): void;
        beforeDestroy?(): void;
        destroyed?(): void;
    }
    export interface Dep {
        depend(): void;
        notify(): void;
    }
    export interface DepConstructor {
        new(): Dep;
        target: any;
    }
    export interface Observer {
        dep: Dep;
        vmCount: number;
    }
    export interface ObserverConstructor {
        new(value: any): Observer;
    }
    export interface Plugin {
        install(Vue: ComponentConstructor): void;
    }
}