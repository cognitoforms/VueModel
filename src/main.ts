/// <reference path="../ref/vue.d.ts" />

import { ComponentConstructor } from "vue";
import { Model, ModelConstructor } from "../lib/model.js/src/model";
import { Entity, EntityConstructor } from "../lib/model.js/src/entity";
import { Property, PropertyConstructor } from "../lib/model.js/src/property";
import { VueModel$installPlugin } from "./vue-plugin";
import { VueModel } from "./vue-model";
import { FieldAdapter } from "./field-adapter";

let VueModel$Dependencies = {
    entitiesAreVueObservable: false,
    Model$Model: Model as ModelConstructor,
    Model$Entity: Entity as EntityConstructor,
    Model$Property: Property as PropertyConstructor,
};

// TODO: Do we need to take `toggleObserving()` into account?
// var shouldObserve = true;

let api = VueModel as any;

api.FieldAdapter = FieldAdapter;

api.install = function install(Vue: ComponentConstructor) {
    return VueModel$installPlugin(Vue, VueModel$Dependencies);
};

export default api;
