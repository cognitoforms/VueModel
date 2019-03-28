import { VueModel } from "./vue-model";
import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceItemAdapter } from "./source-item-adapter";
import { Model, ModelOptions } from "../lib/model.js/src/model"
import { PropertyConverter, PropertyInjector, PropertySerializationResult } from "../lib/model.js/src/entity-serializer"
import { Entity } from "../lib/model.js/src/entity"
import { Property } from "../lib/model.js/src/property"

export default VueModel;

// Include English resources by default
import "../lib/model.js/src/resource-en.ts";

// Export any additional *types* to be referenced externally
export type Model = Model;
export type ModelOptions = ModelOptions;
export { Entity };
export type Property = Property;
export type PropertyConverter = PropertyConverter;
export type PropertyInjector = PropertyInjector;
export type PropertySerializationResult = PropertySerializationResult;
export type SourceRootAdapter<TEntity extends Entity> = SourceRootAdapter<TEntity>;
export type SourcePathAdapter<TEntity extends Entity, TValue> = SourcePathAdapter<TEntity, TValue>;
export type SourceItemAdapter<TEntity extends Entity, TValue> = SourceItemAdapter<TEntity, TValue>;
