import { Event, EventObject, EventSubscriber } from "./events";
import { Format } from "./format";
import { Type, EntityType } from "./type";
import { ObjectMeta } from "./object-meta";
import { Property, Property$_init, Property$_setter } from "./property";
import { ObjectLookup } from "./helpers";

export class Entity {

	static ctorDepth: number = 0;

	readonly meta: ObjectMeta;

	readonly accessed: EventSubscriber<Entity, EntityAccessEventArgs>;
	readonly changed: EventSubscriber<Entity, EntityChangeEventArgs>;

	constructor(); // Prototype assignment
	constructor(type: Type, id: string, properties?: { [name: string]: any }); // Construct existing instance with state
	constructor(type: Type, properties?: { [name: string]: any }); // Construct new instance with state
	constructor(type?: Type, id?: string | ObjectLookup<any>, properties?: ObjectLookup<any>) {
		if (arguments.length === 0) {
			// TODO: Warn about direct call in dev build?
		}
		else {
			if (Entity.ctorDepth === 0) {
				throw new Error("Entity constructor should not be called directly.");
			}

			this.accessed = new Event<Entity, EntityAccessEventArgs>();
			this.changed = new Event<Entity, EntityChangeEventArgs>();

			var isNew: boolean;

			if (typeof id === "string")
				type.assertValidId(id);
			else
			{
				properties = id;
				id = type.newId();
				isNew = true;
			}

			this.meta = new ObjectMeta(type, this, id, isNew);

			// Register the newly constructed existing instance.
			type.register(this);

			// Initialize properties if provided.
			if (properties) {
				this.init(properties);
			}

			// Raise the initNew or initExisting event on this type and all base types
			for (let t = type; t; t = t.baseType)
			{
				if (isNew)
					(t.initNew as Event<Type, EntityInitExistingEventArgs>).publish(t, { entity: this });
				else
					(t.initExisting as Event<Type, EntityInitExistingEventArgs>).publish(t, { entity: this });
			}
		}
	}

	private init(properties: { [name: string]: any }): void;
	private init(property: string, value: any): void;
	private init(property: any, value?: any): void {
		if (Entity.ctorDepth === 0) {
			throw new Error("Entity.init() should not be called directly.");
		}

		let properties: { [name: string]: any };

		// Convert property/value pair to a property dictionary
		if (typeof property == "string") {
			properties = {};
			properties[property] = value;
		} else {
			properties = property;
		}

		// Initialize the specified properties
		for (let name in properties) {
			if (properties.hasOwnProperty(name)) {
				let prop = this.meta.type.getProperty(name);

				if (!prop)
					throw new Error(`Could not find property '${name}' on type '${this.meta.type.fullName}'.`);

				// Initialize the property
				Property$_init(prop, this, value);
			}
		}
	}

	set(properties: { [name: string]: any }): void;
	set(property: string, value: any): void;
	set(property: any, value?: any): void {
		let properties: { [name: string]: any };

		// Convert property/value pair to a property dictionary
		if (typeof property == "string") {
			properties = {};
			properties[property] = value;
		} else {
			properties = property;
		}

		// Set the specified properties
		for (let name in properties) {
			if (properties.hasOwnProperty(name)) {
				let prop = this.meta.type.getProperty(name);

				if (!prop)
					throw new Error(`Could not find property '${name}' on type '${this.meta.type.fullName}'.`);

				// Set the property
				Property$_setter(prop, this, value);
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
		} else {
			formatter = this.meta.type.format;
		}

		// Use the formatter, if available, to create the string representation
		if (formatter) {
			return formatter.convert(this);
		} else {
			return `${this.meta.type.fullName}|${this.meta.id}`;
		}
	}

	/**
	 * Produces a JSON-valid object representation of the entity.
	 * @param entity
	 */
	serialize(): Object {
		return this.meta.type.model.serializer.serialize(this);
	}
}

export interface EntityConstructor {
	new(): Entity;
}

export interface EntityConstructorForType<TEntity extends Entity> extends EntityConstructor {
	new(): TEntity;
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
}
