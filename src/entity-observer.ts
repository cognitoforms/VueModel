import { Model, ModelConstructor, Entity, EntityConstructor, Type, Property, PropertyConstructor, ModelEntityRegisteredEventArgs, ModelPropertyAddedEventArgs, PropertyAccessEventArgs, PropertyChangeEventArgs } from "exomodel";
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
    ExoModel$Model: ModelConstructor;
    ExoModel$Entity: EntityConstructor;
    ExoModel$Property: PropertyConstructor;
    Vue$Observer: ObserverConstructor;
    Vue$Dep: DepConstructor;
    VueExoModel$EntityObserver?: EntityObserverConstructor;
    VueExoModel$observeEntity?: ObserveEntityMethod;
}

var vueCompatibleModels: Model[] = [];

function VueExoModel$ensureModelEventsRegistered(model: Model, dependencies: EntityObserverDependencies) {
    debug("BEGIN: VueExoModel$ensureModelEventsRegistered");

    if (model != null) {
        if (vueCompatibleModels.indexOf(model) >= 0) {
            debug("END: VueExoModel$ensureModelEventsRegistered");
            return;
        }

        let ExoModel$Model = dependencies.ExoModel$Model;
        let ExoModel$Property = dependencies.ExoModel$Property;
        let VueExoModel$observeEntity = dependencies.VueExoModel$observeEntity;

        if (model instanceof ExoModel$Model) {

            model.entityRegisteredEvent.subscribe(function(sender: Model, args: ModelEntityRegisteredEventArgs) {
                VueExoModel$observeEntity(args.entity);
            });

            // Make existing entities observable
            model.types.forEach(function(type: Type) {
                type.known().forEach(function(entity: Entity) {
                    VueExoModel$observeEntity(entity);
                });
            });

            model.propertyAddedEvent.subscribe(function(sender: Model, args: ModelPropertyAddedEventArgs) {
                VueExoModel$ensurePropertyEventsRegistered(args.property, dependencies);
            });

            // Register for events for existing properties
            model.types.forEach(function(type) {
                type.properties.forEach((p: Property) => VueExoModel$ensurePropertyEventsRegistered(p, dependencies));
            });

            vueCompatibleModels.push(model);
        } else {
            // TODO: warn?
        }
    }

    debug("BEGIN: VueExoModel$ensureModelEventsRegistered");
}

var vueCompatibleProperties: Property[] = [];

function VueExoModel$ensurePropertyEventsRegistered(property: Property, dependencies: EntityObserverDependencies) {
    debug("BEGIN: VueExoModel$ensurePropertyEventsRegistered");

    if (property != null) {
        if (vueCompatibleProperties.indexOf(property) >= 0) {
            debug("END: VueExoModel$ensurePropertyEventsRegistered");
            return;
        }

        let Vue$Dep = dependencies.Vue$Dep;
        let VueExoModel$observeEntity = dependencies.VueExoModel$observeEntity;
        let ExoModel$Property = dependencies.ExoModel$Property;

        if (property instanceof ExoModel$Property) {

            property.accessedEvent.subscribe(function (entity: Entity, args: PropertyAccessEventArgs) {
                // Get or initialize the `Dep` object
                var propertyDep = VueExoModel$getEntityPropertyDep(entity, args.property, dependencies);

                // Attach dependencies if something is watching
                if (Vue$Dep.target) {
                    propertyDep.depend();
 
                    var childOb = VueExoModel$observeEntity(args.value);

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
                var propertyDep = VueExoModel$getEntityPropertyDep(entity, args.property, dependencies);

                // Make sure a new value that is an entity is observable
                VueExoModel$observeEntity(args.newValue);

                // Notify of property change
                propertyDep.notify();
            });

            vueCompatibleProperties.push(property);

        } else {
            // TODO: warn?
        }
    }

    debug("BEGIN: VueExoModel$ensurePropertyEventsRegistered");
}

function VueExoModel$getEntityPropertyDep(entity: Entity, property: Property, dependencies: EntityObserverDependencies): Dep {
    debug("BEGIN: VueExoModel$getEntityPropertyDep");

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

    debug("END: VueExoModel$getEntityPropertyDep");

    return dep;
}

function VueExoModel$defineEntityObserver(dependencies: EntityObserverDependencies): EntityObserverConstructor {
    debug("BEGIN: VueExoModel$defineEntityObserver");

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

    debug("END: VueExoModel$defineEntityObserver");

    return dependencies.VueExoModel$EntityObserver = (ctor as unknown) as ObserverConstructor;
}

function VueExoModel$defineObserveEntity(dependencies: EntityObserverDependencies): ObserveEntityMethod {

    return dependencies.VueExoModel$observeEntity = function VueExoModel$observeEntity(entity: Entity, asRootData: boolean = false): EntityObserver {
        debug("BEGIN: VueExoModel$observeEntity");

        let ExoModel$Entity = dependencies.ExoModel$Entity;
        let VueExoModel$EntityObserver = dependencies.VueExoModel$EntityObserver;

        if (entity instanceof ExoModel$Entity) {
            var ob: EntityObserver;
            if (hasOwnProperty(entity, '__ob__') && getProp(entity, '__ob__') instanceof VueExoModel$EntityObserver) {
                ob = getProp(entity, '__ob__');
            } else {
                ob = new VueExoModel$EntityObserver(entity);
            }
            if (asRootData && ob) {
                ob.vmCount++;
            }
            return ob;
        } else {
            // TODO: Warn about attempting to observe non-entity?
        }

        debug("END: VueExoModel$observeEntity");
    };

}

export function VueExoModel$makeEntitiesVueObservable(model: Model, dependencies: EntityObserverDependencies): EntityObserverDependencies {
    debug("BEGIN: VueExoModel$ensureEntitiesAreVueObservable");

    let entitiesAreVueObservable = dependencies.entitiesAreVueObservable;

    if (entitiesAreVueObservable) {
        VueExoModel$ensureModelEventsRegistered(model, dependencies);
        debug("END: VueExoModel$ensureEntitiesAreVueObservable");
        return dependencies;
    }

    VueExoModel$defineEntityObserver(dependencies);

    VueExoModel$defineObserveEntity(dependencies);

    VueExoModel$ensureModelEventsRegistered(model, dependencies);

    dependencies.entitiesAreVueObservable = true;

    debug("END: VueExoModel$ensureEntitiesAreVueObservable");

    return dependencies;
}
