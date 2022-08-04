import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Entity } from "@cognitoforms/model.js";
import { SourceAdapter, SourceType } from "./source-adapter";

@Component
export class SourceRootAdapter<TEntity extends Entity> extends Vue implements SourceAdapter<TEntity> {
    @Prop(Object)
    entity: TEntity;

    readonly = false;

    get value(): TEntity {
    	return this.entity;
    }

    get type(): SourceType {
    	return this.entity.meta.type.jstype;
    }

    get isList(): boolean {
    	return false;
    }

    get displayValue(): string {
    	return this.entity.toString();
    }

    toString(): string {
    	return this.entity.meta.type.fullName + "|" + this.entity.meta.id;
    }
}
