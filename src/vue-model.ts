import Vue, { VueConstructor, ComponentOptions, PluginObject } from "vue";
import { Model, ModelOptions, ModelConfiguration } from "../lib/model.js/src/model";
import { VueInternals, ensureVueInternalTypes } from "./vue-internals";
import { VueModel$installGlobalMixin } from "./vue-global-mixin";
import { SourcePathMixin } from "./source-path-mixin";
import { SourceRootMixin } from "./source-root-mixin";
import { SourceRootAdapter } from "./source-root-adapter";
import { makeEntitiesVueObservable } from "./vue-model-observability";
import { VMSource } from "./vm-source-component";

// TODO: Do we need to take `toggleObserving()` into account?

export class VueModel extends Model {

	private static _Vue: VueConstructor = null;

	private static _VueInternals: VueInternals = { Observer: null, Dep: null };

	/**
	 * Creates a new model with the specified type information.
	 * @param options The set of model types to add.
	 */
	constructor(options?: ModelOptions, config?: ModelConfiguration) {
		super(options, config);

		if (!VueModel._Vue) {
			// TODO: auto-install if needed?
			throw new Error("Vue.use(VueModel) must be called before constructing a VueModel instance.");
		}

		// Make sure that entities are observable by Vue
		makeEntitiesVueObservable(this);
	}

	/**
	 * Provide access to Vue mixins for source provider/consumer
	 */
	static mixins = {
		SourcePath: SourcePathMixin,
		SourceRoot: SourceRootMixin
		//SourceRoot: function (source: string) { return new SourceRootMixin({ propsData: { source: source } }); }
	};

	/**
	 * Implement the Vue plugin interface:
	 * https://vuejs.org/v2/guide/plugins.html#Writing-a-Plugin
	 */
	static install(vue: typeof Vue, options?: any) {

		// Detect if the plugin install has already been called
		if (VueModel._Vue) {
			if (process.env.NODE_ENV !== 'production') {
				console.error('[vuemodel] already installed. Vue.use(VueModel) should be called only once.');
				return;
			}

			throw new Error("Vue.use(VueModel) should be called only once.");
		}	

		// Register components globally for use in templates
		vue.component("vm-source", VMSource);

		// Store a reference to the Vue constructor/module
		VueModel._Vue = vue;

		// Get access to Vue's internal types that we need
		ensureVueInternalTypes(VueModel._VueInternals, Vue);

		// Install the Vue global mixin
		return VueModel$installGlobalMixin(vue);

	}

}

export interface VueModelMixins {
	SourcePath: ComponentOptions<Vue>;
	SourceRoot: ComponentOptions<Vue>;
}

export interface VueModelConstructor extends PluginObject<any> {
	new(options?: ModelOptions, config?: ModelConfiguration): VueModel;
	mixins: VueModelMixins;
	SourceRoot: any;
}
