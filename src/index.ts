import { VueModel } from "./vue-model";
import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceItemAdapter } from "./source-item-adapter";
import { Model, ModelOptions, ModelLocalizationOptions } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { PropertyInjector, PropertySerializationResult } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { TypeOptions, TypeExtensionOptions, RuleOrMethodFunctionOrOptions } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { Entity } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { Property, PropertyOptions, PropertyBooleanFunction, PropertyBooleanFunctionAndOptions } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { CultureInfo } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates

// Include English resources by default
import "@cognitoforms/model.js/lib/resource-en";

export default VueModel;

type ObjectLookup<T> = { [key: string]: T };

// Export any additional *types* to be referenced externally
// TODO: Change to export { ... } from "./...";
export type Model = Model;
export type ModelOptions = ModelOptions;
export type ModelLocalizationOptions = ModelLocalizationOptions;
export type TypeOptions = TypeOptions;
export type TypeExtensionOptions<TEntity extends Entity> = TypeExtensionOptions<TEntity>;
export type RuleOrMethodFunctionOrOptions<TEntity extends Entity> = RuleOrMethodFunctionOrOptions<TEntity>;
export type Entity = Entity & ObjectLookup<any>;
export type CultureInfo = CultureInfo;
export type Property = Property;
export type PropertyOptions = PropertyOptions;
export type PropertyBooleanFunction = PropertyBooleanFunction;
export type PropertyBooleanFunctionAndOptions = PropertyBooleanFunctionAndOptions;
export type PropertyInjector = PropertyInjector;
export type PropertySerializationResult = PropertySerializationResult;
export { PropertyConverter, IgnoreProperty } from "@cognitoforms/model.js";
export { isEntityType, isValueType } from "@cognitoforms/model.js";
export { isSourceAdapter } from "./source-adapter";
export type SourceRootAdapter<TEntity extends Entity> = SourceRootAdapter<TEntity>;
export type SourcePathAdapter<TEntity extends Entity, TValue> = SourcePathAdapter<TEntity, TValue>;
export type SourceItemAdapter<TEntity extends Entity, TValue> = SourceItemAdapter<TEntity, TValue>;
