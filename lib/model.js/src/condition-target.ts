import { Condition } from "./condition";
import { Entity } from "./entity";
import { Property } from "./property";

/** Represents the association of a condition to a specific target entity. */
export class ConditionTarget {

	/** The condition the target is for. */
	condition: Condition;

	/** The target entity the condition is associated with. */
	target: Entity;

	/** The set of properties on the target entity the condition is related to. */
	properties: Property[];

	/**
	* Creates the association of a condition to a specific target entity.
	* @param condition The condition the target is for.
	* @param target The target entity the condition is associated with.
	* @param properties The set of properties on the target entity the condition is related to.
	*/
	constructor(condition: Condition, target: Entity, properties: Property[]) {

		this.condition = condition;
		this.target = target;
		this.properties = properties;

		// Attach the condition target to the target entity.
		target.meta.setCondition(this);
	}

}

export interface ConditionTargetConstructor {
	new(condition: Condition, target: Entity, properties: Property[]): ConditionTarget;
}

export interface ConditionTargetsChangedEventArgs {
	conditionTarget: ConditionTarget;
	add?: boolean;
	remove?: boolean;
}
