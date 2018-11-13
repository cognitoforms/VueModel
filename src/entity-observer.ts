import { Model } from "../lib/model.js/src/model";
import { ModelConstructor, ModelEntityRegisteredEventArgs, ModelPropertyAddedEventArgs, EntityAccessEventArgs, TypeConstructor } from "../lib/model.js/src/interfaces";
import { Entity, EntityConstructor } from "../lib/model.js/src/interfaces";
import { Type } from "../lib/model.js/src/type";
import { Property, PropertyConstructor,   PropertyAccessEventArgs, PropertyChangeEventArgs } from "../lib/model.js/src/interfaces";
import { Observer, ObserverConstructor, DepConstructor, Dep } from "./vue-internals";
import { hasOwnProperty, getProp } from "./helpers";
import { Vue$dependArray } from "./vue-helpers";

export interface EntityObserver extends Observer {
    value: Entity;
    ensureObservable(): void;
}

function EntityObserver$ensureObservable(this: EntityObserver) {
    if ((this as any)._observable === true) {
        return;
    }

    this.value.accessedEvent.subscribe(EntityObserver$_onAccess.bind(this));
    this.value.changedEvent.subscribe(EntityObserver$_onChange.bind(this));

    (this as any)._observable = true;
};

function EntityObserver$_ensureChildEntitiesObservable(this: EntityObserver, array: Entity[]) {
    for (var e, i = 0, l = array.length; i < l; i++) {
        e = array[i];
        if (Array.isArray(e)) {
            EntityObserver$_ensureChildEntitiesObservable.call(this, e);
        } else {
            let observer = Entity$getObserver(e, (this as any)._dependencies as EntityObserverDependencies, true);
            observer.ensureObservable();
        }
    }
}

export function EntityObserver$_getPropertyDep(this: EntityObserver, property: Property): Dep {
    let dependencies = (this as any)._dependencies as EntityObserverDependencies;
    let Vue$Dep = dependencies.Vue$Dep;

    let dep: Dep;

    let target: any = this.value;

    var depFieldName = property.fieldName + "_Dep";

    if (hasOwnProperty(target, depFieldName) && target[depFieldName] instanceof Vue$Dep) {
        dep = target[depFieldName];
    } else {
        dep = new Vue$Dep();
        Object.defineProperty(target, depFieldName, {
            configurable: true,
            enumerable: false,
            value: dep,
            writable: true
        });
    }

    return dep;
}

function EntityObserver$_onAccess(this: EntityObserver, sender: Property, args: EntityAccessEventArgs) {
    let dependencies = (this as any)._dependencies as EntityObserverDependencies;
    let Vue$Dep = dependencies.Vue$Dep;
    let Model$Type = dependencies.Model$Type;
    let VueModel$observeEntity = dependencies.VueModel$observeEntity;

    // Attach dependencies if something is watching
    if (Vue$Dep.target) {

        // Get or initialize the `Dep` object
        var propertyDep = EntityObserver$_getPropertyDep.call(this, args.property as Property, dependencies);

        propertyDep.depend();

        var val = (args.entity as any)[args.property.fieldName];
        var childOb = VueModel$observeEntity(val);

        if (childOb) {
            childOb.ensureObservable();
            childOb.dep.depend();
        } else if (Array.isArray(val)) {
            let itemType = args.property.propertyType;
            if (itemType.meta && itemType.meta instanceof Model$Type) {
                EntityObserver$_ensureChildEntitiesObservable.call(this, val);
            }

            // TODO: set up observability entities in child list if needed? -- ex: if args.property.isEntityList...
            Vue$dependArray(val);
        }
    }
}

function EntityObserver$_onChange(this: EntityObserver, sender: Property, args: EntityAccessEventArgs) {
    let dependencies = (this as any)._dependencies as EntityObserverDependencies;
    let VueModel$observeEntity = dependencies.VueModel$observeEntity;

    // Get or initialize the `Dep` object
    var propertyDep = EntityObserver$_getPropertyDep.call(this, args.property as Property, dependencies);

    // Make sure a new value that is an entity is observable
    VueModel$observeEntity(args.entity).ensureObservable();

    // Notify of property change
    propertyDep.notify(); 
}

