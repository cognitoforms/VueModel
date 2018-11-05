import Vue from "vue";
import { EntityConstructor } from "../lib/model.js/src/entity";
import { preprocessPropsToInterceptSource, defineDollarSourceProperty, proxySourceAdapterPropertiesOntoComponentInstance, establishBindingSource } from "./source-binding";
import { isSourceAdapter, SourceAdapter } from "./source-adapter";
import { hasOwnProperty } from "./helpers";

export interface SourceProviderDependencies {
    Model$Entity: EntityConstructor;
}

export function SourceProviderMixin(dependencies: SourceProviderDependencies) {
    return {
        props: ["source", "sourceIndex"],
        beforeCreate: function () {

            let vm: Vue = this as Vue;

            if (vm.$options.propsData) {
                // Intercept the `source` prop so that it can be marked as having a source
                // and lazily evaluated if needed, or detected by other components
                preprocessPropsToInterceptSource(vm);
            }
        },
        created: function () {

            let vm: Vue = this as Vue;

            let vm$private: any = vm as any;

            if (isSourceAdapter(vm$private._data)) {
                let sourceAdapter = vm$private._data as SourceAdapter<any>;

                // Define the `$source` property if not already defined
                defineDollarSourceProperty(vm, sourceAdapter);

                // Vue proxies the data objects `Object.keys()` onto the component itself,
                // so that the data objects properties can be used directly in templates
                proxySourceAdapterPropertiesOntoComponentInstance(vm, '_data');
            }

            if (vm.$options.propsData) {
                let props = vm.$options.propsData as any;
                if (hasOwnProperty(props, 'source')) {
                    establishBindingSource(vm, dependencies);
                }
            }

        }
    };
}
