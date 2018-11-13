import Vue from "vue";
import { EntityConstructor } from "../lib/model.js/src/interfaces";
import { getSourceBindingContainer, defineDollarSourceProperty } from "./source-binding";
import { isSourceAdapter, SourceAdapter } from "./source-adapter";
import { debug } from "./helpers";

export interface SourceConsumerDependencies {
    Model$Entity: EntityConstructor;
}

function establishBindingSource(vm: Vue, dependencies: SourceConsumerDependencies) {

    let sourceVm: Vue = getSourceBindingContainer(vm, dependencies);

    let sourceVm$private = sourceVm as any;
    if (sourceVm$private.$source) {
        let source = sourceVm$private.$source;
        if (isSourceAdapter(source)) {
            defineDollarSourceProperty(vm, source as SourceAdapter<any>);
        } else {
            // TODO: Warn about non-source adapter value of `$source`?
        }
    } else {
        // TODO: Warn about no source found?
    } 

}

export function SourceConsumerMixin(dependencies: SourceConsumerDependencies) {
    return {
        beforeCreate: function() {
            let vm: Vue = this as Vue;
            let vm$private = vm as any;
            
            let originalData = vm.$options.data;

            vm$private.$options.data = function() {

                // Establish the `$source` variable
                establishBindingSource(vm, dependencies);

                if (originalData) {
                    // Return the original data
                    if (originalData instanceof Function) {
                        debug("Data is a function, invoking...");
                        var dataFn = originalData as Function;
                        return dataFn.apply(this, arguments)
                    } else {
                        return originalData;
                    }
                } else {
                    return {};
                }
            };
        },
        created: function() {
            let vm: Vue = this as Vue;
            let vm$private = vm as any;
            if (!vm$private.$source) {
                establishBindingSource(vm, dependencies);
            }
        }
    };
};
