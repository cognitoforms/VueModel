import Vue from "vue";
import { getSourceBindingContainer, defineDollarSourceProperty } from "./source-binding";
import { isSourceAdapter, SourceAdapter } from "./source-adapter";
import { debug } from "./helpers";

function establishBindingSource(vm: Vue) {

    let sourceVm: Vue = getSourceBindingContainer(vm);

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

export const SourceConsumerMixin = {
    beforeCreate: function() {
        let vm: Vue = this as Vue;
        let vm$private = vm as any;
        
        let originalData = vm.$options.data;

        vm$private.$options.data = function() {

            // Establish the `$source` variable
            establishBindingSource(vm);

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
            establishBindingSource(vm);
        }
    }
};
