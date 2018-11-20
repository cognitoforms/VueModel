import { Property } from "../lib/model.js/src/property";
import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceIndexAdapter } from "./source-index-adapter";
import { SourceOptionAdapter } from "./source-option-adapter";

export interface SourceAdapter<TValue> {
    value: TValue;
    displayValue: string;
}

export interface SourcePropertyAdapter<TValue> extends SourceAdapter<TValue> {
    readonly label: string;
    readonly helptext: string;
    readonly property: Property;
    readonly options: SourceOptionAdapter<TValue>[];
}

export function isSourceAdapter(obj: any) {
    if (obj instanceof SourceRootAdapter) return true;
    if (obj instanceof SourcePathAdapter) return true;
    if (obj instanceof SourceIndexAdapter) return true;
    return false;
}

export function isSourcePropertyAdapter(obj: any) {
    if (obj instanceof SourcePathAdapter) return true;
    return false;
}
