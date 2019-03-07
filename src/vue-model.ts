import Vue from "vue";
import { Model, ModelOptions, ModelConfiguration } from "../lib/model.js/src/model";
import { ensureVueInternalTypes } from "./vue-internals";
import { VueModel$installPlugin } from "./vue-plugin";
import { SourcePathMixin } from "./source-path-mixin";
import { SourceRootMixin } from "./source-root-mixin";
import { SourceRootAdapter } from "./source-root-adapter";
import { makeEntitiesVueObservable, EntityObserver } from "./entity-observer";
import { CustomObserver } from "./custom-observer";
import { ArrayObserver } from "./array-observer";

export class VueModel extends Model {

	/**
	 * Creates a new model with the specified type information.
	 * @param options The set of model types to add.
	 */
	constructor(options?: ModelOptions, config?: ModelConfiguration) {
		super(options, config);

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
	 * Expose the source root adapter so that a component can construct it if needed
	 */
	static SourceRoot = SourceRootAdapter;

	/**
	 * Implement the Vue plugin interface:
	 * https://vuejs.org/v2/guide/plugins.html#Writing-a-Plugin
	 */
	static install(vue: typeof Vue, options?: any) {
			
		// Get access to Vue's internal types that we need
		ensureVueInternalTypes(Vue);

		// Make sure the Observer subclasses extend Observer
		CustomObserver.extend();
		ArrayObserver.extend();
		EntityObserver.extend();

		return VueModel$installPlugin(vue, options);
	}

}
