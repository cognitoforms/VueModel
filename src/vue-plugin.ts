import { ComponentConstructor, ObserverConstructor, DepConstructor, Component } from "vue";
import { ModelConstructor, Entity, EntityConstructor, Property, PropertyConstructor } from "exomodel";
import { debug, hasOwnProperty } from "./helpers";
import { VueExoModel$makeEntitiesVueObservable, EntityObserverDependencies } from "./entity-observer";
import { Vue$isReserved } from "./vue-helpers";

export interface VuePluginDependencies {
    entitiesAreVueObservable: boolean;
    ExoModel$Model: ModelConstructor;
    ExoModel$Entity: EntityConstructor;
    ExoModel$Property: PropertyConstructor;
    Vue$Observer?: ObserverConstructor;
    Vue$Dep?: DepConstructor;
}

function VueExoModel$proxyEntityPropertyOntoComponentInstance(vm: Component, rootKey: string, property: Property) {
    debug("BEGIN: VueExoModel$proxyEntityPropertyOntoComponentInstance");

    Object.defineProperty(vm, property.name, {
        configurable: true,
        enumerable: true,
        get: function VueExoModel$proxyPropertyGet() {
            return this[rootKey][property.name];
        },
        set: function VueExoModel$proxyPropertySet(value) {
            this[rootKey][property.name] = value;
        }
    });

    debug("END: VueExoModel$proxyEntityPropertyOntoComponentInstance");
}

function VueExoModel$proxyEntityPropertiesOntoComponentInstance(entity: Entity, vm: Component) {
    debug("BEGIN: VueExoModel$proxyEntityPropertiesOntoComponentInstance");

    // TODO: add proxies onto the component instance
    // proxy data on instance
    var properties = entity.meta.type.properties;
    var props = vm.$options.props;
    var methods = vm.$options.methods;
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];

        if (methods && hasOwnProperty(methods, property.name)) {
            debug("Property '" + property.name + "' is hidden by a component method with the same name.");
        } else if (props && hasOwnProperty(props, property.name)) {
            debug("Property '" + property.name + "' is hidden by a component prop with the same name.");
        } else if (!Vue$isReserved(property.name)) {
            VueExoModel$proxyEntityPropertyOntoComponentInstance(vm, '_data', property);
        }
    }

    debug("BEGIN: VueExoModel$proxyEntityPropertiesOntoComponentInstance");
}

export function VueExoModel$installPlugin(Vue: ComponentConstructor, dependencies: VuePluginDependencies) {

    let ExoModel$Entity: EntityConstructor = dependencies.ExoModel$Entity;

    Vue.mixin({
        beforeCreate: function VueExoModel$beforeCreate() {
            debug("BEGIN: VueExoModel$beforeCreate");

            var vm = this;

            var replaceEntityData = function (data: any) {
                if (data != null && data instanceof ExoModel$Entity) {
                    debug("Data is an entity, returning empty object...");
                    vm._entity = data;
                    return {};
                }

                return data;
            };

            if (vm.$options.data) {
                if (vm.$options.data instanceof Function) {
                    // The `.data` options is a function that will be invoked by Vue, so wrap it
                    // to prevent Vue from getting an Entity prior to setting up Entity observability
                    debug("Data is a function...wrapping to intercept the return value...");
                    var dataFn = vm.$options.data;
                    vm.$options.data = function () {
                        return replaceEntityData(dataFn.apply(this, arguments));
                    };
                } else {
                    let entitiesAreVueObservable = dependencies.entitiesAreVueObservable;
                    if (!entitiesAreVueObservable) {
                        // Don't let Vue from getting an Entity prior to setting up Entity observability
                        vm.$options.data = replaceEntityData(vm.$options.data);
                    }
                }
            }

            debug("END: VueExoModel$beforeCreate");
        },
        created: function VueExoModel$created() {
            debug("BEGIN: VueExoModel$created");

            var vm = this;

            if (vm._entity) {

                dependencies.Vue$Observer = vm._data.__ob__.constructor;

                dependencies.Vue$Dep = vm._data.__ob__.dep.constructor;

                // Ensure that ExoModel entities are observable objects compatible with Vue's observer
                // VueExoModel$makeEntitiesVueObservable(vm._entity.meta.type.model, { ExoModel$Model, ExoModel$Entity, Vue$Observer, Vue$Dep });
                let exports = VueExoModel$makeEntitiesVueObservable(vm._entity.meta.type.model, dependencies as EntityObserverDependencies);

                let VueExoModel$observeEntity = exports.VueExoModel$observeEntity;

                // What follows is an attempt to emulate what would have happened to
                // the `data` object had it gone through normal component intialization

                // Since the entity is now observable, go ahead and let the component see it
                vm._data = vm._entity;

                // Vue proxies the data objects `Object.keys()` onto the component itself,
                // so that the data objects properties can be used directly in templates
                VueExoModel$proxyEntityPropertiesOntoComponentInstance(vm._entity, vm);

                // The internal `observe()` method basically makes the given object observable,
                // (entities should already be at this point) but it also updates a `vmCount` counter
                VueExoModel$observeEntity(vm._entity, true);

                // Null out the field now that we've finished preparing the entity
                vm._entity = null;

            }

            debug("END: VueExoModel$created");
        }
    });

}
