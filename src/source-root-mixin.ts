import { Entity } from "../lib/model.js/src";
import { observeEntity } from "./entity-observer";
import { SourceRootAdapter } from "./source-root-adapter";
import { defineDollarSourceProperty } from "./source-binding";

export default function (resolveEntity: string | (() => Entity)) {
	return {
		created: function () {

			// Find the root entity
			let entity: Entity;
			if (resolveEntity instanceof Function)
				entity = resolveEntity.call(this);
			else
				entity = this[resolveEntity];

			// Make sure the entity is observable
			observeEntity(entity);

			// Create the root source adapter
			defineDollarSourceProperty(this, new SourceRootAdapter(entity))
		}
	};
};