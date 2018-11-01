/// <reference path="../ref/model.d.ts" />

import { Model } from "Model";

export interface VueModelOptions {
    createOwnProperties: boolean;
}

export class VueModel {
	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the object is
    readonly $meta: Model;

    constructor(options: VueModelOptions) {

		// Public read-only properties
        Object.defineProperty(this, "$meta", { enumerable: true, value: new Model(options.createOwnProperties) });

    }
}
