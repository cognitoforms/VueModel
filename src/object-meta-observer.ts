﻿import { ObjectMeta } from "@cognitoforms/model.js";
import { CustomObserver } from "./custom-observer";
import { ExtendedObserver } from "./vue-model-observability";

/**
 * A subclass of Vue's internal `Observer` class for entity meta objects, which uses model
 * metadata to manage condition change rather than property walking and rewriting
 */
export class ObjectMetaObserver extends CustomObserver<ObjectMeta> implements ExtendedObserver {
	constructor(value: ObjectMeta, shallow: boolean = false, mock: boolean = false) {
		super(value, shallow, mock);
	}

	ensureObservable(): void {
		if ((this as any)._observable === true) {
			return;
		}

		this.value.conditions.changed.subscribe(this._onConditionsChanged.bind(this));

		(this as any)._observable = true;
	}

	_onConditionsChanged(): void {
		// Notify interested observers of the condition change in order to update dependants
		this.onPropertyChange("conditions", null);
	}
}
