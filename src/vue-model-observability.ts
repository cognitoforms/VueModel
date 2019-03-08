import { Observer, ObserverConstructor, Dep } from "./vue-internals";
import { Model } from "../lib/model.js/src/model";
import { Entity, EntityRegisteredEventArgs } from "../lib/model.js/src/entity";
import { ObservableArray } from "../lib/model.js/src/observable-array";
import { hasOwnProperty, getProp } from "./helpers";

export interface TypedObserver<TValue> extends Observer {
    value: TValue;
}

export interface ExtendedObserver extends Observer {
    ensureObservable(): void;
}

export interface CustomObserverInterface {
    getPropertyDep(propertyName: string, create?: boolean): Dep;
    onPropertyAccess(propertyName: string, value: any): void;
    onPropertyChange(propertyName: string, newValue: any): void;
}

export interface CustomObserverConstructor extends ObserverConstructor {
    new(value: any): Observer & CustomObserverInterface;
}

let CustomObserverConstructor: ObserverConstructor = null;

export function getCustomObserverConstructor(): CustomObserverConstructor {
    return CustomObserverConstructor || (CustomObserverConstructor = require("./custom-observer").CustomObserver);
}

export interface EntityObserverConstructor extends ObserverConstructor {
    new(value: Entity): TypedObserver<Entity> & ExtendedObserver;
}

/**
 * Based on Vue's internal `observe()` function. Ensures that the given entity
 * is observable and optionally notes that it is referenced by a component
 * @param entity The entity to observe
 * @param asRootData The entity is referenced as a component's data
 */
export function observeEntity(entity: Entity, asRootData: boolean = false): TypedObserver<Entity> & ExtendedObserver {
    if (entity instanceof Entity) {
        var ob = getEntityObserver(entity, true);
        if (asRootData && ob) {
            ob.vmCount++;
        }
        return ob;
    } else {
        // TODO: Warn about attempting to observe non-entity?
    }
}

/**
 * Gets or creates an `EntityObserver` for the given entity
 * @param entity The entity begin observed
 * @param create If true, create the observer if it doesn't already exist
 */
export function getEntityObserver(entity: Entity, create: boolean = false): TypedObserver<Entity> & ExtendedObserver {
    var EntityObserver = getEntityObserverConstructor();
    if (hasOwnProperty(entity, '__ob__') && getProp(entity, '__ob__') instanceof EntityObserver) {
        return getProp(entity, '__ob__');
    } else if (create) {
        return new EntityObserver(entity);
    } else {
        return null;
    }
}

let EntityObserverConstructor: EntityObserverConstructor = null;

export function getEntityObserverConstructor(): EntityObserverConstructor {
    return EntityObserverConstructor || (EntityObserverConstructor = require("./entity-observer").EntityObserver);
}

export interface ArrayObserverConstructor extends ObserverConstructor {
    new(items: ObservableArray<any>): TypedObserver<ObservableArray<any>> & ExtendedObserver;
}

/**
 * Based on Vue's internal `observe()` function. Ensures that the given array
 * is observable and optionally notes that it is referenced by a component
 * @param array The array to observe
 * @param asRootData The array is referenced as a component's data
 */
export function observeArray<TItem>(array: ObservableArray<TItem>, asRootData: boolean = false): TypedObserver<ObservableArray<TItem>> & ExtendedObserver {
    if (Array.isArray(array)) {
        if (ObservableArray.isObservableArray(array)) {
            var ob = getArrayObserver(array, true);
            if (asRootData && ob) {
                ob.vmCount++;
            }
            return ob;
        } else {
            // TODO: Warn about attempting to observe non-observable array?
        }
    } else {
        // TODO: Warn about attempting to observe non-array?
    }
}

/**
 * Gets or creates an `ArrayObserver` for the given observable array
 * @param entity The entity begin observed
 * @param create If true, create the observer if it doesn't already exist
 */
export function getArrayObserver<TItem>(array: ObservableArray<TItem>, create: boolean = false): TypedObserver<ObservableArray<TItem>> & ExtendedObserver {
    let ArrayObserver = getArrayObserverConstructor();
    if (hasOwnProperty(array, '__ob__') && getProp(array, '__ob__') instanceof ArrayObserver) {
        return getProp(array, '__ob__');
    } else if (create) {
        return new ArrayObserver(array);
    } else {
        return null;
    }
}

let ArrayObserverConstructor: ArrayObserverConstructor = null;

export function getArrayObserverConstructor(): ArrayObserverConstructor {
    return ArrayObserverConstructor || (ArrayObserverConstructor = require("./array-observer").ArrayObserver);
}

/**
 * Based on Vue's internals `dependArray()` function
 * @param array The child array to track as a dependency
 */
export function dependChildArray(array: any[]): void {
    for (var e, i = 0, l = array.length; i < l; i++) {
        e = array[i];
        if (e != null) {
            if (e instanceof Entity) {
                let observer = getEntityObserver(e, true);
                observer.ensureObservable();
                observer.dep.depend();
            } else if (hasOwnProperty(e, '__ob__')) {
                (e.__ob__.dep as Dep).depend();
            }
            if (Array.isArray(e)) {
                dependChildArray(e);
            }
        }
    }
}

var vueCompatibleModels: Model[] = [];

/**
 * Make sure that entities in the given model are observable by Vue
 * By default, entities would not be observable, since model properties
 * are added to the prototype, Vue will not detect them. So, we use a custom
 * observer that leverages model metadata to manage property access/change.
 * @param model The model to augment
 */
export function makeEntitiesVueObservable(model: Model): void {

    if (!model || !(model instanceof Model)) {
        // TODO: Warn about missing or non-Model argument?
        return;
    }

    if (vueCompatibleModels.indexOf(model) >= 0 || (model as any)._entitiesAreVueObservable === true) {
        return;
    }

    model.entityRegistered.subscribe(function(args: EntityRegisteredEventArgs) {
        observeEntity(args.entity);
    });

    // Make existing entities observable
	for (let typeName of Object.keys(model.types)) {
		let type = model.types[typeName];
        type.known().forEach(function(entity: Entity) {
            observeEntity(entity);
        });
    }

    vueCompatibleModels.push(model);
    (model as any)._entitiesAreVueObservable = true;

}