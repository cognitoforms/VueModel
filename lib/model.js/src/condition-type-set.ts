import { Event, EventSubscriber } from "./events";
import { ObservableArray } from "./observable-array";
import { ConditionType } from "./condition-type";
import { Condition, ConditionsChangedEventArgs } from "./condition";

const allConditionTypeSets: { [id: string]: ConditionTypeSet; } = {};

/** Groups condition types into a set in order to be notified conditions for these types change. */
export class ConditionTypeSet {

	name: string;
	types: ConditionType[];
	conditions: ObservableArray<Condition>;

	readonly _events: ConditionTypeSetEvents;

	/**
	* Creates a set of condition types.
	* @param name The name of the set
	*/
	constructor(name: string) {

		if (allConditionTypeSets[name])
			throw new Error("A set with the name \"" + name + "\" has already been created.");

		this.name = name;
		this.types = [];
		this.conditions = ObservableArray.create<Condition>();

		Object.defineProperty(this, "_events", { value: new ConditionTypeSetEvents() });

		allConditionTypeSets[name] = this;
	}

	get conditionsChanged(): EventSubscriber<ConditionTypeSet, ConditionsChangedEventArgs> {
		return this._events.conditionsChangedEvent.asEventSubscriber();
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

export class ConditionTypeSetEvents {
	readonly conditionsChangedEvent: Event<ConditionTypeSet, ConditionsChangedEventArgs>;
	constructor() {
		this.conditionsChangedEvent = new Event<ConditionTypeSet, ConditionsChangedEventArgs>();
	}
}
