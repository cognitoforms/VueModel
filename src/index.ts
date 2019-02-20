import { VueModel } from "./vue-model";
import { SourceRootAdapter, SourceRootAdapterConstructor } from "./source-root-adapter";
import { SourcePathAdapter, SourcePathAdapterConstructor } from "./source-path-adapter";
import { SourceIndexAdapter, SourceIndexAdapterConstructor } from "./source-index-adapter";
import { Model, ModelOptions } from "../lib/model.js/src/model"
import { PropertyConverter, PropertySerializationResult } from "../lib/model.js/src/entity-serializer"
import { Entity } from "../lib/model.js/src/entity"
import { Property } from "../lib/model.js/src/property"

// TODO: Do we need to take `toggleObserving()` into account?
// var shouldObserve = true;

export interface VueModelNamespace {
	SourceRootAdapter: SourceRootAdapterConstructor,
	SourcePathAdapter: SourcePathAdapterConstructor,
	SourceIndexAdapter: SourceIndexAdapterConstructor,
	Model: Model,
	mixins: VueModelMixins,
}

export interface VueModelMixins {
    SourceProvider: any;
    SourceConsumer: any;
}

import "../lib/model.js/src/legacy-api";

export default VueModel;

// Export any additional *types* to be referenced externally
export type Model = Model;
export type ModelOptions = ModelOptions;
export type Property = Property;
export type PropertyConverter = PropertyConverter;
export type PropertySerializationResult = PropertySerializationResult;
export type SourceRootAdapter<TEntity extends Entity> = SourceRootAdapter<TEntity>;
export type SourcePathAdapter<TEntity extends Entity, TValue> = SourcePathAdapter<TEntity, TValue>;
export type SourceIndexAdapter<TEntity extends Entity, TValue> = SourceIndexAdapter<TEntity, TValue>;
