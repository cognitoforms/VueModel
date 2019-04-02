import { VueModel } from "./vue-model";
import { VueInternals, Dep } from "./vue-internals";
import { hasOwnProperty } from "./helpers";
import { TypedObserver, observeEntity, dependChildArray } from "./vue-model-observability";
import { Entity } from "../lib/model.js/src/entity";

let VueInternals = (VueModel as any)._VueInternals as VueInternals;

if (!VueInternals.Observer) {
	throw new Error("Vue's Observer constructor has not yet been obtained, be sure to call Vue.use(VueModel).");
}

let Observer = VueInternals.Observer;

/**
 * A subclass of Vue's internal Observer class that is responsible
 * for managing its own access/change events for properties rather than
 * walking the object's own properties
 */
export class CustomObserver<TValue> extends Observer implements TypedObserver<TValue> {

    value: TValue;

    propertyDeps: { [name: string]: Dep };

    constructor(value: TValue) {
        super(value);
        Object.defineProperty(this, 'propertyDeps', { configurable: true, enumerable: true, value: {}, writable: false });
    }

    walk(): void {
    	// Overwrite the `walk()` method to prevent Vue's default property walking behavior
    	// TODO: Should we allow this to happen?
    }

    /**
     * Gets (or creates) a `Dep` object for a property of the given name
     * The `Dep` object will be stored internally by the observer, using
     * the given target property name as a key
     * @param propertyName The target property name
     * @param create If true, create the `Dep` object if it doesn't already exist
     */
    getPropertyDep(propertyName: string, create: boolean = false): Dep {
        let propertyDep: Dep;

        let Dep = VueInternals.Dep;

        let propertyDeps = this.propertyDeps;

    	if (hasOwnProperty(propertyDeps, propertyName) && propertyDeps[propertyName] instanceof Dep) {
            propertyDep = propertyDeps[propertyName];
    	}
    	else if (create) {
            propertyDep = new Dep();
    		Object.defineProperty(propertyDeps, propertyName, {
    			configurable: true,
    			enumerable: true,
    			value: propertyDep,
    			writable: true
    		});
    	}

        return propertyDep;
    }

    /**
     * Emulate's Vue's getter logic in `defineReactive()`
     * @param propertyName The property being accessed
     * @param value The current property value
     */
    onPropertyAccess(propertyName: string, value: any): void {
    	let Dep = VueInternals.Dep;
    	// Attach dependencies if something is watching
    	if (Dep.target) {
    		// Get or initialize the `Dep` object
            var propertyDep = this.getPropertyDep(propertyName, true);

    		// Let an active observer target know that the property was accessed and is a dependency
    			propertyDep.depend();

    		var childOb = observeEntity(value);
    		if (childOb) {
    			childOb.dep.depend();
    		}

    		if (Array.isArray(value)) {
    			// Track dependency on children as well (creating entity observer as needed)
    			dependChildArray(value);
    		}
    	}
    }

    /**
     * Emulate's Vue's setter logic in `defineReactive()`
     * @param propertyName The property being accessed
     * @param newValue The new property value
     */
    onPropertyChange(propertyName: string, newValue: any): void {

    	// Get or initialize the `Dep` object
        var propertyDep = this.getPropertyDep(propertyName, true);
    
    	// Make sure a new value that is an entity is observable
    	if (newValue && newValue instanceof Entity) {
    		observeEntity(newValue).ensureObservable();
    	}

    	// Notify of property change
    		propertyDep.notify(); 
    }

}
