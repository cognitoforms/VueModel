import { Event, EventObject, EventSubscriber } from "./events";
import { Format } from "./format";
import { Type, EntityType, isEntityType } from "./type";
import { ObjectMeta } from "./object-meta";
import { Property, Property$init, Property$setter } from "./property";
import { ObjectLookup } from "./helpers";

export class Entity {
	static ctorDepth: number = 0;

	readonly meta: ObjectMeta;

	readonly accessed: EventSubscriber<Entity, EntityAccessEventArgs>;
	readonly changed: EventSubscriber<Entity, EntityChangeEventArgs>;

	constructor(); // Prototype assignment *** used internally
	constructor(type: Type, id: string, properties?: ObjectLookup<any>); // Construct existing instance with state
	constructor(type: Type, properties?: ObjectLookup<any>); // Construct new instance with state
	constructor(type?: Type, id?: string | ObjectLookup<any>, properties?: ObjectLookup<any>) {
		if (arguments.length === 0) {
			// TODO: Warn about direct call in dev build?
		}
		else if (Entity.ctorDepth === 0)
			throw new Error("Entity constructor should not be called directly.");
		else {
			this.accessed = new Event<Entity, EntityAccessEventArgs>();
			this.changed = new Event<Entity, EntityChangeEventArgs>();

			var isNew: boolean;

			if (typeof id === "string")
				type.assertValidId(id);
			else {
				// Was id provided as undefined, or not provided at all?
				if (arguments.length === 2)
					properties = id;
				id = type.newId();
				isNew = true;
			}

			this.meta = new ObjectMeta(type, this, id, isNew);

			// Register the newly constructed instance
			type.register(this);

			// Initialize existing entity with provided property values
			if (!isNew && properties)
				this.init(properties);

			// Raise the initNew or initExisting event on this type and all base types
			for (let t = type; t; t = t.baseType) {
				if (isNew)
					(t.initNew as Event<Type, EntityInitExistingEventArgs>).publish(t, { entity: this });
				else
					(t.initExisting as Event<Type, EntityInitExistingEventArgs>).publish(t, { entity: this });
			}

			// Set values of new entity for provided properties
			if (isNew && properties)
				this.set(properties);
		}
	}

	private static getSortedPropertyData(properties: ObjectLookup<any>) {
		return Object.entries(properties).sort((a: [string, any], b: [string, any]) => {
			return Number(b[1] instanceof Entity) - Number(a[1] instanceof Entity);
		});
	}

	private init(properties: ObjectLookup<any>): void;
	private init(property: string, value: any): void;
	private init(property: any, value?: any): void {
		if (Entity.ctorDepth === 0) {
			throw new Error("Entity.init() should not be called directly.");
		}

		let properties: ObjectLookup<any>;

		// Convert property/value pair to a property dictionary
		if (typeof property === "string") {
			properties = {};
			properties[property] = value;
		}
		else {
			properties = property;
		}

		// Pass all unspecified properties through the deserializer to allow initialization logic via converters
		for (const prop of this.meta.type.properties.filter(p => !(p.name in properties))) {
			const value = this.serializer.deserialize(this, undefined, prop);
			if (value !== undefined)
				Property$init(prop, this, value);
		}

		// Initialize the specified properties
		for (const [propName, state] of Entity.getSortedPropertyData(properties)) {
			const prop = this.serializer.resolveProperty(this, propName);
			if (prop) {
				let value;
				if (isEntityType(prop.propertyType)) {
					if (prop.isList && Array.isArray(state))
						value = state.map(s => this.serializer.deserialize(this, s, prop));
					else
						value = this.serializer.deserialize(this, state, prop);
				}
				else if (prop.isList && Array.isArray(state))
					value = state.map(i => this.serializer.deserialize(this, i, prop));
				else
					value = this.serializer.deserialize(this, state, prop);

				Property$init(prop, this, value);
			}
		}
	}