export interface EntityObserverConstructor {
    new(entity: Entity): EntityObserver;
}

export type ObserveEntityMethod = (entity: Entity, asRootData?: boolean) => EntityObserver;

export interface EntityObserverDependencies {
    entitiesAreVueObservable?: boolean;
    Model$Model: ModelConstructor;
    Model$Type: TypeConstructor;
    Model$Entity: EntityConstructor;
    Model$Property: PropertyConstructor;
    Vue$Observer: ObserverConstructor;
    Vue$Dep: DepConstructor;
    VueModel$EntityObserver?: EntityObserverConstructor;
    VueModel$observeEntity?: ObserveEntityMethod;
}

var vueCompatibleModels: Model[] = [];

function ensureEntityObserversAreCreated(model: Model, dependencies: EntityObserverDependencies) {

    if (model == null || vueCompatibleModels.indexOf(model) >= 0) {
        return;
    }

    let Model$Model = dependencies.Model$Model;
    let VueModel$observeEntity = dependencies.VueModel$observeEntity;

    if (!(model instanceof Model$Model)) {
        // TODO: Warn about non-Model argument?
        return;
    }

    model.entityRegisteredEvent.subscribe(function(sender: Model, args: ModelEntityRegisteredEventArgs) {
        VueModel$observeEntity(args.entity);
    });

    // Make existing entities observable
    model.types.forEach(function(type: Type) {
        type.known().forEach(function(entity: Entity) {
            VueModel$observeEntity(entity);
        });
    });

    vueCompatibleModels.push(model);

}

function defineEntityObserver(dependencies: EntityObserverDependencies): EntityObserverConstructor {

    let Vue$Observer = dependencies.Vue$Observer;

    var ctor = function EntityObserver(entity: Entity) {
        Vue$Observer.apply(this, arguments);
        this.ensureObservable = EntityObserver$ensureObservable.bind(this);
        Object.defineProperty(this, "_dependencies", { configurable: false, enumerable: false, value: dependencies, writable: false });
    };

    ctor.prototype = new Vue$Observer({});
    ctor.prototype.constructor = ctor;

    // ctor.prototype.onAccess = EntityObserver$onAccess;
    // ctor.prototype.onChange = EntityObserver$onChange;

    // Prevent walking of entities
    // TODO: Should we allow this to happen?
    ctor.prototype.walk = function EntityObserver$walk() {
        // Do nothing?
    };

    return dependencies.VueModel$EntityObserver = (ctor as unknown) as EntityObserverConstructor;
}

export function Entity$getObserver(entity: Entity, dependencies: EntityObserverDependencies, create: boolean = false): EntityObserver {
    let VueModel$EntityObserver = dependencies.VueModel$EntityObserver;
    if (hasOwnProperty(entity, '__ob__') && getProp(entity, '__ob__') instanceof VueModel$EntityObserver) {
        return getProp(entity, '__ob__');
    } else if (create) {
        return new VueModel$EntityObserver(entity);
    } else {
        return null;
    }
}

function defineObserveEntity(dependencies: EntityObserverDependencies): ObserveEntityMethod {

    return dependencies.VueModel$observeEntity = function VueModel$observeEntity(entity: Entity, asRootData: boolean = false): EntityObserver {

        let Model$Entity = dependencies.Model$Entity;

        if (entity instanceof Model$Entity) {
            var ob = Entity$getObserver(entity, dependencies, true);
            if (asRootData && ob) {
                ob.vmCount++;
            }
            return ob;
        } else {
            // TODO: Warn about attempting to observe non-entity?
        }

    };

}

export function VueModel$makeEntitiesVueObservable(model: Model, dependencies: EntityObserverDependencies): EntityObserverDependencies {

    let entitiesAreVueObservable = dependencies.entitiesAreVueObservable;

    if (entitiesAreVueObservable) {
        ensureEntityObserversAreCreated(model, dependencies);
        return dependencies;
    }

    defineEntityObserver(dependencies);

    defineObserveEntity(dependencies);

    ensureEntityObserversAreCreated(model, dependencies);

    dependencies.entitiesAreVueObservable = true;

    return dependencies;
}
