import Vue, { VueConstructor } from "vue";
import { Entity } from "../lib/model.js/src/entity";
import { debug, hasOwnProperty } from "./helpers";
import { Vue$isReserved, Vue$proxy } from "./vue-helpers";
import { makeEntitiesVueObservable, getEntityObserver, observeEntity } from "./vue-model-observability";

/**
 * Installs a global Vue mixin that hooks into component events to intercept model entities as component data and make necesary adjustments
 * @param Vue The Vue constructor/module object
 */
export function VueModel$installGlobalMixin(Vue: VueConstructor): void {

    Vue.mixin({
        beforeCreate: function VueModel$Plugin$beforeCreate() {

            let vm: Vue = this as Vue;

            if (vm.$options.data) {
                // Intercept data that is an entity or data function that returns an entity
                // so that this plugin can make the entity observable and create proxy properties
                preprocessDataToInterceptEntities(vm);
            }

        },
        created: function VueModel$Plugin$created() {

            let vm: Vue = this as Vue;

            let vm$private: any = vm as any;

            if (vm$private._entity) {
                let entity = vm$private._entity as Entity;

                if (!(entity.meta.type.model as any)._entitiesAreVueObservable) {
                    // Ensure that Model entities are observable objects compatible with Vue's observer
                    makeEntitiesVueObservable(vm$private._entity.meta.type.model);
                }

                getEntityObserver(vm$private._entity, true).ensureObservable();

                // Restore the data by attempting to emulate what would have happened to
                // the `data` object had it gone through normal component intialization
                restoreComponentEntityData(vm);

            }

        }
    });

}

function replaceEntityData(vm: Vue, data: any): any {

    let vm$private = vm as any;

    if (data != null && data instanceof Entity) {
        debug("Data is an entity, returning empty object...");
        vm$private._entity = data;
        return {};
    }

    return data;

}

function preprocessDataToInterceptEntities(vm: Vue): void {

    if (!vm.$options.data) {
        return;
    }

    if (vm.$options.data instanceof Function) {
        // The `.data` options is a function that will be invoked by Vue, so wrap it
        // to prevent Vue from getting an Entity prior to setting up Entity observability
        debug("Data is a function...wrapping to intercept the return value...");
        var dataFn = vm.$options.data;
        vm.$options.data = function () {
            return replaceEntityData(vm, dataFn.apply(this, arguments));
        };
    }
    else {
        // Don't let Vue from getting an Entity prior to setting up Entity observability
        vm.$options.data = replaceEntityData(vm, vm.$options.data);
    }

}

function restoreComponentEntityData(vm: Vue): void {

    let vm$private: any = vm as any;

    // Since the entity is now observable, go ahead and let the component see it
    // TODO: Is it necessary to somehow "merge" the object? Or, just not set the data
    //      field since we're going to do custom proxying of properties anyway?
    vm$private._data = vm$private._entity;

    // Vue proxies the data objects `Object.keys()` onto the component itself,
    // so that the data objects properties can be used directly in templates
    proxyEntityPropertiesOntoComponentInstance(vm, vm$private._entity);

    // The internal `observe()` method basically makes the given object observable,
    // (entities should already be at this point) but it also updates a `vmCount` counter
    observeEntity(vm$private._entity, true).ensureObservable();

    // Null out the field now that we've finished preparing the entity
    vm$private._entity = null;

}

function proxyEntityPropertiesOntoComponentInstance(vm: Vue, entity: Entity): void {
    // TODO: add proxies onto the component instance
    // proxy data on instance
    var properties = entity.meta.type.properties;
    var props = vm.$options.props;
    var methods = vm.$options.methods;
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];

        if (methods && hasOwnProperty(methods, property.name)) {
            debug("Property '" + property.name + "' is hidden by a component method with the same name.");
        }
        else if (props && hasOwnProperty(props, property.name)) {
            debug("Property '" + property.name + "' is hidden by a component prop with the same name.");
        }
        else if (!Vue$isReserved(property.name)) {
            Vue$proxy(vm, '_data', property.name);
        }
    }
}
