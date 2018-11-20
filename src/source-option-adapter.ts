import { SourcePropertyAdapter } from "./source-adapter";
import { CustomObserver } from "./custom-observer";
import { SourcePathAdapter$_formatDisplayValue } from "./source-path-adapter";

export class SourceOptionAdapter<TValue> {

    // Public read-only properties: aspects of the object that cannot be
    // changed without fundamentally changing what the object is
    readonly source: SourcePropertyAdapter<TValue>;

    readonly _value: TValue;

    __ob__: CustomObserver<SourceOptionAdapter<TValue>>;

    constructor(source: SourcePropertyAdapter<TValue>, value: TValue) {
        // Public read-only properties
        Object.defineProperty(this, "source", { enumerable: true, value: source });
        Object.defineProperty(this, "_value", { enumerable: true, value: value });

        Object.defineProperty(this, "__ob__", { configurable: false, enumerable: false, value: new CustomObserver(this), writable: false });
    }

    get label(): string {
        // TODO: Make observable if label is dynamic
        return this.source.label;
    }

    get value(): TValue {
        let value = this._value;
        this.__ob__.onPropertyAccess('value', value);
        return value;
    }
    
    get displayValue(): string {
        let value = this._value;
        let displayValue: string = SourcePathAdapter$_formatDisplayValue.call(this.source, value);
        this.__ob__.onPropertyAccess('displayValue', displayValue);
        return displayValue;
    }

    toString(): string {
        return "Option for Source['" + this.source.property.name + "']";
    }

}
