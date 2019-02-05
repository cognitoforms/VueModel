import { default as Vue, PluginObject } from "vue";
import { ensureVueInternalTypes } from "./vue-internals";
import { VueModel$installPlugin } from "./vue-plugin";
import { VueModel, VueModelConstructor } from "./vue-model";
import { SourceRootAdapter, SourceRootAdapterConstructor } from "./source-root-adapter";
import { SourcePathAdapter, SourcePathAdapterConstructor } from "./source-path-adapter";
import { SourceIndexAdapter, SourceIndexAdapterConstructor } from "./source-index-adapter";
import { SourceProviderMixin } from "./source-provider";
import { SourceConsumerMixin } from "./source-consumer";

// TODO: Do we need to take `toggleObserving()` into account?
// var shouldObserve = true;

export interface VueModelExports {
    SourceRootAdapter: SourceRootAdapterConstructor,
    SourcePathAdapter: SourcePathAdapterConstructor,
    SourceIndexAdapter: SourceIndexAdapterConstructor,
    mixins: VueModelMixins,
}

export interface VueModelMixins {
    SourceProvider: any;
    SourceConsumer: any;
}

let api = VueModel as any;

api.SourceRootAdapter = SourceRootAdapter;
api.SourcePathAdapter = SourcePathAdapter;
api.SourceIndexAdapter = SourceIndexAdapter;

// TODO: Implement source-binding mixins
api.mixins = {
    SourceProvider: SourceProviderMixin,
    SourceConsumer: SourceConsumerMixin,
};

api.install = function install(vue: typeof Vue, options?: any) {
    ensureVueInternalTypes(vue);
    return VueModel$installPlugin(vue);
};

import "../lib/model.js/src/legacy-api";

export default api as VueModelConstructor & VueModelExports & PluginObject<any>;
