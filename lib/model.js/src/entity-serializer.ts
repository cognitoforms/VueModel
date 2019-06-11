import { isEntityType, Type } from "./type";
import { Entity } from "./entity";
import { Property } from "./property";

export interface PropertySerializationResult {
	key: string;
	value: any;
}

export const IgnoreProperty: PropertySerializationResult = {
	key: "ignore",
	value: "ignore"
};

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
export class PropertyConverter {
	/**
	 * @param context The `Entity` containing the specified property.
	 * @param prop The property being serialized/deserialized.
	 */
	shouldConvert(context: Entity, prop: Property): boolean {
		return true;
	}
	/**
	 * Return `IgnoreProperty` to prevent serialization of the property.
	 * @param context The `Entity` containing the specified property.
	 * @param prop The current property being serialized.
	 * @param value The value of the property on the entity currently being serialized.
	 */
	serialize(context: Entity, value: any, property: Property): PropertySerializationResult {
		const result = { key: property.name, value };
		if (value) {
			if (isEntityType(property.propertyType)) {
				if (property.isList && Array.isArray(value))
					result.value = value.map((ent: Entity) => ent.serialize());
				else
					result.value = value.serialize();
			}
			else if (property.isList)
				result.value = value.slice();
		}
		return result;
	}
	/**
	 * Return `IgnoreProperty` to prevent deserialization of the property.
	 * @param context The `Entity` containing the specified property.
	 * @param prop The current property being deserialized.
	 * @param value The value to deserialize.
	 */
	deserialize(context: Entity, value: any, property: Property): any {
		return value;
	}
}

export class EntitySerializer {
	private _propertyConverters: PropertyConverter[] = [];
	private _propertyInjectors = new Map<Type | string, PropertyInjector[]>();
	private static defaultPropertyConverter = new PropertyConverter();

	/**
	 * Property converters should be registered in order of increasing specificity.
	 * If two converters would convert a property, only the one registered last will apply.
	 */
	registerPropertyConverter(converter: PropertyConverter): void {
		this._propertyConverters.unshift(converter);
	}

	/**
	 * Property injections will occur when serializing entities of the specified type, or entities which
	 * inherit from the specified type. Injected properties will appear before model properties in the serialized
	 * output.
	 * @param type Either a Type or the fullName of a Type
	 * @param injector 
	 */
	registerPropertyInjector(type: Type | string, injector: PropertyInjector): void {
		let injectors = this._propertyInjectors.get(type) || [];
		injectors.push(injector);
		this._propertyInjectors.set(type, injectors);
	}

	/**
	 * Returns the property injectors registered for a specific type, including name-based registrations.
	 * @param type 
	 */
	private getInjectorsOrDefault(type: Type): PropertyInjector[] {
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
	serialize(entity: Entity, serializeNull: boolean = false): object {
		let result: object = {};
		const type = entity.meta.type;
		this.getPropertyInjectors(type).flatMap(i => i.inject(entity))
			.concat(type.properties
				.filter(p => !p.isCalculated && !p.isConstant)
				.map(prop => {
					let value = prop.value(entity);
					let converter = this._propertyConverters.find(c => c.shouldConvert(entity, prop));
					if (converter)
						return converter.serialize(entity, value, prop);
					return EntitySerializer.defaultPropertyConverter.serialize(entity, value, prop);
				}))
			.forEach(pair => {
				if (pair && pair !== IgnoreProperty) {
					if (result.hasOwnProperty(pair.key))
						throw new Error(`Property '${pair.key}' was encountered twice during serialization. Make sure injected properties do not collide with model properties.`);

					if (serializeNull || pair.value !== null)
						(result as any)[pair.key] = pair.value;
				}
			});
		return result;
	}

	deserialize(context: Entity, data: any, property: Property, constructEntity = true): any {
		// Apply custom convertors before deserializing
		const converter = this._propertyConverters.find(c => c.shouldConvert(context, property));
		if (converter)
			data = converter.deserialize(context, data, property);
		
		if (data === IgnoreProperty)
			return;

		let value;

		// Entities
		if (isEntityType(property.propertyType)) {
			const ChildEntity = property.propertyType;

			if (!constructEntity)
				value = data;
			// Entity List
			else if (property.isList && Array.isArray(data))
				value = data.map(s => s instanceof ChildEntity ? s : new ChildEntity(s.$id, s));
			// Entity
			else if (data instanceof ChildEntity)
				value = data;
			else if (data instanceof Object)
				value = new ChildEntity(data.$id, data);
		}

		// Value List
		else if (property.isList && Array.isArray(data))
			value = data.map(i => this.deserialize(context, i, property));

		// Value
		else
			value = data;

		return value;
	}
}