import { VueModel } from "./vue-model";

// Include English resources by default
import "@cognitoforms/model.js/lib/resource-en";

export default VueModel;

// Export any additional *types* to be referenced externally
// TODO: Change to export { ... } from "./...";
export type { Model, ModelOptions, ModelLocalizationOptions } from "@cognitoforms/model.js";
export type { TypeOptions, TypeExtensionOptions, RuleOrMethodFunctionOrOptions } from "@cognitoforms/model.js";
export type { Entity } from "@cognitoforms/model.js";
export type { CultureInfo } from "@cognitoforms/model.js";
export type { Property, PropertyOptions, PropertyBooleanFunction, PropertyBooleanFunctionAndOptions } from "@cognitoforms/model.js";
export type { PropertyInjector, PropertySerializationResult } from "@cognitoforms/model.js";
export { PropertyConverter, IgnoreProperty } from "@cognitoforms/model.js";
export { isEntityType, isValueType } from "@cognitoforms/model.js";
export { isSourceAdapter } from "./source-adapter";
export { preventVueObservability } from "./vue-model-observability";
export type { SourceRootAdapter } from "./source-root-adapter";
export type { SourcePathAdapter } from "./source-path-adapter";
export type { SourceItemAdapter } from "./source-item-adapter";
