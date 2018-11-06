import { Entity } from "../lib/model.js/src/entity";
import { SourceAdapter } from "./source-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { ObservableList } from "../lib/model.js/src/observable-list";

export class SourceIndexAdapter<TEntity extends Entity, TValue> implements SourceAdapter<TValue> {

    // Public read-only properties: aspects of the object that cannot be
    // changed without fundamentally changing what the object is
    readonly source: SourcePathAdapter<TEntity, TValue[]>;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
    private _index: number;

    constructor(source: SourcePathAdapter<TEntity, TValue[]>, index: number) {
        // Public read-only properties
        Object.defineProperty(this, "source", { enumerable: true, value: source });

		// Backing fields for properties
		Object.defineProperty(this, "_index", { enumerable: false, value: index, writable: true });

        // If the source array is modified, then update the index if needed
        this.subscribeToSourceChanges();
    }

    private subscribeToSourceChanges() {
        let _this = this;
        let list = ObservableList.ensureObservable(this.source.value);
        list.changed.subscribe((sender, args) => {
            if (args.addedIndex >= 0) {
                if (args.addedIndex < _this.index) {
                    this._index += args.added.length;
                }
            } else if (args.removedIndex >= 0) {
                if (args.removedIndex < _this.index) {
                    this._index -= args.removed.length;
                }
            }
        });
    }

	get index(): number {
        return this._index;
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
