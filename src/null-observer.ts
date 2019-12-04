import { VueModel } from "./vue-model";
import { VueInternals as VueInternalsType } from "./vue-internals";

let VueInternals = (VueModel as any)._VueInternals as VueInternalsType;

if (!VueInternals.Observer) {
	throw new Error("Vue's Observer constructor has not yet been obtained, be sure to call Vue.use(VueModel).");
}

let Observer = VueInternals.Observer;

/**
 * A subclass of Vue's internal Observer class that prevents
 * walking and overriding the object's own properties
 */
export class NullObserver<TValue> extends Observer<TValue> {
	walk(): void {
    	// Overwrite the `walk()` method to prevent Vue's default property walking behavior
	}
}
