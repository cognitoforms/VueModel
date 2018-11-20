import Vue, { VueConstructor } from "vue";
import { makeEntitiesVueObservable, getEntityObserver } from "./entity-observer";
import { preprocessDataToInterceptEntities, restoreComponentEntityData } from "./vue-plugin-entities";
import { Entity } from "../lib/model.js/src/entity";

export function VueModel$installPlugin(Vue: VueConstructor) {

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
