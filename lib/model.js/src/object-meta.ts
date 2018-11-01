import { Type } from "./type";
import { Entity } from "./entity";

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

	constructor(type: Type, entity: Entity, id: string, isNew: boolean) {
		// Public read-only properties
		Object.defineProperty(this, "type", { enumerable: true, value: type });
		Object.defineProperty(this, "entity", { enumerable: true, value: entity });

		// Public settable properties that are simple values with no side-effects or logic
		Object.defineProperty(this, "_id", { enumerable: false, value: id, writable: true });
		Object.defineProperty(this, "_isNew", { enumerable: false, value: isNew, writable: true });
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

	// TODO: Should this be a method on the entity itself, or a static method on Entity?
	destroy() {
		this.type.unregister(this.entity);

		// Raise the destroy event on this type and all base types
		for (var t: Type = this.type; t; t = t.baseType) {
			t._eventDispatchers.destroy.dispatch(t, { entity: this.entity });
		}
	}
}
