import { ErrorConditionType } from "./condition-type";
import { Entity } from "./entity";
import { Property } from "./property";
import { Condition } from "./condition";

export class FormatError {
	readonly messageTemplate: string;
	readonly invalidValue: any;

	static ConditionType: ErrorConditionType = null;

	constructor(message: string, invalidValue: any) {
		if (FormatError.ConditionType === null) {
			FormatError.ConditionType = new ErrorConditionType("FormatError", "The value is not properly formatted.");
		}

		this.messageTemplate = message;
		this.invalidValue = invalidValue;
	}

	createCondition(target: Entity, prop: Property): Condition {
		return new Condition(FormatError.ConditionType, this.messageTemplate.replace("{property}", prop.label), target, [prop]);
	}

	toString() {
		return this.invalidValue;
	}
}
