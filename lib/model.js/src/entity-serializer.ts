import { Entity, isEntityType, Type } from ".";
import { Property } from "./property";

export interface PropertySerializationResult {
	key: string;
	value: any;
}

export interface PropertyConverter {
	shouldConvert(prop: Property): boolean;
	convert(prop: Property, value: any): PropertySerializationResult;
}

export class EntitySerializer {
	private _converters: PropertyConverter[] = [];

	registerPropertyConverter(converter: PropertyConverter) {
		this._converters.unshift(converter);
	}

	serialize(entity: Entity): any {
		let result: any = {};
		entity.meta.type.properties
			.filter(p => !p.isCalculated && !p.isStatic)
			.map(prop => {
				let value = prop.value(entity);
				let converter = this._converters.find(c => c.shouldConvert(prop));
				if (converter)
					return converter.convert(prop, value);
				return EntitySerializer.defaultPropertyConverter(prop, value);
			}).forEach(serializationResult => {
				// todo: serialize null values?
				if (serializationResult.value !== null)
					result[serializationResult.key] = serializationResult.value;
			});
		return result;
	}

	private static defaultPropertyConverter(prop: Property, value: any): PropertySerializationResult {
		let result = { key: prop.name, value };
		if (value && isEntityType(prop.propertyType)) {
			result.value = value.serialize();
		}
		return result;
	}
}