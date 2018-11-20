import { VueConstructor } from "vue";

export interface Dep {
    depend(): void;
    notify(): void;
}

export interface DepConstructor {
    new(): Dep;
    target: any;
}

export interface Observer {
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

export interface VueInternals {
    Vue: VueConstructor;
    Observer: ObserverConstructor;
    Dep: DepConstructor;
}

let VueInternals: VueInternals = {
    Vue: null,
    Observer: null,
    Dep: null,
};

// NOTE: Based on Webpack generated code
let __extendsDeferred = (function() {

    let called = false;

    var extendStatics = function (d: any, b: any): void {
        extendStatics = (Object as any).setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d: any, b: any) { d.__proto__ = b; }) ||
            function (d: any, b: any) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }

    function __extends(d: any, b: any): any {
        extendStatics(d, b);
        let __: any = function __() { this.constructor = d; };
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    return function __extendsDeferred(d: any, b: any) {
        if (!called) {
            __extends(d, b);
            called = true;
        }
    };

}());

const ObserverConstructor = (function() {
    return function Observer(value: any) {
        __extendsDeferred(Observer, VueInternals.Observer);
        return VueInternals.Observer.call(this, value) || this;
    }
}());

export const Observer: ObserverConstructor = ObserverConstructor as any;

export function ensureVueInternalTypes(Vue: VueConstructor): VueInternals {

    if (VueInternals.Vue != null) {
        if (VueInternals.Vue !== Vue) {
            // TODO: Warn about dependency duplication?
        }

        return VueInternals;
    }

	let component = new Vue({
		data() {
			return { };
		},
    });

    let data = component.$data;
 
    let observer = data.__ob__ as Observer;
    let observerCtor = data.__ob__.constructor as ObserverConstructor;
    let depCtor = observer.dep.constructor as DepConstructor;

    VueInternals.Vue = Vue;
    VueInternals.Observer = observerCtor;
    VueInternals.Dep = depCtor;

    return VueInternals;

}

export default VueInternals;
