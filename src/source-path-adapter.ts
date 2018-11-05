import { Entity } from "../lib/model.js/src/entity";
import { Property } from "../lib/model.js/src/property";
import { SourceAdapter, SourcePropertyAdapter } from "./source-adapter";

export class SourcePathAdapter<TEntity extends Entity, TValue> implements SourcePropertyAdapter, SourceAdapter<TValue> {

    // Public read-only properties: aspects of the object that cannot be
    // changed without fundamentally changing what the object is
    readonly source: SourceAdapter<TEntity>;
    readonly path: string;

    // TODO: Support format options
    // private _format: string;

    constructor(source: SourceAdapter<TEntity>, path: string) {
        // Public read-only properties
        Object.defineProperty(this, "source", { enumerable: true, value: source });
        Object.defineProperty(this, "path", { enumerable: true, value: path });
    }

    get property(): Property {
        // TODO: Support multi-hop path
        return this.source.value.meta.type.property(this.path);
    }

    get label(): string {
        return this.property.label;
    }

    get helptext(): string {
        return this.property.helptext;
    }

    get value(): TValue {
        return this.property.value(this.source.value) as any;
    }

    set value(value: TValue) {
        this.property.value(this.source.value, value);
    }

    get displayValue(): string {
        let value = this.property.value(this.source.value) as any;

        let displayValue: string | Array<string>;

        if (value === null || value === undefined) {
            displayValue = "";
        } else if (this.property.format != null) {
            // Use a markup or property format if available
            if (Array.isArray(value)) {
                let array = value as Array<any>;
                displayValue = array.map((item: TValue) => this.property.format.convert(item));
            } else {
                displayValue = this.property.format.convert(value);
            }
        } else if (Array.isArray(value)) {
            // If no format exists, then fall back to toString
            let array = value as Array<any>;
            displayValue = array.map((item: TValue) => {
                if (value === null || value === undefined) {
                    return "";
                } else {
                    return item.toString();
                }
            });
        } else {
            displayValue = value.toString();
        }

        return Array.isArray(displayValue) ? displayValue.join(", ") : displayValue;
    }

    set displayValue(text: string) {
        this.value = this.property.format != null ? this.property.format.convertBack(text) : text;
    }

    toString(): string {
        return "Source['" + this.path + "']";
    }

}
