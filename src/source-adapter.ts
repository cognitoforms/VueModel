import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceItemAdapter } from "./source-item-adapter";
import { SourceOptionAdapter } from "./source-option-adapter";
import { Entity } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { PropertyPath } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates

export interface SourceAdapterOverrides {
	label?: string;
	helptext?: string;
	readonly?: boolean;
	required?: boolean;
}

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

export function hasOverrideValue(value: any, type: StringConstructor | BooleanConstructor): boolean {
	if (type === String) {
		return typeof value === "string" && value.length > 0;
	}
	else if (type === Boolean) {
		return typeof value === "boolean";
	}
}
