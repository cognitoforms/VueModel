import { Entity } from "../lib/model.js/src/entity";
import { Observer, DeferredClass } from "./vue-internals";
import { CustomObserver, CustomObserverConstructor, CustomObserverProto } from "./custom-observer";
import { ObservableArray, ArrayChangedEventArgs } from "../lib/model.js/src/observable-array";
import { hasOwnProperty, getProp } from "./helpers";

export interface ArrayObserver<TItem> extends CustomObserver<Array<TItem>>, ArrayObserverPrototype<TItem> {
    value: ObservableArray<TItem>
}

export interface ArrayObserverConstructor extends CustomObserverConstructor {
    new(items: any[]): ArrayObserver<any>;
    _extend(): void;
}

export interface ArrayObserverPrototype<TItem> {
    walk(this: Observer): void;
    ensureObservable(this: ArrayObserver<TItem>): void;
    _onChange(this: ArrayObserver<TItem>, args: ArrayChangedEventArgs<any>): void;
}

const ArrayObserverProto: ArrayObserverPrototype<any> = {

    walk(): void {
        // Overwrite the `walk()` method to prevent Vue's default property walking behavior
        // TODO: Should we allow this to happen?
    },

    ensureObservable(): void {
        if ((this as any)._observable === true) {
            return;
        }
    
        this.value.changed.subscribe(this._onChange.bind(this));
    
        (this as any)._observable = true;
    },

    _onChange(args: ArrayChangedEventArgs<any>): void {
        this.dep.notify();
    }
 
};

/**
 * A subclass of Vue's internal `Observer` class for entities, which uses model
 * metadata to manage property access/change rather than property walking and rewriting
 */
export const ArrayObserver = /** @class */ (function ArrayObserver(_super: CustomObserverConstructor & DeferredClass, protos: any[]): ArrayObserverConstructor & DeferredClass {

    let _extended: boolean;

    function _extendDeferred() {
        if (!_extended) {
            _super.extend();
            var proto = new _super({});
            (ArrayObserver as any).prototype = proto;
            (ArrayObserver as any).prototype.constructor = _super;
            protos.forEach(function(p) {
                Object.keys(p).forEach(function(k) {
                    (proto as any)[k] = (p as any)[k];
                });
            });
            delete proto.propertyDeps;
            _extended = true;
        }
    }

    function ArrayObserver(value: Entity) {
        _extendDeferred();
        var _this = this;
        _this = _super.call(this, value) || this;
        return _this;
    }

    (ArrayObserver as any).extend = function() {
        _extendDeferred();
    };

    return ArrayObserver as any;

}(CustomObserver, [CustomObserverProto, ArrayObserverProto]));

/**
 * Gets or creates an `ArrayObserver` for the given observable array
 * @param entity The entity begin observed
 * @param create If true, create the observer if it doesn't already exist
 */
export function getArrayObserver<TItem>(array: ObservableArray<TItem>, create: boolean = false): ArrayObserver<TItem> {
    if (hasOwnProperty(array, '__ob__') && getProp(array, '__ob__') instanceof ArrayObserver) {
        return getProp(array, '__ob__');
    } else if (create) {
        return new ArrayObserver(array);
    } else {
        return null;
    }
}

/**
 * Based on Vue's internal `observe()` function. Ensures that the given array
 * is observable and optionally notes that it is referenced by a component
 * @param array The array to observe
 * @param asRootData The array is referenced as a component's data
 */
export function observeArray<TItem>(array: ObservableArray<TItem>, asRootData: boolean = false): ArrayObserver<TItem> {
    if (Array.isArray(array)) {
        var ob = getArrayObserver(array, true);
        if (asRootData && ob) {
            ob.vmCount++;
        }
        return ob;
    } else {
        // TODO: Warn about attempting to observe non-array?
    }
}
