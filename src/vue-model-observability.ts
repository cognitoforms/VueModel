import { markRaw } from "vue";
import { Observer, ObserverConstructor, Dep } from "./vue-internals";
import { Model } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { Entity, EntityRegisteredEventArgs } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { ObjectMeta } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { ObservableArray } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { hasOwnProperty, getProp } from "./helpers";

export interface ExtendedObserver extends Observer<any> {
    ensureObservable(): void;
}

export interface CustomObserverInterface {
    getPropertyDep(propertyName: string, create?: boolean): Dep;
    onPropertyAccess(propertyName: string, value: any): void;
    onPropertyChange(propertyName: string, newValue: any): void;
}

export interface CustomObserverConstructor<T> extends ObserverConstructor {
    new(value: T, shallow?: boolean, mock?: boolean): Observer<T> & CustomObserverInterface;
}

// eslint-disable-next-line no-redeclare
let CustomObserverConstructor: ObserverConstructor = null;

export function getCustomObserverConstructor(): CustomObserverConstructor<any> {
	return CustomObserverConstructor || (CustomObserverConstructor = require("./custom-observer").CustomObserver);
}

export function preventVueObservability(obj: object): boolean {
	if (obj) {
		if (!hasOwnProperty(obj, "__ob__")) {
			// Mark the object as "raw" so that Vue won't try to make it observable
			markRaw(obj);
			return true;
		}
		else {
			// Vue's default observability is also bypassed if the object's observer is a subclass of `CustomObserver`
			let CustomObserver = getCustomObserverConstructor();
			return (obj as any).__ob__ instanceof CustomObserver;
		}
	}
}

export interface EntityObserverConstructor extends ObserverConstructor {
	new(value: Entity, shallow?: boolean, mock?: boolean): Observer<Entity> & ExtendedObserver & CustomObserverInterface;
}

/**
 * Based on Vue's internal `observe()` function. Ensures that the given entity
 * is observable and optionally notes that it is referenced by a component
 * @param entity The entity to observe
 * @param asRootData The entity is referenced as a component's data
 */
export function observeEntity(entity: Entity, asRootData: boolean = false): Observer<Entity> & ExtendedObserver & CustomObserverInterface {
	if (entity instanceof Entity) {
		var ob = getEntityObserver(entity, true);
		if (entity.meta) {
			getObjectMetaObserver(entity.meta, true);
		}
		if (asRootData && ob) {
			ob.vmCount++;
		}
		return ob;
	}
	else {
		// TODO: Warn about attempting to observe non-entity?
	}
}

/**
 * Gets or creates an `EntityObserver` for the given entity
 * @param entity The entity begin observed
 * @param create If true, create the observer if it doesn't already exist
 */
export function getEntityObserver(entity: Entity, create: boolean = false): Observer<Entity> & ExtendedObserver & CustomObserverInterface {
	var EntityObserver = getEntityObserverConstructor();
	if (hasOwnProperty(entity, "__ob__") && getProp(entity, "__ob__") instanceof EntityObserver) {
		return getProp(entity, "__ob__");
	}
	else if (create) {
		// Mark the entity as "raw" so that Vue won't try to make it observable
		markRaw(entity);
		return new EntityObserver(entity, true);
	}
	else {
		return null;
	}
}

// eslint-disable-next-line no-redeclare
let EntityObserverConstructor: EntityObserverConstructor = null;

export function getEntityObserverConstructor(): EntityObserverConstructor {
	return EntityObserverConstructor || (EntityObserverConstructor = require("./entity-observer").EntityObserver);
}

export interface ObjectMetaObserverConstructor extends ObserverConstructor {
	new(value: ObjectMeta, shallow?: boolean, mock?: boolean): Observer<ObjectMeta> & ExtendedObserver & CustomObserverInterface;
}

/**
 * Gets or creates an `ObjectMetaObserver` for the given meta object
 * @param meta The object meta begin observed
 * @param create If true, create the observer if it doesn't already exist
 */
export function getObjectMetaObserver(meta: ObjectMeta, create: boolean = false): Observer<ObjectMeta> & ExtendedObserver & CustomObserverInterface {
	var ObjectMetaObserver = getObjectMetaObserverConstructor();
	if (hasOwnProperty(meta, "__ob__") && getProp(meta, "__ob__") instanceof ObjectMetaObserver) {
		return getProp(meta, "__ob__");
	}
	else if (create) {
		// Mark the object meta as "raw" so that Vue won't try to make it observable
		markRaw(meta);
		return new ObjectMetaObserver(meta, true);
	}
	else {
		return null;
	}
}

