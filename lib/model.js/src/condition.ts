import { PathTokens$normalizePaths } from "./path-tokens";
import { FormatError$getConditionType } from "./format-error";
import { Entity } from "./entity";
import { ConditionType } from "./condition-type";
import { ConditionTarget } from "./condition-target";

export class Condition {

	type: ConditionType;
	message: string;
	origin: string;
	targets: ConditionTarget[];

	/**
		* Creates a condition of a specific type associated with one or more entities in a model.
		* @param type The type of condition, which usually is an instance of a subclass like Error, Warning or Permission.
		* @param message The optional message to use for the condition, which will default to the condition type message if not specified.
		* @param target The root target entity the condition is associated with.
		* @param properties The set of property paths specifying which properties and entities the condition should be attached to.
		* @param origin The original source of the condition, either "client" or "server".
		*/
	constructor(type: ConditionType, message: string, target: Entity, properties: string[], origin: string = null) {

		this.type = type;
		this.message = message || (type ? type.message : undefined);
		this.origin = origin;

		let targets: ConditionTarget[] = [];

		// create targets if a root was specified
		if (target) {

			// set the properties to an empty array if not specified and normalize the paths to expand {} syntax if used
			let paths = PathTokens$normalizePaths(properties || []);

			// create a single condition target if the specified properties are all on the root
			if (paths.every(function (p) { return p.steps.length === 1; }))
				targets.push(new ConditionTarget(this, target, paths.map(path => target.meta.type.getProperty(path.expression))));

			// otherwise, process the property paths to create the necessary sources
			else {

				// process each property path to build up the condition sources
				for (let p = paths.length - 1; p >= 0; p--) {
					let steps = paths[p].steps;
					let instances = [target];

					let leaf = steps.length - 1;

					// iterate over each step along the path
					for (let s = 0; s < steps.length; s++) {
						let step = steps[s].property;
						let childInstances: Entity[] = [];

						// create condition targets for all instances for the current step along the path
						for (let i = instances.length - 1; i >= 0; i--) {
							let instance = instances[i];

							// get the property for the current step and instance type and skip if the property cannot be found
							let property = instance.meta.type.getProperty(step);
							if (!property) {
								continue;
							}

							// only create conditions on the last step, the leaf node
							if (s === leaf) {
								// see if a target already exists for the current instance
								let conditionTarget = null;
								for (let t = targets.length - 1; t >= 0; t--) {
									if (targets[t].target === instance) {
										conditionTarget = targets[t];
										break;
									}
								}

								// create the condition target if it does not already exist
								if (!conditionTarget) {
									conditionTarget = new ConditionTarget(this, instance, [property]);
									targets.push(conditionTarget);
								}

								// otherwise, just ensure it references the current step
								else if (conditionTarget.properties.indexOf(property) < 0)
									conditionTarget.properties.push(property);
							}

							// get the value of the current step
							var child = property.value(instance);

							// add the children, if any, to the set of child instances to process for the next step
							if (child instanceof Entity)
								childInstances.push(child);
							else if (child instanceof Array && child.length > 0 && child[0] instanceof Entity)
								childInstances = childInstances.concat(child);
						}

						// assign the set of instances to process for the next step
						instances = childInstances;
					}
				}
			}
		}

		// store the condition targets
		Object.defineProperty(this, "targets", { value: targets });

		// raise events for the new condition
		if (type != FormatError$getConditionType()) {

			let conditionType = type;

			// raise events on condition targets
			for (var t = targets.length - 1; t >= 0; t--) {
				let conditionTarget = targets[t];
				let objectMeta = conditionTarget.target.meta;

				// instance events
				objectMeta._events.conditionsChangedEvent.publish(objectMeta, { conditionTarget: conditionTarget, add: true });

				// type events
				for (var objectType = conditionTarget.target.meta.type; objectType != null; objectType = objectType.baseType) {
					objectType._events.conditionsChangedEvent.publish(objectType, { conditionTarget: conditionTarget, add: true });
				}
			}

			// Add the condition to the corresponding condition type
			conditionType.conditions.push(this);
			conditionType._events.conditionsChangedEvent.publish(this.type, { condition: this, add: true });

			// Add the condition to relevant condition type sets
			if (this.type.sets) {
				for (var s = this.type.sets.length - 1; s >= 0; s--) {
					var set = this.type.sets[s];
					set.conditions.push(this);
					set._events.conditionsChangedEvent.publish(set, { condition: this, add: true });
				}
			}
		}
	}

	destroy() {
		/// <summary>Removes the condition targets from all target instances and raises condition change events.</summary>

		// raise events on condition type sets
		if (this.type.sets) {
			for (var s = this.type.sets.length - 1; s >= 0; s--) {
				var set = this.type.sets[s];
				set.conditions.remove(this);
			}
		}

		// raise events on condition types
		this.type.conditions.remove(this);

		for (var t = this.targets.length - 1; t >= 0; t--) {
			var conditionTarget = this.targets[t];
			var objectMeta = conditionTarget.target.meta;

			objectMeta.clearCondition(conditionTarget.condition.type);

			// instance events
			objectMeta._events.conditionsChangedEvent.publish(conditionTarget.target.meta, { conditionTarget: conditionTarget, remove: true });

			// type events
			for (var objectType = conditionTarget.target.meta.type; objectType != null; objectType = objectType.baseType) {
				objectType._events.conditionsChangedEvent.publish(objectType, { conditionTarget: conditionTarget, add: false, remove: true });
			}
		}

		// remove references to all condition targets
		this.targets.splice(0);
	}

	toString() {
		return this.message;
	}

}

export interface ConditionConstructor {
	new(type: ConditionType, message: string, target: Entity, properties: string[], origin?: string): Condition;
}

export interface ConditionsChangedEventArgs {
	condition: Condition;
	add?: boolean;
	remove?: boolean;
}
