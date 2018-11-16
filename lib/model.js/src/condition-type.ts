import { Condition, ConditionsChangedEventArgs } from "./condition";
import { ConditionTypeSet } from "./condition-type-set";
import { ObservableList } from "./observable-list";
import { Event, EventSubscriber } from "./events";
import { Entity } from "./entity";

const allConditionTypes: { [id: string]: ConditionType } = {};

export class ConditionType {

	code: string;
	category: string;
	message: string;
	// rules: Rule[];
	conditions: ObservableList<Condition>;
	sets: ConditionTypeSet[];
	origin: string;

	readonly _events: ConditionTypeEvents;

	/**
	* Creates a unique type of model condition.
	* @param code The unique condition type code.
	* @param category The category of the condition type, such as "Error", "Warning", or "Permission".
	* @param message The default message to use when the condition is present.
	* @param origin The origin of the condition, Origin.Client or Origin.Server.
	*/
	constructor(code: string, category: string, message: string, sets: ConditionTypeSet[], origin: string) {

		// Ensure unique condition type codes
		if (allConditionTypes[code])
			throw new Error("A condition type with the code \"" + code + "\" has already been created.");

		this.code = code;
		this.category = category;
		this.message = message;
		// this.rules = [];
		this.conditions = ObservableList.create<Condition>();
		this.sets = sets || [];
		this.origin = origin;

		Object.defineProperty(this, "_events", { value: new ConditionTypeEvents() });

		// Register with the static dictionary of all condition types
		allConditionTypes[code] = this;
	}

	get conditionsChanged(): EventSubscriber<ConditionType, ConditionsChangedEventArgs> {
		return this._events.conditionsChangedEvent.asEventSubscriber();
	}

	/**
	* Adds or removes a condition from the model for the specified target if necessary.
	* @param condition The condition to add/remove
	* @param target The target instance
	* @param properties The properties to attach the condition to
	* @param message The condition message (or a function to generate the message)
	*/
	when(condition: Condition, target: Entity, properties: string[], message: string | ((target: Entity) => string)): Condition | void {

		// get the current condition if it exists
		var conditionTarget = target.meta.getCondition(this);

		// add the condition on the target if it does not exist yet
		if (condition) {

			// if the message is a function, invoke to get the actual message
			message = message instanceof Function ? message(target) : message;

			// create a new condition if one does not exist
			if (!conditionTarget) {
				return new Condition(this, message, target, properties, "client");
			}

			// replace the condition if the message has changed
			else if (message && message != conditionTarget.condition.message) {

				// destroy the existing condition
				conditionTarget.condition.destroy();

				// create a new condition with the updated message
				return new Condition(this, message, target, properties, "client");
			}

			// otherwise, just return the existing condition
			else {
				return conditionTarget.condition;
			}
		}

		// Destroy the condition if it exists on the target and is no longer valid
		if (conditionTarget != null)
			conditionTarget.condition.destroy();

		// Return null to indicate that no condition was created
		return null;
	}

	/**
		* Gets all condition types that have been created.
		* @returns Array of all condition types.
		* */
	static all() {

		let all: ConditionType[] = [];

		for (let type in allConditionTypes.keys) {
			all.push(allConditionTypes[type]);
		}

		return all;
	}

	/**
		* Returns the condition type with the given code, if it exists.
		* @param code The unique code of the condition type to find.
		*/
	static get(code: string) {
		return allConditionTypes[code];
	};
}

export class ConditionTypeEvents {
	readonly conditionsChangedEvent: Event<ConditionType, ConditionsChangedEventArgs>;
	constructor() {
		this.conditionsChangedEvent = new Event<ConditionType, ConditionsChangedEventArgs>();
	}
}

export class ErrorConditionType extends ConditionType {
	constructor(code: string, message: string, sets: ConditionTypeSet[], origin: string = null) {
		super(code, "Error", message, sets, origin);
	}
}

export interface ErrorConditionTypeConstructor {
	new(code: string, message: string, sets: ConditionTypeSet[], origin?: string): ErrorConditionType;
}

export class WarningConditionType extends ConditionType {
	constructor(code: string, message: string, sets: ConditionTypeSet[], origin: string = null) {
		super(code, "Warning", message, sets, origin);
	}
}

export interface WarningConditionTypeConstructor {
	new(code: string, message: string, sets: ConditionTypeSet[], origin?: string): WarningConditionType;
}

export class PermissionConditionType extends ConditionType {

	isAllowed: boolean;

	constructor(code: string, message: string, sets: ConditionTypeSet[], isAllowed: boolean, origin: string = null) {
		super(code, "Warning", message, sets, origin);

		this.isAllowed = isAllowed;
	}
}

export interface PermissionConditionTypeConstructor {
	new(code: string, message: string, sets: ConditionTypeSet[], isAllowed: boolean, origin?: string): PermissionConditionType;
}

export namespace ConditionType {

	export type Error = ErrorConditionType;
	export const Error = ErrorConditionType;

	export type Warning = WarningConditionType;
	export const Warning  = WarningConditionType;

	export type Permission = PermissionConditionType;
	export const Permission  = PermissionConditionType;

}