	set(properties: ObjectLookup<any>): void;
	set(property: string, value: any): void;
	set(property: any, value?: any): void {
		let properties: ObjectLookup<any>;

		// Convert property/value pair to a property dictionary
		if (typeof property === "string") {
			properties = {};
			properties[property] = value;
		}
		else {
			properties = property;
		}

		// Set the specified properties
		for (let [propName, state] of Entity.getSortedPropertyData(properties)) {
			const prop = this.meta.type.getProperty(propName);
			if (prop) {
				let value;
				const currentValue = prop.value(this);
				if (isEntityType(prop.propertyType)) {
					const ChildEntity = prop.propertyType;
					if (prop.isList && Array.isArray(state) && Array.isArray(currentValue)) {
						state.forEach((s, idx) => {
							if (!(s instanceof ChildEntity))
								s = this.serializer.deserialize(this, s, prop, false);

							// Modifying/replacing existing list item
							if (idx < currentValue.length) {
								if (s instanceof ChildEntity)
									state.splice(idx, 1, s);
								else
									currentValue[idx].set(s);
							}
							// Add a list item
							else
								currentValue.push(s instanceof ChildEntity ? s : new ChildEntity(s.$id, s));
						});
					}
					else if (state instanceof ChildEntity)
						value = state;
					else if (state instanceof Object) {
						state = this.serializer.deserialize(this, state, prop, false);
						// Update the entity's state
						if (currentValue)
							currentValue.set(state);
						else
							value = new ChildEntity(state.$id, state);
					}
				}
				else if (prop.isList && Array.isArray(state) && Array.isArray(currentValue))
					currentValue.splice(0, currentValue.length, ...state.map(s => this.serializer.deserialize(this, s, prop)));
				else
					value = this.serializer.deserialize(this, state, prop);

				if (value !== undefined)
					Property$setter(prop, this, value);
			}
		}
	}

	get(property: string): any {
		return this.meta.type.getProperty(property).value(this);
	}

	toString(format?: string): string {
		// Get the entity format to use
		let formatter: Format<Entity> = null;
		if (format) {
			formatter = this.meta.type.model.getFormat<Entity>(this.constructor as EntityType, format);
		}
		else {
			formatter = this.meta.type.format;
		}

		// Use the formatter, if available, to create the string representation
		if (formatter) {
			return formatter.convert(this);
		}
		else {
			return `${this.meta.type.fullName}|${this.meta.id}`;
		}
	}

	get serializer() {
		return this.meta.type.model.serializer;
	}

	/**
	 * Produces a JSON-valid object representation of the entity.
	 * @param entity
	 */
	serialize(): object {
		return this.serializer.serialize(this);
	}
}

export interface EntityConstructor {
	new(): Entity;
	new(id: string, properties?: ObjectLookup<any>): Entity; // Construct existing instance with state
	new(properties?: ObjectLookup<any>): Entity; // Construct new instance with state
	new(id?: string | ObjectLookup<any>, properties?: ObjectLookup<any>): Entity;
}

export interface EntityConstructorForType<TEntity extends Entity> extends EntityConstructor {
	new(): TEntity;
	new(id: string, properties?: ObjectLookup<any>): TEntity; // Construct existing instance with state
	new(properties?: ObjectLookup<any>): TEntity; // Construct new instance with state
	new(id?: string | ObjectLookup<any>, properties?: ObjectLookup<any>): TEntity;
	meta: Type;
}

export interface EntityRegisteredEventArgs {
	entity: Entity;
}

export interface EntityUnregisteredEventArgs {
	entity: Entity;
}

export interface EntityInitNewEventArgs {
	entity: Entity;
}

export interface EntityInitExistingEventArgs {
	entity: Entity;
}

export interface EntityDestroyEventArgs {
	entity: Entity;
}

export interface EntityAccessEventHandler {
	(this: Property, args: EventObject & EntityAccessEventArgs): void;
}

export interface EntityAccessEventArgs {
	entity: Entity;
	property: Property;
}

export interface EntityChangeEventHandler {
	(this: Property, args: EventObject & EntityChangeEventArgs): void;
}

export interface EntityChangeEventArgs {
	entity: Entity;
	property: Property;
	oldValue?: any;
	newValue: any;
}
