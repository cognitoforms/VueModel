import { ComponentConstructor, ObserverConstructor, DepConstructor, Component } from "vue";
import { ModelConstructor, Entity, EntityConstructor, Property, PropertyConstructor } from "model";
import { debug, hasOwnProperty } from "./helpers";
import { VueModel$makeEntitiesVueObservable, EntityObserverDependencies } from "./entity-observer";
import { Vue$isReserved } from "./vue-helpers";

export interface VuePluginDependencies {
    entitiesAreVueObservable: boolean;
    Model$Model: ModelConstructor;
    Model$Entity: EntityConstructor;
    Model$Property: PropertyConstructor;
    Vue$Observer?: ObserverConstructor;
    Vue$Dep?: DepConstructor;
}

function VueModel$proxyEntityPropertyOntoComponentInstance(vm: Component, rootKey: string, property: Property) {
    debug("BEGIN: VueModel$proxyEntityPropertyOntoComponentInstance");

    Object.defineProperty(vm, property.name, {
        configurable: true,
        enumerable: true,
        get: function VueModel$proxyPropertyGet() {
            return this[rootKey][property.name];
        },
        set: function VueModel$proxyPropertySet(value) {
            this[rootKey][property.name] = value;
        }
    });

    debug("END: VueModel$proxyEntityPropertyOntoComponentInstance");
}

function VueModel$proxyEntityPropertiesOntoComponentInstance(entity: Entity, vm: Component) {
    debug("BEGIN: VueModel$proxyEntityPropertiesOntoComponentInstance");

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
            VueModel$proxyEntityPropertyOntoComponentInstance(vm, '_data', property);
        }
    }

    debug("BEGIN: VueModel$proxyEntityPropertiesOntoComponentInstance");
}

export function VueModel$installPlugin(Vue: ComponentConstructor, dependencies: VuePluginDependencies) {

    let Model$Entity: EntityConstructor = dependencies.Model$Entity;

    Vue.mixin({
        beforeCreate: function VueModel$beforeCreate() {
            debug("BEGIN: VueModel$beforeCreate");

            var vm = this;

            var replaceEntityData = function (data: any) {
                if (data != null && data instanceof Model$Entity) {
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

            debug("END: VueModel$beforeCreate");
        },
        created: function VueModel$created() {
            debug("BEGIN: VueModel$created");

            var vm = this;

            if (vm._entity) {

                dependencies.Vue$Observer = vm._data.__ob__.constructor;

                dependencies.Vue$Dep = vm._data.__ob__.dep.constructor;

                // Ensure that Model entities are observable objects compatible with Vue's observer
                // VueModel$makeEntitiesVueObservable(vm._entity.meta.type.model, { Model$Model, Model$Entity, Vue$Observer, Vue$Dep });
                let exports = VueModel$makeEntitiesVueObservable(vm._entity.meta.type.model, dependencies as EntityObserverDependencies);

                let VueModel$observeEntity = exports.VueModel$observeEntity;

                // What follows is an attempt to emulate what would have happened to
                // the `data` object had it gone through normal component intialization

                // Since the entity is now observable, go ahead and let the component see it
                vm._data = vm._entity;

                // Vue proxies the data objects `Object.keys()` onto the component itself,
                // so that the data objects properties can be used directly in templates
                VueModel$proxyEntityPropertiesOntoComponentInstance(vm._entity, vm);

                // The internal `observe()` method basically makes the given object observable,
                // (entities should already be at this point) but it also updates a `vmCount` counter
                VueModel$observeEntity(vm._entity, true);

                // Null out the field now that we've finished preparing the entity
                vm._entity = null;

            }

            debug("END: VueModel$created");
        }
    });

}
