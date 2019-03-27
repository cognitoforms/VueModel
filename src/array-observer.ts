import { CustomObserver } from "./custom-observer";
import { ObservableArray } from "../lib/model.js/src/observable-array";
import { ExtendedObserver } from "./vue-model-observability";

/**
 * A subclass of Vue's internal `Observer` class for arrays, which uses observable
 * array events rather than property walking and rewriting
 */
export class ArrayObserver<TItem> extends CustomObserver<ObservableArray<TItem>> implements ExtendedObserver {

    ensureObservable(): void {
        if ((this as any)._observable === true) {
            return;
        }
    
        this.value.changed.subscribe(this._onChange.bind(this));
    
        (this as any)._observable = true;
    }

    _onChange(): void {
        this.dep.notify();
    }
 
}
