import { Event, EventSubscriber, EventObject } from "./events";
import { Format } from "./format";
import { Model } from "./model";
import { Type, EntityType } from "./type";
import { ObjectMeta } from "./object-meta";
import { Property, Property$_init, Property$_setter } from "./property";

export class Entity {
	readonly meta: ObjectMeta;
	readonly accessed: Event<Entity, EntityAccessEventArgs>;
	readonly changed: Event<Entity, EntityChangeEventArgs>;

	constructor(properties?: { [name: string]: any }) {
		
		this.accessed = new Event<Entity, EntityAccessEventArgs>();
		this.changed = new Event<Entity, EntityChangeEventArgs>();

		if (properties)
			this.init(properties);
	}

	init(properties: { [name: string]: any }): void;
	init(property: string, value: any): void;
	init(property: any, value?: any): void {
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