// eslint-disable-next-line no-redeclare
let ObjectMetaObserverConstructor: ObjectMetaObserverConstructor = null;

export function getObjectMetaObserverConstructor(): ObjectMetaObserverConstructor {
	return ObjectMetaObserverConstructor || (ObjectMetaObserverConstructor = require("./object-meta-observer").ObjectMetaObserver);
}

export interface ArrayObserverConstructor<TItem> extends ObserverConstructor {
	new(items: ObservableArray<TItem>, shallow?: boolean, mock?: boolean): Observer<ObservableArray<TItem>> & ExtendedObserver & CustomObserverInterface;
}

/**
 * Based on Vue's internal `observe()` function. Ensures that the given array
 * is observable and optionally notes that it is referenced by a component
 * @param array The array to observe
 * @param asRootData The array is referenced as a component's data
 */
export function observeArray<TItem>(array: ObservableArray<TItem>, asRootData: boolean = false): Observer<ObservableArray<TItem>> & ExtendedObserver & CustomObserverInterface {
	if (Array.isArray(array)) {
		if (ObservableArray.isObservableArray(array)) {
			var ob = getArrayObserver(array, true);
			if (asRootData && ob) {
				ob.vmCount++;
			}
			return ob;
		}
		else {
			// TODO: Warn about attempting to observe non-observable array?
		}
	}
	else {
		// TODO: Warn about attempting to observe non-array?
	}
}

/**
 * Gets or creates an `ArrayObserver` for the given observable array
 * @param entity The entity begin observed
 * @param create If true, create the observer if it doesn't already exist
 */
export function getArrayObserver<TItem>(array: ObservableArray<TItem>, create: boolean = false): Observer<ObservableArray<TItem>> & ExtendedObserver & CustomObserverInterface {
	let ArrayObserver = getArrayObserverConstructor();
	if (hasOwnProperty(array, "__ob__") && getProp(array, "__ob__") instanceof ArrayObserver) {
		return getProp(array, "__ob__");
	}
	else if (create) {
		// Mark the array as "raw" so that Vue won't try to make it observable
		markRaw(array);
		return new ArrayObserver(array, true);
	}
	else {
		return null;
	}
}

// eslint-disable-next-line no-redeclare
let ArrayObserverConstructor: ArrayObserverConstructor<any> = null;

export function getArrayObserverConstructor(): ArrayObserverConstructor<any> {
	return ArrayObserverConstructor || (ArrayObserverConstructor = require("./array-observer").ArrayObserver);
}

/**
 * Based on Vue's internals `dependArray()` function
 * @param array The child array to track as a dependency
 */
export function dependChildArray(array: any[]): void {
	const arrayObserver = observeArray(array as any);
	if (arrayObserver)
		arrayObserver.ensureObservable();

	for (var e, i = 0, l = array.length; i < l; i++) {
		e = array[i];
		if (e != null) {
			if (e instanceof Entity) {
				let observer = getEntityObserver(e, true);
				observer.ensureObservable();
				observer.dep.depend();
			}
			else if (hasOwnProperty(e, "__ob__")) {
				(e.__ob__.dep as Dep).depend();
			}

			if (Array.isArray(e)) {
				dependChildArray(e);
			}
		}
	}
}

var vueCompatibleModels: Model[] = [];

/**
 * Make sure that entities in the given model are observable by Vue
 * By default, entities would not be observable, since model properties
 * are added to the prototype, Vue will not detect them. So, we use a custom
 * observer that leverages model metadata to manage property access/change.
 * @param model The model to augment
 */
export function makeEntitiesVueObservable(model: Model): void {
	if (!model || !(model instanceof Model)) {
		// TODO: Warn about missing or non-Model argument?
		return;
	}

	if (vueCompatibleModels.indexOf(model) >= 0 || (model as any)._entitiesAreVueObservable === true) {
		return;
	}

	model.entityRegistered.subscribe(function(args: EntityRegisteredEventArgs) {
		observeEntity(args.entity).ensureObservable();
	});

	// Make existing entities observable
	for (let typeName of Object.keys(model.types)) {
		let type = model.types[typeName];
		type.known().forEach(function(entity: Entity) {
			observeEntity(entity).ensureObservable();
		});
	}

	vueCompatibleModels.push(model);
	(model as any)._entitiesAreVueObservable = true;
}
