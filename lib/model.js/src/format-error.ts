import { ErrorConditionType } from "./condition-type";
import { Entity } from "./entity";
import { Property } from "./property";
import { Condition } from "./condition";

export class FormatError {

	readonly message: string;
	readonly invalidValue: any;

	static _conditionType: ErrorConditionType;

	constructor(message: string, invalidValue: any) {
		Object.defineProperty(this, "message", { value: message });
		Object.defineProperty(this, "invalidValue", { value: invalidValue });
	}

	createCondition(target: Entity, prop: Property) {
		return new Condition(FormatError$getConditionType(),
			this.message.replace("{property}", prop.label),
			target,
			[prop]);
	}

	toString() {
		return this.invalidValue;
	}
}

export function FormatError$getConditionType(): ErrorConditionType {
	if (!FormatError._conditionType) {
		FormatError._conditionType = new ErrorConditionType("FormatError", "The value is not properly formatted.", []);
	}

	return FormatError._conditionType;
}
