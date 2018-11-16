import Vue from "vue";
import { EntityConstructor, Entity } from "../lib/model.js/src/entity";
import { defineDollarSourceProperty, SourceBindingDependencies, getSourceBindingContainer } from "./source-binding";
import { isSourceAdapter, SourceAdapter } from "./source-adapter";
import { hasOwnProperty, debug } from "./helpers";
import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceIndexAdapter } from "./source-index-adapter";

export interface SourceProviderDependencies {
    Model$Entity: EntityConstructor;
}

function preprocessPropsToInterceptSource(vm: Vue) {

    let vm$private: any = vm as any;

    if (vm$private._source) {
        // TODO: Warn about _source already defined?
        return;
    }

    let props = vm.$options.propsData as any;

    if (hasOwnProperty(props, 'source')) {
        vm$private._source = props.source;
    }

}

function establishBindingSource(vm: Vue, dependencies: SourceBindingDependencies) {

    let vm$private: any = vm as any;

    if (vm$private._sourcePending) {
        // Detect re-entrance
        return;
    }

    if (!vm.$options.propsData) {
        return;
    }

    let props = vm.$options.propsData as any;

    if (!hasOwnProperty(props, 'source')) {
        return;
    }

    vm$private._sourcePending = true;

    let Model$Entity = dependencies.Model$Entity;

    debug("Found component of type '" + vm$private.$options._componentTag + "' with source '" + props.source + "'.");

    let sourceVm: Vue = getSourceBindingContainer(vm, dependencies, true);

    if (sourceVm) {

        let sourceVm$private = sourceVm as any;

        let source = sourceVm$private._source;
        if (typeof source === "string") {
            establishBindingSource(sourceVm, dependencies);
            source = sourceVm$private._source;
        }

        let sourceIndex: number = parseInt(props.source, 10);
        if (isNaN(sourceIndex)) {
            sourceIndex = null;
        }

        let sourceAdapter: SourceAdapter<any> = null;

        if (source instanceof Model$Entity) {
            debug("Found source entity of type <" + (source as Entity).meta.type.fullName + ">.");
            sourceAdapter = new SourcePathAdapter<Entity, any>(new SourceRootAdapter(source as Entity), props.source);
        } else if (isSourceAdapter(source)) {
            debug("Found source adapter <" + source + ">.");
            if (sourceIndex !== null) {
                sourceAdapter = new SourceIndexAdapter<Entity, any>(source as SourcePathAdapter<Entity, any>, parseInt(props.source, 10));
            } else {
                sourceAdapter = new SourcePathAdapter<Entity, any>(source as SourceAdapter<Entity>, props.source);
            }
        } else {
            // TODO: Warn about non-entity or adaper source context?
        }

        if (sourceAdapter != null) {
            defineDollarSourceProperty(vm, sourceAdapter);
            // proxySourceAdapterPropertiesOntoComponentInstance(vm, '_source', false, false);
        }

    } else {
        // TODO: Warn about absence of binding source?
    }

    delete vm$private['_sourcePending'];

}

export function SourceProviderMixin(dependencies: SourceProviderDependencies) {
    return {
        props: {
            source: {},
            sourceIndex: {
                type: Number,
                validator: function (value: number) {
                    return value >= 0;
                }
            }
        },
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

                // TODO: Who wins, props or data?
                // Vue proxies the data objects `Object.keys()` onto the component itself,
                // so that the data objects properties can be used directly in templates
                // proxySourceAdapterPropertiesOntoComponentInstance(vm, '_data', false, false);
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
