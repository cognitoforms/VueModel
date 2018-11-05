import { Entity } from "../lib/model.js/src/entity";
import { SourceAdapter } from "./source-adapter";

export class SourceRootAdapter<TEntity extends Entity> implements SourceAdapter<TEntity> {

    // Public read-only properties: aspects of the object that cannot be
    // changed without fundamentally changing what the object is
    readonly entity: TEntity;
 
    constructor(entity: TEntity) {
        // Public read-only properties
        Object.defineProperty(this, "entity", { enumerable: true, value: entity });
    }

    get value(): TEntity {
        return this.entity;
    }

    get displayValue(): string {
        // TODO: Use type-level format for entity `displayValue`
        return this.entity.meta.type.fullName + "|" + this.entity.meta.id;
    }

    toString(): string {
        return this.entity.meta.type.fullName + "|" + this.entity.meta.id;
    }

}
