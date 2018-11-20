import { Entity } from "../lib/model.js/src/entity";
import { Property, PropertyChangeEventArgs } from "../lib/model.js/src/property";
import { SourceAdapter } from "./source-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { ObservableArray, ArrayChangeType } from "../lib/model.js/src/observable-array";
import { CustomObserver } from "./custom-observer";

export class SourceIndexAdapter<TEntity extends Entity, TValue> implements SourceAdapter<TValue> {

    // Public read-only properties: aspects of the object that cannot be
    // changed without fundamentally changing what the object is
    readonly source: SourcePathAdapter<TEntity, TValue[]>;

    __ob__: CustomObserver<SourceIndexAdapter<TEntity, TValue>>;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
    private _index: number;

    private _isOrphaned: boolean;

    constructor(source: SourcePathAdapter<TEntity, TValue[]>, index: number) {
        // Public read-only properties
        Object.defineProperty(this, "source", { enumerable: true, value: source });

		// Backing fields for properties
		Object.defineProperty(this, "_index", { enumerable: false, value: index, writable: true });
        Object.defineProperty(this, "_isOrphaned", { enumerable: false, value: false, writable: true });

        Object.defineProperty(this, "__ob__", { configurable: false, enumerable: false, value: new CustomObserver(this), writable: false });

        // If the source array is modified, then update the index if needed
        this.subscribeToSourceChanges();
    }

    private subscribeToSourceChanges() {
        let _this = this;
        let array = ObservableArray.ensureObservable(this.source.value);
        array.changed.subscribe(function (args) {
            let index: number = _this._index;
            let isOrphaned: boolean = _this._isOrphaned;
            args.changes.forEach(function (c) {
                if (c.type === ArrayChangeType.remove) {
                    if (c.startIndex === index) {
                        index = -1;
                        isOrphaned = true;
                    } else if (c.startIndex < index) {
                        if (c.items.length > index - c.startIndex) {
                            index = -1;
                            isOrphaned = true;
                        } else {
                            index -= c.items.length;
                        }
                    }
                } else if (c.type === ArrayChangeType.add) {
                    if (c.startIndex >= 0) {
                        if (c.startIndex <= index) {
                            index += c.items.length;
                        }
                    }
                }
            });
            if (isOrphaned != _this._isOrphaned) {
                _this._isOrphaned = isOrphaned;
                _this.__ob__.onPropertyChange('isOrphaned', isOrphaned);
            }
            if (index != _this._index) {
                _this._index = index;
                _this.__ob__.onPropertyChange('index', index);
            }
        });
    }

	get index(): number {
        let index = this._index;
        this.__ob__.onPropertyAccess('index', index);
        return index;
    }

	get isOrphaned(): boolean {
        return this._isOrphaned;
    }

    get value(): TValue {
        let list = this.source.value;
        let value = list[this.index];
        this.__ob__.onPropertyAccess('value', value);
        return value as TValue;
    }

    set value(value: TValue) {
        let list = this.source.value;

        let previousValue = list[this.index];

        if (value !== previousValue) {
            list[this.index] = value;

            var eventArgs: PropertyChangeEventArgs = { entity: this.source.source.value, property: this.source.property as Property, newValue: list, oldValue: undefined as any };

            (eventArgs as any)['changes'] = [{ type: ArrayChangeType.replace, startIndex: this.index, endIndex: this.index }];
            (eventArgs as any)['collectionChanged'] = true;

            this.source.property._events.changedEvent.publish(this.source.source.value, eventArgs);

            this.__ob__.onPropertyChange('value', value);
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

        this.__ob__.onPropertyAccess('displayValue', displayValue);
        return displayValue;
    }

    set displayValue(text: string) {
        let list = this.source.value;

        let previousValue = list[this.index];

        let value = this.source.property.format != null ? this.source.property.format.convertBack(text) : text;

        this.value = value;

        if (value !== previousValue) {
            this.__ob__.onPropertyChange('displayValue', text);
        }
    }

    toString(): string {
        return "Source[" + this.index + "]";
    }

}

export interface SourceIndexAdapterConstructor {
    new <TEntity extends Entity, TValue>(source: SourcePathAdapter<TEntity, TValue[]>, index: number): SourceIndexAdapter<TEntity, TValue>;
}
