import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceItemAdapter } from "./source-item-adapter";
import { SourceOptionAdapter } from "./source-option-adapter";
import { Entity } from "../lib/model.js/src/entity";
import { PropertyPath } from "../lib/model.js/src/property-path";

export interface SourceAdapter<TValue> {
	readonly: boolean;
    value: TValue;
    displayValue: string;
}

export interface SourcePropertyAdapter<TValue> extends SourceAdapter<TValue> {
    readonly label: string;
	readonly helptext: string;
	readonly property: PropertyPath;
	readonly lastTarget: Entity;
    readonly options: SourceOptionAdapter<TValue>[];
}

export function isSourceAdapter(obj: any): obj is SourceRootAdapter<Entity> | SourcePathAdapter<Entity, any> | SourceItemAdapter<Entity, any> {
	if (obj instanceof SourceRootAdapter) return true;
	if (obj instanceof SourcePathAdapter) return true;
	if (obj instanceof SourceItemAdapter) return true;
	return false;
}

export function isSourcePropertyAdapter(obj: any): obj is SourcePathAdapter<Entity, any> {
	if (obj instanceof SourcePathAdapter) return true;
	return false;
}
