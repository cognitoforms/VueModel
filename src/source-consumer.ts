import Vue from "vue";
import { EntityConstructor } from "../lib/model.js/src/entity";
import { getSourceBindingContainer, defineDollarSourceProperty, proxySourceAdapterPropertiesOntoComponentInstance } from "./source-binding";
import { isSourceAdapter } from "./source-adapter";

export interface SourceConsumerDependencies {
    Model$Entity: EntityConstructor;
}

export function SourceConsumerMixin(dependencies: SourceConsumerDependencies) {
    return {
        created: function() {
            
            let vm: Vue = this as Vue;

            let sourceVm: Vue = getSourceBindingContainer(vm, dependencies);

            let sourceVm$private = sourceVm as any;
            if (sourceVm$private.$source) {
                let source = sourceVm$private.$source;
                if (isSourceAdapter(source)) {
                    defineDollarSourceProperty(vm, sourceVm$private.$source);
                    proxySourceAdapterPropertiesOntoComponentInstance(vm, '_source', false, false);
                } else {
                    // TODO: Warn about non-source adapter value of `$source`?
                }
            } else {
                // TODO: Warn about no source found?
            }

        }
    };
};
