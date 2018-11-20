import { VueConstructor } from "vue";
import { ensureVueInternalTypes } from "./vue-internals";
import { VueModel$installPlugin } from "./vue-plugin";
import { VueModel } from "./vue-model";
import { SourceRootAdapter, SourceRootAdapterConstructor } from "./source-root-adapter";
import { SourcePathAdapter, SourcePathAdapterConstructor } from "./source-path-adapter";
import { SourceIndexAdapter, SourceIndexAdapterConstructor } from "./source-index-adapter";
import { SourceProviderMixin } from "./source-provider";
import { SourceConsumerMixin } from "./source-consumer";

// TODO: Do we need to take `toggleObserving()` into account?
// var shouldObserve = true;

export interface VueModelApi extends VueModel {
    SourceRootAdapter: SourceRootAdapterConstructor,
    SourcePathAdapter: SourcePathAdapterConstructor,
    SourceIndexAdapter: SourceIndexAdapterConstructor,
    mixins: VueModelMixins,
    install: (Vue: VueConstructor) => void;
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

api.install = function install(Vue: VueConstructor) {
    ensureVueInternalTypes(Vue);
    return VueModel$installPlugin(Vue);
};

import "../lib/model.js/src/legacy-api";

export default api as VueModelApi;
