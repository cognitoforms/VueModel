import { ValidationRule } from "./validation-rule";
import { Entity } from "./entity";
import { Type } from "./type";


export class ListLengthRule extends ValidationRule {
	constructor(rootType: Type, options: any) {

		// ensure the rule name is specified
		options.name = options.name || "ListLength";

		options.message = function (this: Entity): string {
			var range: { min?: number; max?: number } = {};

			if (options.min && options.min instanceof Function) {
				try {
					range.min = options.min.call(this);
				}
				catch (e) {
					// Silently ignore min errors
				}
			}
			else if (typeof (options.min) === "number") {
				range.min = options.min;
			}

			if (options.max && options.max instanceof Function) {
				try {
					range.max = options.max.call(this);
				}
				catch (e) {
					// Silently ignore max errors
				}
			}
			else if (typeof (options.min) === "number") {
				range.min = options.min;
			}

			var val: Array<Entity> = options.property.value(this);

			if (!val) {
				return null;
			}

			if ((range.min == null || val.length >= range.min) && (range.max == null || val.length <= range.max)) {
				// Value is within range
				return null;
			}

			if (range.min != null && range.max != null)
				return rootType.model.getResource("listlength-between").replace("{min}", range.min.toString()).replace("{max}", range.max.toString());

			if (range.min != null)
				return rootType.model.getResource("listlength-at-least").replace("{min}", range.min.toString());
			else
				return rootType.model.getResource("listlength-at-most").replace("{max}", range.max.toString());
		};

		// call the base type constructor
		super(rootType, options);
	}

}
