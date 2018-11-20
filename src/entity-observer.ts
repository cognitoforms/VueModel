import { Model } from "../lib/model.js/src/model";
import { Entity, EntityRegisteredEventArgs, EntityAccessEventArgs, EntityChangeEventArgs } from "../lib/model.js/src/entity";
import { Type } from "../lib/model.js/src/type";
import { Dep } from "./vue-internals";
import { hasOwnProperty, getProp } from "./helpers";
import { CustomObserver } from "./custom-observer";

/**
 * A subclass of Vue's internal `Observer` class for entities, which uses model
 * metadata to manage property access/change rather than property walking and rewriting
 */
export class EntityObserver extends CustomObserver<Entity> {

    value: Entity;

    constructor(entity: Entity) {
        super(entity);
    }

    walk(): void {
        // Overwrite the `walk()` method to prevent Vue's default property walking behavior
        // TODO: Should we allow this to happen?
    }

    ensureObservable(): void {
        if ((this as any)._observable === true) {
            return;
        }
    
        this.value.accessed.subscribe(this._onAccess.bind(this));
        this.value.changed.subscribe(this._onChange.bind(this));
    
        (this as any)._observable = true;
    }

    _onAccess(args: EntityAccessEventArgs): void {

        // Get the current property value
        var value = (args.entity as any)[args.property.fieldName];

        // Notify interested observers of the property access in order to track dependencies
        this.onPropertyAccess(args.property.name, value);

    }

    _onChange(args: EntityChangeEventArgs): void {
    
        // Get the current property value
        var newValue = (args.entity as any)[args.property.fieldName];

        // Notify interested observers of the property change
        this.onPropertyChange(args.property.name, newValue);

    }
    
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

/**
 * Gets or creates and `EntityObserver` for the given entity
 * @param entity The entity begin observed
 * @param create If true, create the observer if it doesn't already exist
 */
export function getEntityObserver(entity: Entity, create: boolean = false): EntityObserver {
    if (hasOwnProperty(entity, '__ob__') && getProp(entity, '__ob__') instanceof EntityObserver) {
        return getProp(entity, '__ob__');
    } else if (create) {
        return new EntityObserver(entity);
    } else {
        return null;
    }
}

/**
 * Based on Vue's internal `observe()` function. Ensures that the given entity
 * is observable and optionally notes that it is referenced by a component
 * @param entity The entity to observe
 * @param asRootData The entity is referenced as a component's data
 */
export function observeEntity(entity: Entity, asRootData: boolean = false): EntityObserver {
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
    model.getTypes().forEach(function(type: Type) {
        type.known().forEach(function(entity: Entity) {
            observeEntity(entity);
        });
    });

    vueCompatibleModels.push(model);
    (model as any)._entitiesAreVueObservable = true;

}
