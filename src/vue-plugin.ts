import Vue from "vue";
import { VueConstructor, ObserverConstructor, DepConstructor } from "./vue-internals";
import { VueModel$makeEntitiesVueObservable, EntityObserverDependencies } from "./entity-observer";
import { preprocessDataToInterceptEntities, restoreComponentEntityData, VuePluginEntitiesDependencies } from "./vue-plugin-entities";
import { EntityConstructor } from "../lib/model.js/src/entity";

export interface VuePluginDependencies {
    entitiesAreVueObservable: boolean;
    Model$Entity: EntityConstructor;
    Vue$Observer?: ObserverConstructor;
    Vue$Dep?: DepConstructor;
}

function interceptInternalTypes(obj: any, dependencies: VuePluginDependencies) {

    if (!dependencies.Vue$Observer && obj.__ob__) {
        dependencies.Vue$Observer = obj.__ob__.constructor;
    }

    if (!dependencies.Vue$Dep && obj.__ob__ && obj.__ob__.dep) {
        dependencies.Vue$Dep = obj.__ob__.dep.constructor;
    }

}

export function VueModel$installPlugin(Vue: VueConstructor, dependencies: VuePluginDependencies) {

    Vue.mixin({
        beforeCreate: function VueModel$Plugin$beforeCreate() {

            let vm: Vue = this as Vue;

            if (vm.$options.data) {
                // Intercept data that is an entity or data function that returns an entity
                // so that this plugin can make the entity observable and create proxy properties
                preprocessDataToInterceptEntities(vm, dependencies);
            }

            // if (vm.$options.propsData) {
            //     // Intercept the `source` prop so that it can be marked as having a source
            //     // and lazily evaluated if needed, or detected by other components
            //     preprocessPropsToInterceptSource(vm);
            // }

        },
        created: function VueModel$Plugin$created() {

            let vm: Vue = this as Vue;

            let vm$private: any = vm as any;

            if (vm$private._data) {
                interceptInternalTypes(vm$private._data, dependencies);
            }

            if (vm$private._entity) {
                interceptInternalTypes(vm$private._entity, dependencies);

                if (!dependencies.entitiesAreVueObservable) {
                    // Ensure that Model entities are observable objects compatible with Vue's observer
                    VueModel$makeEntitiesVueObservable(vm$private._entity.meta.type.model, dependencies as EntityObserverDependencies);
                }

                // Restore the data by attempting to emulate what would have happened to
                // the `data` object had it gone through normal component intialization
                restoreComponentEntityData(vm, dependencies as VuePluginEntitiesDependencies);

            }

            // if (isSourceAdapter(vm$private._data)) {
            //     let sourceAdapter = vm$private._data as SourceAdapter<any>;

            //     // Define the `$source` property if not already defined
            //     defineDollarSourceProperty(vm, sourceAdapter);

            //     // Vue proxies the data objects `Object.keys()` onto the component itself,
            //     // so that the data objects properties can be used directly in templates
            //     proxySourceAdapterPropertiesOntoComponentInstance(vm, '_data');
            // }

            // Handle computed `source` property that is of type `SourceAdapter`?

            // if (vm.$options.propsData) {
            //     let props = vm.$options.propsData as any;
            //     if (hasOwnProperty(props, 'source')) {
            //         establishBindingSource(vm, dependencies as VuePluginSourceBindingDependencies);
            //     }
            // }

        }
    });

}
