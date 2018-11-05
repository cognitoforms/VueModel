import { VueConstructor } from "./vue-internals";
import { Model, ModelConstructor } from "../lib/model.js/src/model";
import { Entity, EntityConstructor } from "../lib/model.js/src/entity";
import { Property, PropertyConstructor } from "../lib/model.js/src/property";
import { VueModel$installPlugin } from "./vue-plugin";
import { VueModel } from "./vue-model";
import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceIndexAdapter } from "./source-index-adapter";
import { SourceProviderMixin } from "./source-provider";
import { SourceConsumerMixin } from "./source-consumer";

interface CommonDependencies {
    entitiesAreVueObservable: boolean;
    Model$Model: ModelConstructor;
    Model$Entity: EntityConstructor;
    Model$Property: PropertyConstructor;
}

let dependencies: CommonDependencies = {
    entitiesAreVueObservable: false,
    Model$Model: Model as ModelConstructor,
    Model$Entity: Entity as EntityConstructor,
    Model$Property: Property as PropertyConstructor,
};

// TODO: Do we need to take `toggleObserving()` into account?
// var shouldObserve = true;

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

export default api;
