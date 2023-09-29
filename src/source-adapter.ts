import { SourceRootAdapter } from "./source-root-adapter";
import { SourcePathAdapter } from "./source-path-adapter";
import { SourceItemAdapter } from "./source-item-adapter";
import { SourceOptionAdapter } from "./source-option-adapter";
import { Entity } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { PropertyPath } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates
import { EntityType, ValueType } from "@cognitoforms/model.js"; // eslint-disable-line import/no-duplicates

export type SourceType = ValueType | EntityType | ObjectConstructor;

export interface SourceAdapterOverrides {
	label?: string;
	helptext?: string;
	readonly?: boolean;
	required?: boolean;
}

export interface SourceAdapter<TValue> {
	readonly readonly: boolean;
    readonly value: TValue;
    readonly displayValue: string;
	readonly type: SourceType;
	readonly isList: boolean;
}

export interface SourcePropertyAdapter<TValue> extends SourceAdapter<TValue> {
    value: TValue;
    displayValue: string;
    readonly label: string;
	readonly helptext: string;
	readonly property: PropertyPath;
	readonly lastTarget: Entity;
    readonly options: SourceOptionAdapter<TValue>[];
}

export function isSourceRootAdapter(obj: any): obj is SourceRootAdapter<Entity> {
	return obj instanceof SourceRootAdapter;
}

export function isSourcePathAdapter(obj: any): obj is SourcePathAdapter<Entity, any> {
	return obj instanceof SourcePathAdapter;
}

export function isSourceItemAdapter(obj: any): obj is SourceItemAdapter<Entity, any> {
	return obj instanceof SourceItemAdapter;
}

export function isSourceAdapter(obj: any, allowAnyObject: boolean = true): obj is SourceAdapter<Entity> {
	if (isSourceRootAdapter(obj)) return true;
	if (isSourcePathAdapter(obj)) return true;
	if (isSourceItemAdapter(obj)) return true;
	if (allowAnyObject && typeof obj === "object") return true;
	return false;
}

export function isSourcePropertyAdapter(obj: any): obj is SourcePropertyAdapter<any> {
	if (isSourcePathAdapter(obj)) return true;
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
