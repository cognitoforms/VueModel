import { Entity } from "../lib/model.js/src/entity";
import { SourceAdapter } from "./source-adapter";
import { CustomObserver } from "./custom-observer";

export class SourceRootAdapter<TEntity extends Entity> implements SourceAdapter<TEntity> {

    // Public read-only properties: aspects of the object that cannot be
    // changed without fundamentally changing what the object is
    readonly entity: TEntity;

    __ob__: CustomObserver<SourceRootAdapter<TEntity>>; 

    constructor(entity: TEntity) {
        // Public read-only properties
        Object.defineProperty(this, "entity", { enumerable: true, value: entity });

        Object.defineProperty(this, "__ob__", { configurable: false, enumerable: false, value: new CustomObserver(this), writable: false });
    }

    get value(): TEntity {
        let value = this.entity;
        this.__ob__.onPropertyAccess('value', value);
        return value;
    }

    get displayValue(): string {
        // TODO: Use type-level format for entity `displayValue`
        let displayValue = this.entity.meta.type.fullName + "|" + this.entity.meta.id;
        this.__ob__.onPropertyAccess('displayValue', displayValue);
        return displayValue;
    }

    toString(): string {
        return this.entity.meta.type.fullName + "|" + this.entity.meta.id;
    }

}

export interface SourceRootAdapterConstructor {
    new <TEntity extends Entity>(entity: TEntity): SourceRootAdapter<TEntity>;
}
