/// <reference path="../ref/vue.d.ts" />
/// <reference path="../ref/model.d.ts" />

import { Model, ModelConstructor, Entity, EntityConstructor, Type, Property, PropertyConstructor, ModelEntityRegisteredEventArgs, ModelPropertyAddedEventArgs, PropertyAccessEventArgs, PropertyChangeEventArgs } from "Model";
import { Observer, ObserverConstructor, DepConstructor, Dep } from "vue";
import { debug, hasOwnProperty, getProp } from "./helpers";
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

function VueModel$ensureModelEventsRegistered(model: Model, dependencies: EntityObserverDependencies) {
    debug("BEGIN: VueModel$ensureModelEventsRegistered");

    if (model != null) {
        if (vueCompatibleModels.indexOf(model) >= 0) {
            debug("END: VueModel$ensureModelEventsRegistered");
            return;
        }

        let Model$Model = dependencies.Model$Model;
        let Model$Property = dependencies.Model$Property;
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
                VueModel$ensurePropertyEventsRegistered(args.property, dependencies);
            });

            // Register for events for existing properties
            model.types.forEach(function(type) {
                type.properties.forEach((p: Property) => VueModel$ensurePropertyEventsRegistered(p, dependencies));
            });

            vueCompatibleModels.push(model);
        } else {
            // TODO: warn?
        }
    }

    debug("BEGIN: VueModel$ensureModelEventsRegistered");
}

var vueCompatibleProperties: Property[] = [];

function VueModel$ensurePropertyEventsRegistered(property: Property, dependencies: EntityObserverDependencies) {
    debug("BEGIN: VueModel$ensurePropertyEventsRegistered");

    if (property != null) {
        if (vueCompatibleProperties.indexOf(property) >= 0) {
            debug("END: VueModel$ensurePropertyEventsRegistered");
            return;
        }

        let Vue$Dep = dependencies.Vue$Dep;
        let VueModel$observeEntity = dependencies.VueModel$observeEntity;
        let Model$Property = dependencies.Model$Property;

        if (property instanceof Model$Property) {

            property.accessedEvent.subscribe(function (entity: Entity, args: PropertyAccessEventArgs) {
                // Get or initialize the `Dep` object
                var propertyDep = VueModel$getEntityPropertyDep(entity, args.property, dependencies);

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
                var propertyDep = VueModel$getEntityPropertyDep(entity, args.property, dependencies);

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

    debug("BEGIN: VueModel$ensurePropertyEventsRegistered");
}

function VueModel$getEntityPropertyDep(entity: Entity, property: Property, dependencies: EntityObserverDependencies): Dep {
    debug("BEGIN: VueModel$getEntityPropertyDep");

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

    debug("END: VueModel$getEntityPropertyDep");

    return dep;
}

function VueModel$defineEntityObserver(dependencies: EntityObserverDependencies): EntityObserverConstructor {
    debug("BEGIN: VueModel$defineEntityObserver");

    let Vue$Observer = dependencies.Vue$Observer;

    var ctor = function EntityObserver() {
        Vue$Observer.apply(this, arguments);
    };

    ctor.prototype = new Vue$Observer({});
    ctor.prototype.constructor = ctor;

    // Prevent walking of entities
    // TODO: Should we allow this to happen?
    ctor.prototype.walk = function EntityObserver$walk() {
        debug("BEGIN: EntityObserver$walk");
        debug("END: EntityObserver$walk");
    };

    debug("END: VueModel$defineEntityObserver");

    return dependencies.VueModel$EntityObserver = (ctor as unknown) as ObserverConstructor;
}

function VueModel$defineObserveEntity(dependencies: EntityObserverDependencies): ObserveEntityMethod {

    return dependencies.VueModel$observeEntity = function VueModel$observeEntity(entity: Entity, asRootData: boolean = false): EntityObserver {
        debug("BEGIN: VueModel$observeEntity");

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

        debug("END: VueModel$observeEntity");
    };

}

export function VueModel$makeEntitiesVueObservable(model: Model, dependencies: EntityObserverDependencies): EntityObserverDependencies {
    debug("BEGIN: VueModel$ensureEntitiesAreVueObservable");

    let entitiesAreVueObservable = dependencies.entitiesAreVueObservable;

    if (entitiesAreVueObservable) {
        VueModel$ensureModelEventsRegistered(model, dependencies);
        debug("END: VueModel$ensureEntitiesAreVueObservable");
        return dependencies;
    }

    VueModel$defineEntityObserver(dependencies);

    VueModel$defineObserveEntity(dependencies);

    VueModel$ensureModelEventsRegistered(model, dependencies);

    dependencies.entitiesAreVueObservable = true;

    debug("END: VueModel$ensureEntitiesAreVueObservable");

    return dependencies;
}
