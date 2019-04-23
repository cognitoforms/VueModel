import { VueModel } from "./vue-model";
import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceItemAdapter } from "./source-item-adapter";
import { Model, ModelOptions, ModelLocalizationOptions } from "../lib/model.js/src/model";
import { PropertyConverter, PropertyInjector, PropertySerializationResult } from "../lib/model.js/src/entity-serializer";
import { TypeExtensionOptions, RuleOrMethodFunctionOrOptions } from "../lib/model.js/src/type";
import { Entity } from "../lib/model.js/src/entity";
import { Property } from "../lib/model.js/src/property";
import { CultureInfo } from "../lib/model.js/src/globalization";

// Include English resources by default
import "../lib/model.js/src/resource-en.ts";

export default VueModel;

// Export any additional *types* to be referenced externally
// TODO: Change to export { ... } from "./...";
export type Model = Model;
export type ModelOptions = ModelOptions;
export type ModelLocalizationOptions = ModelLocalizationOptions;
export type TypeExtensionOptions<TEntity extends Entity> = TypeExtensionOptions<TEntity>;
export type RuleOrMethodFunctionOrOptions<TEntity extends Entity> = RuleOrMethodFunctionOrOptions<TEntity>;
export type Entity = Entity;
export type CultureInfo = CultureInfo;
export type Property = Property;
export type PropertyConverter = PropertyConverter;
export type PropertyInjector = PropertyInjector;
export type PropertySerializationResult = PropertySerializationResult;
export type SourceRootAdapter<TEntity extends Entity> = SourceRootAdapter<TEntity>;
export type SourcePathAdapter<TEntity extends Entity, TValue> = SourcePathAdapter<TEntity, TValue>;
export type SourceItemAdapter<TEntity extends Entity, TValue> = SourceItemAdapter<TEntity, TValue>;
