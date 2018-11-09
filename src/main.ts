import { VueConstructor } from "./vue-internals";
import { Model } from "../lib/model.js/src/model";
import { ModelConstructor } from "../lib/model.js/src/interfaces";
import { Type } from "../lib/model.js/src/type";
import { TypeConstructor } from "../lib/model.js/src/interfaces";
import { Property } from "../lib/model.js/src/property";
import { PropertyConstructor } from "../lib/model.js/src/interfaces";
import { Entity } from "../lib/model.js/src/entity";
import { EntityConstructor } from "../lib/model.js/src/interfaces";
import { VueModel$installPlugin } from "./vue-plugin";
import { VueModel } from "./vue-model";
import { SourceRootAdapter, SourceRootAdapterConstructor } from "./source-root-adapter";
import { SourcePathAdapter, SourcePathAdapterConstructor } from "./source-path-adapter";
import { SourceIndexAdapter, SourceIndexAdapterConstructor } from "./source-index-adapter";
import { SourceProviderMixin } from "./source-provider";
import { SourceConsumerMixin } from "./source-consumer";

interface CommonDependencies {
    entitiesAreVueObservable: boolean;
    Model$Model: ModelConstructor;
    Model$Type: TypeConstructor;
    Model$Property: PropertyConstructor;
    Model$Entity: EntityConstructor;
}

let dependencies: CommonDependencies = {
    entitiesAreVueObservable: false,
    Model$Model: Model as ModelConstructor,
    Model$Type: Type as TypeConstructor,
    Model$Property: Property as PropertyConstructor,
    Model$Entity: Entity as EntityConstructor,
};

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
    SourceProvider: SourceProviderMixin(dependencies),
    SourceConsumer: SourceConsumerMixin(dependencies),
};

api.install = function install(Vue: VueConstructor) {
    return VueModel$installPlugin(Vue, dependencies);
};

export default api as VueModelApi;
