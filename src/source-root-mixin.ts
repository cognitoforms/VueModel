import { Entity } from "../lib/model.js/src";
import { observeEntity } from "./entity-observer";

export default function (resolveEntity: string | (() => Entity)) {
	return {
		methods: {
			getSourceRoot(): Entity {
				let entity: Entity;
				if (resolveEntity instanceof Function)
					entity = resolveEntity.call(this);
				else
					entity = this[resolveEntity];

				observeEntity(entity);

				return entity;
			}
		}
	};
};