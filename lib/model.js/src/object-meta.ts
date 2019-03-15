import { Event, EventSubscriber } from "./events";
import { FormatError$getConditionType } from "./format-error";
import { Type } from "./type";
import { Entity, EntityDestroyEventArgs } from "./entity";
import { ConditionTarget, ConditionTargetsChangedEventArgs } from "./condition-target";
import { ConditionType, PermissionConditionType } from "./condition-type";

export class ObjectMeta {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what it represents
	readonly type: Type;
	// TODO: Is this needed? Technically you can look it up by id if needed...
	readonly entity: Entity;
	
	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
	private _id: string;
	private _isNew: boolean;
	private _legacyId: string;
	private _conditions: { [code: string]: ConditionTarget };

	readonly conditionsChanged: EventSubscriber<ObjectMeta, ConditionTargetsChangedEventArgs>;

	constructor(type: Type, entity: Entity, id: string, isNew: boolean) {
		// Public read-only properties
		Object.defineProperty(this, "type", { enumerable: true, value: type });
		Object.defineProperty(this, "entity", { enumerable: true, value: entity });

		// Public settable properties that are simple values with no side-effects or logic
		Object.defineProperty(this, "_id", { enumerable: false, value: id, writable: true });
		Object.defineProperty(this, "_isNew", { enumerable: false, value: isNew, writable: true });
		Object.defineProperty(this, "_conditions", { enumerable: false, value: {}, writable: true });

		this.conditionsChanged = new Event<ObjectMeta, ConditionTargetsChangedEventArgs>();
	}

	get id(): string {
		// TODO: Obfuscate backing field name?
		return this._id;
	}

	set id(value) {
		// TODO: Implement logic to change object ID?
		this._id = value;
	}

	get isNew(): boolean {
		// TODO: Obfuscate backing field name?
		// TODO: Implement logic to mark object as no longer new?
		return this._isNew;
	}

	get legacyId(): string {
		// TODO: Obfuscate backing field name?
		return this._legacyId;
	}

	set legacyId(value) {
		// TODO: Don't allow setting legacy ID if already set
		this._legacyId = value;
	}

	// gets the condition target with the specified condition type
	getCondition(conditionType: ConditionType): ConditionTarget {
		return this._conditions[conditionType.code];
	}

	// stores the condition target for the current instance
	setCondition(conditionTarget: ConditionTarget) {
		if (conditionTarget.condition.type != FormatError$getConditionType()) {
			this._conditions[conditionTarget.condition.type.code] = conditionTarget;
		}
	}

	// clears the condition for the current instance with the specified condition type
	clearCondition(conditionType: ConditionType): void {
		delete this._conditions[conditionType.code];
	}

	// determines if the set of permissions are allowed for the current instance
	isAllowed(/*codes*/) {
		if (arguments.length === 0) {
			return undefined;
		}

		// ensure each condition type is allowed for the current instance
		for (var c = arguments.length - 1; c >= 0; c--) {
			var code = arguments[c];
			var conditionType = ConditionType.get(code);

			// return undefined if the condition type does not exist
			if (conditionType === undefined) {
				return undefined;
			}

			// throw an exception if the condition type is not a permission
			if (!(conditionType instanceof PermissionConditionType)) {
				throw new Error("Condition type \"" + code + "\" should be a Permission.");
			}

			// return false if a condition of the current type exists and is a deny permission or does not exist and is a grant permission
			if (this._conditions[conditionType.code] ? !conditionType.isAllowed : conditionType.isAllowed) {
				return false;
			}
		}

		return true;
	}

	// TODO: Should this be a method on the entity itself, or a static method on Entity?
	destroy() {
		this.type.unregister(this.entity);

		// Raise the destroy event on this type and all base types
		for (var t = this.type; t; t = t.baseType) {
			(t.destroy as Event<Type, EntityDestroyEventArgs>).publish(t, { entity: this.entity });
		}
	}
}
