import { VueConstructor } from "vue";

export let VueModel$Vue: VueConstructor = null;

export interface Dep {
    depend(): void;
    notify(): void;
}

export interface DepConstructor {
    new(): Dep;
    target: any;
}

export interface Observer<T> {
    value: T;
    dep: Dep;
    vmCount: number;
}

export interface ObserverConstructor {
    new<T>(value: T, shallow?: boolean, mock?: boolean): Observer<T>;
}

export interface VueInternals {
    Observer: ObserverConstructor;
    Dep: DepConstructor;
}

export function ensureVueInternalTypes(target: VueInternals, Vue: VueConstructor): void {
	// Exit early if Observer or Dep are already defined
	if (target.Observer || target.Dep) {
		return;
	}

	let observableData: any;

	if (Vue.observable) {
		observableData = Vue.observable({});
	}
	else {
		let component = new Vue({
			data() {
				return { };
			}
		});

		observableData = component.$data;
	}

	let observer = (observableData as any).__ob__ as Observer<any>;
	let observerCtor = (observer as any).constructor as ObserverConstructor;
	let depCtor = observer.dep.constructor as DepConstructor;

	target.Observer = observerCtor;
	target.Dep = depCtor;
}
