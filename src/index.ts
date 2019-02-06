import { default as Vue, PluginObject } from "vue";
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

export interface VueModelNamespace {
    SourceRootAdapter: SourceRootAdapterConstructor,
    SourcePathAdapter: SourcePathAdapterConstructor,
    SourceIndexAdapter: SourceIndexAdapterConstructor,
    mixins: VueModelMixins,
}

export interface VueModelMixins {
    SourceProvider: any;
    SourceConsumer: any;
}

import "../lib/model.js/src/legacy-api";

export default VueModel;