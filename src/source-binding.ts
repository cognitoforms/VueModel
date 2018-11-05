import Vue from "vue";
import { hasOwnProperty, debug } from "./helpers";
import { Entity, EntityConstructor } from "../lib/model.js/src/entity";
import { SourceAdapter, isSourceAdapter, isSourcePropertyAdapter } from "./source-adapter";
import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceIndexAdapter } from "./source-index-adapter";
import { Vue$proxy } from "./vue-helpers";

export interface SourceBindingDependencies {
    Model$Entity: EntityConstructor;
}

export function proxySourceAdapterPropertiesOntoComponentInstance(vm: Vue, rootKey: string) {

    let vm$private: any = vm as any;

    if (!hasOwnProperty(vm$private, rootKey)) {
        // TODO: Warn about missing value for `rootKey`?
        return;
    }

    if (!isSourceAdapter(vm$private[rootKey])) {
        // TODO: Lazily obtain source adapter if needed?
        // TODO: Warn about non-source adapter?
        return;
    }

    let sourceAdapter = vm$private[rootKey] as SourceAdapter<any>;

    debug("Proxying source adapter properties for <" + sourceAdapter + "> on component of type <" + (vm$private.$options._componentTag || "???") + ">.");

    if (isSourcePropertyAdapter(vm$private[rootKey])) {
        Vue$proxy(vm, rootKey, "label");
        Vue$proxy(vm, rootKey, "helptext");
    }

    Vue$proxy(vm, rootKey, "value");
    Vue$proxy(vm, rootKey, "displayValue");

}

export function preprocessPropsToInterceptSource(vm: Vue) {

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

export function defineDollarSourceProperty(vm: Vue, sourceAdapter: SourceAdapter<any>) {

    let vm$private: any = vm as any;

    if (!hasOwnProperty(vm$private, '_source') || !isSourceAdapter(vm$private._source)) {
        vm$private._source = sourceAdapter;
    }

    if (!hasOwnProperty(vm, '$source')) {
        Object.defineProperty(vm, '$source', {
            get: function() {
                return this._source;
            },
            set: function () {
                // TODO: Warn about setting `$source`?
            }
        });
    }

}

function getImplicitSource(vm: Vue, dependencies: SourceBindingDependencies, detect: boolean = false): Entity | SourceAdapter<any> {

    let vm$private = vm as any;

    let Model$Entity = dependencies.Model$Entity;

    if (hasOwnProperty(vm, '$source')) {
        // Source is explicit and has been established
        return null;
    }

    if (vm$private._source) {
        let source = vm$private._source;
        if (typeof source === "string") {
            // Source is explicit (but has not been established)
            return null;
        } else if (source instanceof Model$Entity) {
            // An entity was previously flagged as a potential implicit source
            return source as Entity;
        } else if (isSourceAdapter(source)) {
            // A source adapter was previously flagged as a potential implicit source
            return source as SourceAdapter<any>;
        }

        // Source of unknown type
        return null;
    }

    if (detect) {
        let data = vm$private._data;
        if (data) {
            if (data instanceof Model$Entity) {
                debug("Found implicit source as data of type <" + (data as Entity).meta.type.fullName + "> on component of type <" + (vm$private.$options._componentTag || "???") + ">.");
                vm$private._source = data;
                return data;
            } else if (isSourceAdapter(data)) {
                debug("Found implicit source as source adapter <" + data + "> on component of type <" + (vm$private.$options._componentTag || "???") + ">.");
                vm$private._source = data;
                return data;
            }
        }

        if (vm$private._entity) {
            let entity = vm$private._entity;
            if (entity instanceof Model$Entity) {
                // Mark the entity as a potential implicit source
                debug("Found implicit source as pending entity of type <" + (entity as Entity).meta.type.fullName + "> on component of type <" + (vm$private.$options._componentTag || "???") + ">.");
                vm$private._source = entity;
                return entity;
            }
        }
    }

}

export function getSourceBindingContainer(vm: Vue, dependencies: SourceBindingDependencies, detectImplicitSource: boolean = false): Vue {

    let firstImplicitSourceVm: Vue = null;
    let firstImplicitSourceVmLevel = -1;

    let Model$Entity = dependencies.Model$Entity;

    for (let parentVm: Vue = vm.$parent, parentLevel = 1; parentVm != null; parentVm = parentVm.$parent, parentLevel += 1) {

        let parentVm$private = parentVm as any;

        let parentSource = parentVm$private.$source;
        if (parentSource) {
            // if (process.env.NODE_ENV === "development") {
            if (typeof parentSource === "string") {
                debug("Found pending source on level " + parentLevel + " parent component of type <" + (parentVm$private.$options._componentTag || "???") + ">.");
            } else if (isSourceAdapter(parentSource)) {
                debug("Found established source on level " + parentLevel + " parent component of type <" + (parentVm$private.$options._componentTag || "???") + ">.");
            } else {
                debug("Found unknown source on level " + parentLevel + " parent component of type <" + (parentVm$private.$options._componentTag || "???") + ">.");
            }
            // }

            return parentVm;
        } else if (detectImplicitSource) {
            let implicitSource = getImplicitSource(parentVm, dependencies, true);
            if (implicitSource !== undefined && !firstImplicitSourceVm) {
                firstImplicitSourceVm = parentVm;
                firstImplicitSourceVmLevel = parentLevel;
            }
        }
    }

    if (detectImplicitSource && firstImplicitSourceVm) {
        let implicitSource = getImplicitSource(firstImplicitSourceVm, dependencies);
        if (implicitSource instanceof Model$Entity) {
            debug("Found implicit source on level " + firstImplicitSourceVmLevel + " parent component of type <" + ((firstImplicitSourceVm as any).$options._componentTag || "???") + ">.");
            return firstImplicitSourceVm;
        }
    }

}

export function establishBindingSource(vm: Vue, dependencies: SourceBindingDependencies) {

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
            proxySourceAdapterPropertiesOntoComponentInstance(vm, '_source');
        }

    } else {
        // TODO: Warn about absence of binding source?
    }

    delete vm$private['_sourcePending'];

}
