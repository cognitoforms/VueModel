import { Entity, Property } from "exomodel";

export class FieldAdapter<TEntity extends Entity, TValue> {

    // Public read-only properties: aspects of the field adapter that cannot be
    // changed without fundamentally changing what the field adapter is
    readonly entity: TEntity;
    readonly source: string;

    // TODO: Support format options
    // private _format: string;

    constructor(entity: TEntity, source: string) {
        // Public read-only properties
        Object.defineProperty(this, "entity", { enumerable: true, value: entity });
        Object.defineProperty(this, "source", { enumerable: true, value: source });
    }

    get property(): Property {
        // TODO: Support multi-hop source
        return this.entity.meta.type.property(this.source);
    }

    get label(): string {
        return this.property.label;
    }

    get helptext(): string {
        return this.property.helptext;
    }

    get value(): TValue {
        var value = this.property.value(this.entity) as any;
        return value as TValue;
    }

    set value(value: TValue) {
        this.property.value(this.entity, value);
    }

    get displayValue(): string {
        var value = this.property.value(this.entity) as any;

        if (this.property.format != null) {
            return this.property.format.convert(value);
        }

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
        if (this.property.format != null) {
            var value = this.property.format.convertBack(text);
            this.property.value(this.entity, value);
        } else {
            this.property.value(this.entity, text);
        }
    }
}
