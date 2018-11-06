import { Entity } from "../lib/model.js/src/entity";
import { SourceAdapter } from "./source-adapter";
import { SourcePathAdapter } from "./source-path-adapter";

export class SourceIndexAdapter<TEntity extends Entity, TValue> implements SourceAdapter<TValue> {

    // Public read-only properties: aspects of the object that cannot be
    // changed without fundamentally changing what the object is
    readonly source: SourcePathAdapter<TEntity, TValue[]>;
    readonly index: number;

    constructor(source: SourcePathAdapter<TEntity, TValue[]>, index: number) {
        // Public read-only properties
        Object.defineProperty(this, "source", { enumerable: true, value: source });
        Object.defineProperty(this, "index", { enumerable: true, value: index });
    }

    get value(): TValue {
        let list = this.source.value;
        let item = list[this.index];
        return item as TValue;
    }

    set value(value: TValue) {
        let list = this.source.value;

        let currentItem = list[this.index];

        if (value !== currentItem) {
            let oldItem = currentItem;
            let newItem = value;

            list[this.index] = newItem;
        
            var eventArgs = { property: this.source.property, newValue: list, oldValue: undefined as any };

            (eventArgs as any)['changes'] = [{ newItems: [newItem], oldItems: [oldItem] }];
            (eventArgs as any)['collectionChanged'] = true;

            this.source.property._eventDispatchers.changed.dispatch(this.source.source.value, eventArgs);
        }
    }

    get displayValue(): string {
        let list = this.source.value;

        let value = list[this.index];

        let displayValue: string | Array<string>;

        if (this.source.property.format != null) {
            // Use a markup or property format if available
            displayValue = this.source.property.format.convert(value);
        } else {
            displayValue = value.toString();
        }

        return displayValue;
    }

    set displayValue(text: string) {
        this.value = this.source.property.format != null ? this.source.property.format.convertBack(text) : text;
    }

    toString(): string {
        return "Source[" + this.index + "]";
    }

}

export interface SourceIndexAdapterConstructor {
    new <TEntity extends Entity, TValue>(source: SourcePathAdapter<TEntity, TValue[]>, index: number): SourceIndexAdapter<TEntity, TValue>;
}
