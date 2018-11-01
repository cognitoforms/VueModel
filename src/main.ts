import { ComponentConstructor } from "vue";
import * as Model from "Model";
import { VueModel$installPlugin } from "./vue-plugin";
import { VueModel } from "./vue-model";
import { FieldAdapter } from "./field-adapter";

let VueModel$Dependencies = {
    entitiesAreVueObservable: false,
    Model$Model: Model.Model,
    Model$Entity: Model.Entity,
    Model$Property: Model.Property,
};

// TODO: Do we need to take `toggleObserving()` into account?
// var shouldObserve = true;

let api = VueModel as any;

api.FieldAdapter = FieldAdapter;

api.install = function install(Vue: ComponentConstructor) {
    return VueModel$installPlugin(Vue, VueModel$Dependencies);
};

export default api;
