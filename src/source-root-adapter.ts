import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator'
import { Entity } from "../lib/model.js/src/entity";
import { SourceAdapter } from "./source-adapter";

@Component
export class SourceRootAdapter<TEntity extends Entity> extends Vue implements SourceAdapter<TEntity> {

    @Prop(Object)
    entity: TEntity;

    @Prop(Boolean)
    readonly: boolean;

    get value(): TEntity {
        return this.entity;
    }

    get displayValue(): string {
        return this.entity.toString();
    }

    toString(): string {
        return this.entity.meta.type.fullName + "|" + this.entity.meta.id;
    }

}
