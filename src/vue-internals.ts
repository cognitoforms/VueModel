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
	Dep: null
};

// NOTE: Based on TypeScript generated code
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
            return true;
        }

        return false;
    };

}());

const ObserverConstructor = (function() {
    var ctor = function ObserverProxy(value: any) {
        if (!VueInternals.Observer) {
            throw new Error("Vue's 'Observer' constructor has not yet been obtained.");
        }

        __extendsDeferred(ctor, VueInternals.Observer);
        return VueInternals.Observer.call(this, value) || this;
    };

    (ctor as any).extend = (function() {
        if (!VueInternals.Observer) {
            throw new Error("Vue's 'Observer' constructor has not yet been obtained.");
        }

        __extendsDeferred(ctor, VueInternals.Observer);
    }).bind(ctor);

    return ctor;
}());

export interface DeferredClass {
    extend(): boolean;
}

export const Observer: ObserverConstructor & DeferredClass = ObserverConstructor as any;

export function getObserverProxy(): ObserverConstructor & DeferredClass {

    var ObserverProxy = /** @class */ (function (_deps: any, _superName: string) {
        function ObserverProxy(value: any) {
            var _super = _deps[_superName];
            if (!_super) {
                throw new Error("Base class '" + _superName + "' constructor has not yet been obtained.");
            }
            if (__extendsDeferred(ObserverProxy, _super)) {
                var proto: any = new _super({});
                ObserverProxy.prototype = proto;
                ObserverProxy.prototype.constructor = _super;
                delete proto.value;
                delete proto.dep;
                delete proto.vmCount;
            }
            var _this = this;
            _this = _super.call(this, value) || this;
            return _this;
        };
        (ObserverProxy as any).extend = function() {
            var _super = _deps[_superName];
            if (!_super) {
                throw new Error("Base class '" + _superName + "' constructor has not yet been obtained.");
            }
            if (__extendsDeferred(ObserverProxy, _super)) {
                var proto: any = new _super({});
                ObserverProxy.prototype = proto;
                ObserverProxy.prototype.constructor = _super;
                delete proto.value;
                delete proto.dep;
                delete proto.vmCount;
                return true;
            }

            return false;
        };
        return ObserverProxy;
    }(VueInternals, 'Observer'));

    return ObserverProxy as any;

}

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
