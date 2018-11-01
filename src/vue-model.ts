import { Model } from "../lib/model.js/src/model";

export interface VueModelOptions {
    createOwnProperties: boolean;
}

export class VueModel {
	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the object is
    readonly $meta: Model;

    constructor(options: VueModelOptions) {

        options = VueModel$prepareOptions(options);

		// Public read-only properties
        Object.defineProperty(this, "$meta", { enumerable: true, value: new Model(options.createOwnProperties) });

    }
}

function VueModel$prepareOptions(options: VueModelOptions = null): VueModelOptions {
    let result = { createOwnProperties: false };

    if (options) {
        if (Object.prototype.hasOwnProperty.call(options, 'createOwnProperties')) {
            if (typeof options.createOwnProperties === "boolean") {
                result.createOwnProperties = options.createOwnProperties;
            } else {
                // TODO: warn?
            }
        }
    }

    return result;
}
