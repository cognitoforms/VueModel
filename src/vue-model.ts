import Vue, { VueConstructor, ComponentOptions, PluginObject } from "vue";
import { Model, ModelOptions, ModelConfiguration, ModelTypeOptions, ModelNamespaceOption, ModelWithNamespace, ModelNamespace, TypeOfType, ModelLocalizationOptions, ModelOfType } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { Entity } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { VueInternals, ensureVueInternalTypes } from "./vue-internals";
import { VueModel$installGlobalMixin } from "./vue-global-mixin";
import { SourcePathMixin } from "./source-path-mixin";
import { SourceRootMixin } from "./source-root-mixin";
import { makeEntitiesVueObservable, preventVueObservability } from "./vue-model-observability";
import { VMRoot } from "./vm-root-component";
import { VMSource } from "./vm-source-component";
import { CultureInfo } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates

// TODO: Do we need to take `toggleObserving()` into account?

export class VueModel extends Model {
	private static _Vue: VueConstructor = null;

	private static _VueInternals: VueInternals = { Observer: null, Dep: null };

	/**
	 * Creates a new model with the specified type information.
	 * @param options The set of model types to add.
	 */
	constructor(options?: ModelOptions<any>, config?: ModelConfiguration) {
		super(options, config);

		if (!VueModel._Vue) {
			// TODO: auto-install if needed?
			throw new Error("Vue.use(VueModel) must be called before constructing a VueModel instance.");
		}

		// Make sure that the model itself is not made observable by Vue, since anything that we want to be made observable should be made observable explicitly
		preventVueObservability(this);

		// Make sure that entities are observable by Vue
		makeEntitiesVueObservable(this as Model);
	}

	/**
	 * Provide access to Vue mixins for source provider/consumer
	 */
	static mixins = {
		SourcePath: SourcePathMixin,
		SourceRoot: SourceRootMixin
	};

	static Entity = Entity;

	static CultureInfo = CultureInfo;

	/**
	 * Implement the Vue plugin interface:
	 * https://vuejs.org/v2/guide/plugins.html#Writing-a-Plugin
	 */
	static install(vue: typeof Vue): void {
		// Detect if the plugin install has already been called
		if (VueModel._Vue)
			return;

		// Register components globally for use in templates
		vue.component("vm-root", VMRoot);
		vue.component("vm-source", VMSource);

		// Store a reference to the Vue constructor/module
		VueModel._Vue = vue;

		// Get access to Vue's internal types that we need
		ensureVueInternalTypes(VueModel._VueInternals, VueModel._Vue);

		// Install the Vue global mixin
		return VueModel$installGlobalMixin(vue);
	}
}

export interface VueModelMixins {
	SourcePath: ComponentOptions<Vue>;
	SourceRoot: ComponentOptions<Vue>;
}

export interface VueModelOfType<TTypes> extends VueModel {
	readonly types: { [T in keyof TTypes]: TypeOfType<TTypes[T]> };
}

export interface VueModelWithNamespace<TNamespace> extends VueModel {
	readonly $namespace: ModelNamespace<TNamespace>;
}

export function createVueModel<TTypes>(options?: ModelTypeOptions<TTypes> & Required<ModelNamespaceOption<TTypes>> & ModelLocalizationOptions, config?: ModelConfiguration): Promise<ModelOfType<TTypes> & ModelWithNamespace<TTypes>>;
export function createVueModel<TTypes>(options?: ModelTypeOptions<TTypes> & ModelLocalizationOptions, config?: ModelConfiguration): Promise<ModelOfType<TTypes> & ModelNamespace<TTypes>>;
export function createVueModel<TTypes>(options?: ModelOptions<TTypes>, config?: ModelConfiguration): Promise<ModelOfType<TTypes>> {
	return new Promise((resolve) => {
		const model = new VueModel(options, config);
		model.ready(() => {
			resolve(model as ModelOfType<TTypes>);
		});
	});
}

export interface VueModelConstructor extends PluginObject<any> {
	new(options?: ModelOptions<any>, config?: ModelConfiguration): VueModel;
	mixins: VueModelMixins;
	SourceRoot: any;
}
