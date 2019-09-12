import { isEntityType, Type } from "./type";
import { Entity } from "./entity";
import { Property } from "./property";


export interface PropertySerializationResult {
	key: string;
	value: any;
}

/**
 * Allows additional key/value pairs to be introduced to serialization output.
 * Note: duplicate keys will favor model properties.
 */
export interface PropertyInjector {
	inject(entity: Entity): PropertySerializationResult[];
}

/**
 * Allows transformation of the serialized name and value of a model property.
 */
export interface PropertyConverter {
	shouldConvert(prop: Property): boolean;
	/**
	 * Return null to prevent serialization of the property.
	 * @param prop The current property being serialized.
	 * @param value The value of the property on the entity currently being serialized.
	 */
	serialize(prop: Property, value: any): PropertySerializationResult;
	deserialize(prop: Property, value: any): any;
}

export class EntitySerializer {
	private _propertyConverters: PropertyConverter[] = [];
	private _propertyInjectors = new Map<Type | string, PropertyInjector[]>();

	/**
	 * Property converters should be registered in order of increasing specificity.
	 * If two converters would convert a property, only the one registered last will apply.
	 */
	registerPropertyConverter(converter: PropertyConverter) {
		this._propertyConverters.unshift(converter);
	}

	/**
	 * Property injections will occur when serializing entities of the specified type, or entities which
	 * inherit from the specified type. Injected properties will appear before model properties in the serialized
	 * output.
	 * @param type Either a Type or the fullName of a Type
	 * @param injector 
	 */
	registerPropertyInjector(type: Type | string, injector: PropertyInjector) {
		let injectors = this._propertyInjectors.get(type) || [];
		injectors.push(injector);
		this._propertyInjectors.set(type, injectors);
	}

	/**
	 * Returns the property injectors registered for a specific type, including name-based registrations.
	 * @param type 
	 */
	private getInjectorsOrDefault(type: Type) {
		return (this._propertyInjectors.get(type) || []).concat(this._propertyInjectors.get(type.fullName) || []);
	}

	/**
	 * Returns property injectors registered for a type and its base types.
	 * @param type 
	 */
	private getPropertyInjectors(type: Type): PropertyInjector[] {

		let injectors = [];
		do {
			injectors.push(...this.getInjectorsOrDefault(type));
			type = type.baseType;
		} while (type);
		return injectors;
	}

	/**
	 * Produces a JSON-valid object representation of the entity.
	 * @param entity
	 */
	serialize(entity: Entity, serializeNull: boolean = false): Object {
		let result: Object = {};
		const type = entity.meta.type;
		this.getPropertyInjectors(type).flatMap(i => i.inject(entity))
			.concat(type.properties
				.filter(p => !p.isCalculated && !p.isStatic)
				.map(prop => {
					let value = prop.value(entity);
					let converter = this._propertyConverters.find(c => c.shouldConvert(prop));
					if (converter)
						return converter.serialize(prop, value);
					return EntitySerializer.defaultPropertyConverter(prop, value);
				}))
			.forEach(pair => {
				if (pair) {
					if (result.hasOwnProperty(pair.key))
						throw new Error(`Property '${pair.key}' was encountered twice during serialization. Make sure injected properties do not collide with model properties.`);

					if (serializeNull || pair.value !== null)
						(result as any)[pair.key] = pair.value;
				}
			});
		return result;
	}

	deserialize(data: any, property: Property): any {
		const converter = this._propertyConverters.find(c => c.shouldConvert(property));
		if (converter)
			return converter.deserialize(property, data);
		return data;
	}

	private static defaultPropertyConverter(prop: Property, value: any): PropertySerializationResult {
		let result = { key: prop.name, value };
		if (value) {
			if (isEntityType(prop.propertyType)) {
				if (prop.isList && Array.isArray(value))
					result.value = value.map((ent: Entity) => ent.serialize());
				else
					result.value = value.serialize();
			}
			else if (prop.isList)
				result.value = value.slice();
		}
		return result;
	}
}