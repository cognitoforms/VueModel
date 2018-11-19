import { Entity } from "../lib/model.js/src/entity";
import { Property, PropertyChangeEventArgs } from "../lib/model.js/src/property";
import { SourceAdapter } from "./source-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { ObservableArray, ArrayChangeType } from "../lib/model.js/src/observable-array";

export class SourceIndexAdapter<TEntity extends Entity, TValue> implements SourceAdapter<TValue> {

    // Public read-only properties: aspects of the object that cannot be
    // changed without fundamentally changing what the object is
    readonly source: SourcePathAdapter<TEntity, TValue[]>;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
    private _index: number;

    private _orphaned: boolean;

    constructor(source: SourcePathAdapter<TEntity, TValue[]>, index: number) {
        // Public read-only properties
        Object.defineProperty(this, "source", { enumerable: true, value: source });

		// Backing fields for properties
		Object.defineProperty(this, "_index", { enumerable: false, value: index, writable: true });
		Object.defineProperty(this, "_orphaned", { enumerable: false, value: false, writable: true });

        // If the source array is modified, then update the index if needed
        this.subscribeToSourceChanges();
    }

    private subscribeToSourceChanges() {
        let _this = this;
        let array = ObservableArray.ensureObservable(this.source.value);
        array.changed.subscribe(function (args) {
            args.changes.forEach(function (c) {
                if (c.type === ArrayChangeType.remove) {
                    if (c.startIndex === _this.index) {
                        _this._index = -1;
                        _this._orphaned = true;
                    } else if (c.startIndex < _this.index) {
                        if (c.items.length > _this.index - c.startIndex) {
                            _this._index = -1;
                            _this._orphaned = true;
                        } else {
                            _this._index -= c.items.length;
                        }
                    }
                } else if (c.type === ArrayChangeType.add) {
                    if (c.startIndex >= 0) {
                        if (c.startIndex <= _this.index) {
                            _this._index += c.items.length;
                        }
                    }
                }
            });
        });
    }

	get index(): number {
        return this._index;
    }

	get isOrphaned(): boolean {
        return this._orphaned;
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
        
            var eventArgs: PropertyChangeEventArgs = { entity: this.source.source.value, property: this.source.property as Property, newValue: list, oldValue: undefined as any };

            (eventArgs as any)['changes'] = [{ newItems: [newItem], oldItems: [oldItem] }];
            (eventArgs as any)['collectionChanged'] = true;

            this.source.property._events.changedEvent.publish(this.source.source.value, eventArgs);
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
