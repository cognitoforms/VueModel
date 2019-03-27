import { ObservableArray } from "./observable-array";
import { ConditionType } from "./condition-type";
import { Condition } from "./condition";

const allConditionTypeSets: { [id: string]: ConditionTypeSet; } = {};

/** Groups condition types into a set in order to be notified conditions for these types change. */
export class ConditionTypeSet {
	readonly name: string;
	readonly types: ObservableArray<ConditionType>;
	readonly conditions: ObservableArray<Condition>;

	/**
	* Creates a set of condition types.
	* @param name The name of the set
	*/
	constructor(name: string) {
		if (allConditionTypeSets[name])
			throw new Error(`A set with the name '${name}' has already been created.`);

		this.name = name;
		this.types = ObservableArray.create<ConditionType>();
		this.conditions = ObservableArray.create<Condition>();

		allConditionTypeSets[name] = this;
	}

	/**
	* Gets all condition type sets that have been created.
	* @returns Array of all condition type sets.
	* */
	static all() {
		let all: ConditionTypeSet[] = [];

		for (let type in allConditionTypeSets.keys) {
			all.push(allConditionTypeSets[type]);
		}

		return all;
	}

	/**
	* Gets the condition type set with the specified name.
	* @param name
	*/
	static get(name: string): ConditionTypeSet {
		return allConditionTypeSets[name];
	}
}
