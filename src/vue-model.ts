import { Model } from "../lib/model.js/src/model";
import { EventScope$perform, EventScope$onExit } from "../lib/model.js/src/event-scope";
import Vue from "vue";
import { ensureVueInternalTypes } from "./vue-internals";
import { VueModel$installPlugin } from "./vue-plugin";
import { SourceProviderMixin } from "./source-provider";
import { SourceConsumerMixin } from "./source-consumer";
import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceIndexAdapter } from "./source-index-adapter";

export interface VueModelOptions {
	createOwnProperties?: boolean;
	extendModel?: (model: Model) => void;
}

export class VueModel {

	readonly $meta: Model;

	/**
	 * The type itself implements the plugin interface.
	 */
	static install(vue: typeof Vue, options?: any) {
		ensureVueInternalTypes(vue);
		return VueModel$installPlugin(vue);
	}

	static mixins = {
		SourceProvider: SourceProviderMixin,
		SourceConsumer: SourceConsumerMixin,
	};

	static SourceRootAdapter = SourceRootAdapter;
	static SourcePathAdapter = SourcePathAdapter;
	static SourceIndexAdapter = SourceIndexAdapter;

	constructor(options: VueModelOptions) {

		options = VueModel$prepareOptions(options);

		let model = new Model(options.createOwnProperties);

		// Public read-only properties
		Object.defineProperty(this, "$meta", { enumerable: true, value: model });

		if (options.extendModel) {
			Object.defineProperty(model, "_ruleQueue", { configurable: true, enumerable: false, value: [], writable: false });
			options.extendModel(model);
		}

	}

	perform(fn: Function) {
		EventScope$perform(fn);
	}

	onExit(fn: Function) {
		EventScope$onExit(fn);
	}
}

export interface VueModelConstructor {
	new(options: VueModelOptions): VueModel;
}

function VueModel$prepareOptions(options: VueModelOptions = null): VueModelOptions {
	let result: VueModelOptions = { createOwnProperties: false, extendModel: null };

	if (options) {
		if (Object.prototype.hasOwnProperty.call(options, 'createOwnProperties')) {
			if (typeof options.createOwnProperties === "boolean") {
				result.createOwnProperties = options.createOwnProperties;
			} else {
				// TODO: warn?
			}
		}

		if (Object.prototype.hasOwnProperty.call(options, 'extendModel')) {
			if (typeof options.extendModel === "function") {
				result.extendModel = options.extendModel;
			} else {
				// TODO: warn?
			}
		}
	}

	return result;
}
