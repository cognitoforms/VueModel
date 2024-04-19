import { VueModel } from "./vue-model";

// Include English resources by default
import "@cognitoforms/model.js/lib/resource-en";

export default VueModel;

export { isSourceAdapter } from "./source-adapter";
export { preventVueObservability } from "./vue-model-observability";
export type { SourceRootAdapter } from "./source-root-adapter";
export type { SourcePathAdapter } from "./source-path-adapter";
export type { SourceItemAdapter } from "./source-item-adapter";
