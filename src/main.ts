import { ComponentConstructor } from "vue";
import { ExoModelModule } from "exomodel";
import { VueExoModel$installPlugin } from "./vue-plugin";

export { FieldAdapter } from "./field-adapter";

declare var exomodel: ExoModelModule;

let VueExoModel$Dependencies = {
    entitiesAreVueObservable: false,
    ExoModel$Model: exomodel.Model,
    ExoModel$Entity: exomodel.Entity,
    ExoModel$Property: exomodel.Property,
};

// TODO: Do we need to take `toggleObserving()` into account?
// var shouldObserve = true;

export function install(Vue: ComponentConstructor) {
    return VueExoModel$installPlugin(Vue, VueExoModel$Dependencies);
}
