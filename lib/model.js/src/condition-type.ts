import { Condition } from "./condition";
import { ConditionTypeSet } from "./condition-type-set";
import { ObservableArray } from "./observable-array";
import { Entity } from "./entity";
import { PropertyPath } from "./property-path";

const allConditionTypes: { [id: string]: ConditionType } = {};

export class ConditionType {

	readonly code: string;
	readonly category: string;
	readonly message: string;
	readonly conditions: ObservableArray<Condition>;
	readonly sets: ObservableArray<ConditionTypeSet>;

	/**
	* Creates a unique type of model condition.
	* @param code The unique condition type code.
	* @param category The category of the condition type, such as "Error", "Warning", or "Permission".
	* @param message The default message to use when the condition is present.
	* @param sets One or more sets the condition type belongs to.
	*/
	constructor(code: string, category: string, message: string, sets?: ConditionTypeSet[]) {

		// Ensure unique condition type codes
		if (allConditionTypes[code])
			throw new Error("A condition type with the code \"" + code + "\" has already been created.");

		this.code = code;
		this.category = category;
		this.message = message;
		// this.rules = [];
		this.conditions = ObservableArray.create<Condition>();
		this.sets = ObservableArray.ensureObservable(sets || []);

		// Register with the static dictionary of all condition types
		allConditionTypes[code] = this;
	}

	/**
	* Adds or removes a condition from the model for the specified target if necessary.
	* @param condition Whether or not the condition should be present
	* @param target The target instance
	* @param properties The properties to attach the condition to
	* @param message The condition message (or a function to generate the message)
	*/
	when(condition: boolean, target: Entity, properties: PropertyPath[], message: string | ((target: Entity) => string)): Condition | void {

		// get the current condition if it exists
		var conditionTarget = target.meta.getCondition(this);

		// add the condition on the target if it does not exist yet
		if (condition) {

			// if the message is a function, invoke to get the actual message
			message = message instanceof Function ? message(target) : message;

			// create a new condition if one does not exist
			if (!conditionTarget) {
				return new Condition(this, message, target, properties);
			}

			// replace the condition if the message has changed
			else if (message && message != conditionTarget.condition.message) {

				// destroy the existing condition
				conditionTarget.condition.destroy();

				// create a new condition with the updated message
				return new Condition(this, message, target, properties);
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

export class ErrorConditionType extends ConditionType {
	constructor(code: string, message: string, sets?: ConditionTypeSet[]) {
		super(code, "Error", message, sets);
	}
}

export interface ErrorConditionTypeConstructor {
	new(code: string, message: string, sets?: ConditionTypeSet[]): ErrorConditionType;
}

export class WarningConditionType extends ConditionType {
	constructor(code: string, message: string, sets?: ConditionTypeSet[]) {
		super(code, "Warning", message, sets);
	}
}

export interface WarningConditionTypeConstructor {
	new(code: string, message: string, sets?: ConditionTypeSet[]): WarningConditionType;
}

export class PermissionConditionType extends ConditionType {

	isAllowed: boolean;

	constructor(code: string, message: string, sets?: ConditionTypeSet[], isAllowed: boolean = true) {
		super(code, "Warning", message, sets);

		this.isAllowed = !(isAllowed === false);
	}
}

export interface PermissionConditionTypeConstructor {
	new(code: string, message: string, sets?: ConditionTypeSet[], isAllowed?: boolean): PermissionConditionType;
}

export namespace ConditionType {

	export type Error = ErrorConditionType;
	export const Error = ErrorConditionType;

	export type Warning = WarningConditionType;
	export const Warning  = WarningConditionType;

	export type Permission = PermissionConditionType;
	export const Permission  = PermissionConditionType;

}
