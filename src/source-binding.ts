import Vue from "vue";
import { hasOwnProperty, debug } from "./helpers";
import { Entity } from "../lib/model.js/src/entity";
import { SourceAdapter, isSourceAdapter, isSourcePropertyAdapter } from "./source-adapter";
import { Vue$proxy } from "./vue-helpers";

export function proxySourceAdapterPropertiesOntoComponentInstance(vm: Vue, rootKey: string, force: boolean = false, overwrite: boolean = false) {
	let vm$private: any = vm as any;

	if (!hasOwnProperty(vm$private, rootKey)) {
		// TODO: Warn about missing value for `rootKey`?
		return;
	}

	if (!isSourceAdapter(vm$private[rootKey])) {
		// TODO: Lazily obtain source adapter if needed?
		// TODO: Warn about non-source adapter?
		return;
	}

	let sourceAdapter = vm$private[rootKey] as SourceAdapter<any>;

	debug("Proxying source adapter properties for <" + sourceAdapter + "> on component of type <" + (vm$private.$options._componentTag || "???") + ">.");

	let props = vm$private.$options.propsData;
	let propKeys = vm$private.$options._propKeys.slice();

	if (isSourcePropertyAdapter(vm$private[rootKey])) {
		if (force || (propKeys.indexOf("label") >= 0 && (overwrite || !hasOwnProperty(props, "label")))) {
			Vue$proxy(vm, "_source", "label");
		}

		if (force || (propKeys.indexOf("helptext") >= 0 && (overwrite || !hasOwnProperty(props, "helptext")))) {
			Vue$proxy(vm, "_source", "helptext");
		}
	}

	if (force || (propKeys.indexOf("value") >= 0 && (overwrite || !hasOwnProperty(props, "value")))) {
		Vue$proxy(vm, "_source", "value");
	}

	if (force || (propKeys.indexOf("displayValue") >= 0 && (overwrite || !hasOwnProperty(props, "displayValue")))) {
		Vue$proxy(vm, "_source", "displayValue");
	}
}

export function defineDollarSourceProperty(vm: Vue, sourceAdapter: SourceAdapter<any>) {
	let vm$private: any = vm as any;

	if (!hasOwnProperty(vm$private, "_source") || !isSourceAdapter(vm$private._source)) {
		vm$private._source = sourceAdapter;
	}

	if (!hasOwnProperty(vm, "$source")) {
		Object.defineProperty(vm, "$source", {
			configurable: false,
			enumerable: true,
			get: function() {
				return this._source;
			},
			set: function () {
				// TODO: Warn about setting `$source`?
			}
		});
	}
}

export function getImplicitSource(vm: Vue, detect: boolean = false): Entity | SourceAdapter<any> {
	let vm$private = vm as any;

	if (hasOwnProperty(vm, "$source")) {
		// Source is explicit and has been established
		return null;
	}

	if (vm$private._source) {
		let source = vm$private._source;
		if (typeof source === "string") {
			// Source is explicit (but has not been established)
			return null;
		}
		else if (source instanceof Entity) {
			// An entity was previously flagged as a potential implicit source
			return source as Entity;
		}
		else if (isSourceAdapter(source)) {
			// A source adapter was previously flagged as a potential implicit source
			return source as SourceAdapter<any>;
		}

		// Source of unknown type
		return null;
	}

	if (detect) {
		let data = vm$private._data;
		if (data) {
			if (data instanceof Entity) {
				debug("Found implicit source as data of type <" + (data as Entity).meta.type.fullName + "> on component of type <" + (vm$private.$options._componentTag || "???") + ">.");
				vm$private._source = data;
				return data;
			}
			else if (isSourceAdapter(data)) {
				debug("Found implicit source as source adapter <" + data + "> on component of type <" + (vm$private.$options._componentTag || "???") + ">.");
				vm$private._source = data;
				return data;
			}
		}

		if (vm$private._entity) {
			let entity = vm$private._entity;
			if (entity instanceof Entity) {
				// Mark the entity as a potential implicit source
				debug("Found implicit source as pending entity of type <" + (entity as Entity).meta.type.fullName + "> on component of type <" + (vm$private.$options._componentTag || "???") + ">.");
				vm$private._source = entity;
				return entity;
			}
		}
	}
}

export function getSourceBindingContainer(vm: Vue, detectImplicitSource: boolean = false): Vue {
	let firstImplicitSourceVm: Vue = null;
	let firstImplicitSourceVmLevel = -1;

	for (let parentVm: Vue = vm.$parent, parentLevel = 1; parentVm != null; parentVm = parentVm.$parent, parentLevel += 1) {
		let parentVm$private = parentVm as any;

		let parentSource = parentVm$private.$source;
		if (parentSource) {
			// if (process.env.NODE_ENV === "development") {
			if (typeof parentSource === "string") {
				debug("Found pending source on level " + parentLevel + " parent component of type <" + (parentVm$private.$options._componentTag || "???") + ">.");
			}
			else if (isSourceAdapter(parentSource)) {
				debug("Found established source on level " + parentLevel + " parent component of type <" + (parentVm$private.$options._componentTag || "???") + ">.");
			}
			else {
				debug("Found unknown source on level " + parentLevel + " parent component of type <" + (parentVm$private.$options._componentTag || "???") + ">.");
			}
			// }

			return parentVm;
		}
		else if (detectImplicitSource) {
			let implicitSource = getImplicitSource(parentVm, true);
			if (implicitSource !== undefined && !firstImplicitSourceVm) {
				firstImplicitSourceVm = parentVm;
				firstImplicitSourceVmLevel = parentLevel;
			}
		}
	}

	if (detectImplicitSource && firstImplicitSourceVm) {
		let implicitSource = getImplicitSource(firstImplicitSourceVm);
		if (implicitSource instanceof Entity) {
			debug("Found implicit source on level " + firstImplicitSourceVmLevel + " parent component of type <" + ((firstImplicitSourceVm as any).$options._componentTag || "???") + ">.");
			return firstImplicitSourceVm;
		}
	}
}
