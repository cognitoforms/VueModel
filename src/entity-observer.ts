import { Model, ModelConstructor, ModelEntityRegisteredEventArgs, ModelPropertyAddedEventArgs } from "../lib/model.js/src/model";
import { Entity, EntityConstructor } from "../lib/model.js/src/entity";
import { Type } from "../lib/model.js/src/type";
import { Property, PropertyConstructor,   PropertyAccessEventArgs, PropertyChangeEventArgs } from "../lib/model.js/src/property";
import { Observer, ObserverConstructor, DepConstructor, Dep } from "./vue-internals";
import { hasOwnProperty, getProp } from "./helpers";
import { Vue$dependArray } from "./vue-helpers";

export interface EntityObserver extends Observer {
    // No custom members yet
}

export interface EntityObserverConstructor {
    new(entity: Entity): EntityObserver;
}

export type ObserveEntityMethod = (entity: Entity, asRootData?: boolean) => EntityObserver;

export interface EntityObserverDependencies {
    entitiesAreVueObservable?: boolean;
    Model$Model: ModelConstructor;
    Model$Entity: EntityConstructor;
    Model$Property: PropertyConstructor;
    Vue$Observer: ObserverConstructor;
    Vue$Dep: DepConstructor;
    VueModel$EntityObserver?: EntityObserverConstructor;
    VueModel$observeEntity?: ObserveEntityMethod;
}

var vueCompatibleModels: Model[] = [];

function ensureModelEventsRegistered(model: Model, dependencies: EntityObserverDependencies) {

    if (model != null) {
        if (vueCompatibleModels.indexOf(model) >= 0) {
            return;
        }

        let Model$Model = dependencies.Model$Model;
        let VueModel$observeEntity = dependencies.VueModel$observeEntity;

        if (model instanceof Model$Model) {

            model.entityRegisteredEvent.subscribe(function(sender: Model, args: ModelEntityRegisteredEventArgs) {
                VueModel$observeEntity(args.entity);
            });

            // Make existing entities observable
            model.types.forEach(function(type: Type) {
                type.known().forEach(function(entity: Entity) {
                    VueModel$observeEntity(entity);
                });
            });

            model.propertyAddedEvent.subscribe(function(sender: Model, args: ModelPropertyAddedEventArgs) {
                ensurePropertyEventsRegistered(args.property, dependencies);
            });

            // Register for events for existing properties
            model.types.forEach(function(type) {
                type.properties.forEach((p: Property) => ensurePropertyEventsRegistered(p, dependencies));
            });

            vueCompatibleModels.push(model);
        } else {
            // TODO: warn?
        }
    }

}

var vueCompatibleProperties: Property[] = [];

function ensurePropertyEventsRegistered(property: Property, dependencies: EntityObserverDependencies) {

    if (property != null) {
        if (vueCompatibleProperties.indexOf(property) >= 0) {
            return;
        }

        let Vue$Dep = dependencies.Vue$Dep;
        let VueModel$observeEntity = dependencies.VueModel$observeEntity;
        let Model$Property = dependencies.Model$Property;

        if (property instanceof Model$Property) {

            property.accessedEvent.subscribe(function (entity: Entity, args: PropertyAccessEventArgs) {
                // Get or initialize the `Dep` object
                var propertyDep = getEntityPropertyDep(entity, args.property, dependencies);

                // Attach dependencies if something is watching
                if (Vue$Dep.target) {
                    propertyDep.depend();
 
                    var childOb = VueModel$observeEntity(args.value);

                    if (childOb) {
                        childOb.dep.depend();
                    } else if (Array.isArray(args.value)) {
                        // TODO: set up observability entities in child list if needed? -- ex: if args.property.isEntityList...
                        Vue$dependArray(args.value);
                    }
                }
            });

            property.changedEvent.subscribe(function (entity: Entity, args: PropertyChangeEventArgs) {
                // Get or initialize the `Dep` object
                var propertyDep = getEntityPropertyDep(entity, args.property, dependencies);

                // Make sure a new value that is an entity is observable
                VueModel$observeEntity(args.newValue);

                // Notify of property change
                propertyDep.notify();
            });

            vueCompatibleProperties.push(property);

        } else {
            // TODO: warn?
        }
    }

}

function getEntityPropertyDep(entity: Entity, property: Property, dependencies: EntityObserverDependencies): Dep {

    var depFieldName = property.fieldName + "_Dep";

    let Vue$Dep = dependencies.Vue$Dep;

    let dep: Dep;

    let target: any = entity;

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

function defineEntityObserver(dependencies: EntityObserverDependencies): EntityObserverConstructor {

    let Vue$Observer = dependencies.Vue$Observer;

    var ctor = function EntityObserver() {
        Vue$Observer.apply(this, arguments);
    };

    ctor.prototype = new Vue$Observer({});
    ctor.prototype.constructor = ctor;

    // Prevent walking of entities
    // TODO: Should we allow this to happen?
    ctor.prototype.walk = function EntityObserver$walk() {
        // Do nothing?
    };

    return dependencies.VueModel$EntityObserver = (ctor as unknown) as ObserverConstructor;
}

function defineObserveEntity(dependencies: EntityObserverDependencies): ObserveEntityMethod {

    return dependencies.VueModel$observeEntity = function VueModel$observeEntity(entity: Entity, asRootData: boolean = false): EntityObserver {

        let Model$Entity = dependencies.Model$Entity;
        let VueModel$EntityObserver = dependencies.VueModel$EntityObserver;

        if (entity instanceof Model$Entity) {
            var ob: EntityObserver;
            if (hasOwnProperty(entity, '__ob__') && getProp(entity, '__ob__') instanceof VueModel$EntityObserver) {
                ob = getProp(entity, '__ob__');
            } else {
                ob = new VueModel$EntityObserver(entity);
            }
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
        ensureModelEventsRegistered(model, dependencies);
        return dependencies;
    }

    defineEntityObserver(dependencies);

    defineObserveEntity(dependencies);

    ensureModelEventsRegistered(model, dependencies);

    dependencies.entitiesAreVueObservable = true;

    return dependencies;
}
