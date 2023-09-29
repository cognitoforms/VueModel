import { VueModel } from "./vue-model";

// Include English resources by default
import "@cognitoforms/model.js/lib/resource-en";

export default VueModel;

// Export any additional *types* to be referenced externally
// TODO: Change to export { ... } from "./...";
export { Model, ModelOptions, ModelLocalizationOptions } from "@cognitoforms/model.js";
export { TypeOptions, TypeExtensionOptions, RuleOrMethodFunctionOrOptions } from "@cognitoforms/model.js";
export { Entity, EntityOfType, EntityConstructorForType, TypeOfType } from "@cognitoforms/model.js";
export { CultureInfo } from "@cognitoforms/model.js";
export { Property, PropertyOptions, PropertyBooleanFunction, PropertyBooleanFunctionAndOptions } from "@cognitoforms/model.js";
export { PropertyInjector, PropertySerializationResult } from "@cognitoforms/model.js";
export { PropertyConverter, IgnoreProperty } from "@cognitoforms/model.js";
export { isEntityType, isValueType } from "@cognitoforms/model.js";
export { isSourceAdapter } from "./source-adapter";
export { preventVueObservability } from "./vue-model-observability";
export { SourceRootAdapter } from "./source-root-adapter";
export { SourcePathAdapter } from "./source-path-adapter";
export { SourceItemAdapter } from "./source-item-adapter";
