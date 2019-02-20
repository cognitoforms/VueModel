import { Event, EventSubscriber, EventObject } from "./events";
import { Format } from "./format";
import { Model } from "./model";
import { Type, EntityType } from "./type";
import { ObjectMeta } from "./object-meta";
import { Property } from "./property";

export class Entity {
	readonly meta: ObjectMeta;

	readonly _events: EntityEvents;

	constructor() {
		Object.defineProperty(this, "_events", { value: new EntityEvents() });
	}

	get accessed(): EventSubscriber<Entity, EntityAccessEventArgs> {
		return this._events.accessedEvent.asEventSubscriber();
	}

	get changed(): EventSubscriber<Entity, EntityChangeEventArgs> {
		return this._events.changedEvent.asEventSubscriber();
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
					throw new Error("Could not find property \"" + name + "\" on type \"" + this.meta.type.fullName + "\".");

				// Set the property
				prop.value(this, value);
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
					throw new Error("Could not find property \"" + name + "\" on type \"" + this.meta.type.fullName + "\".");

				prop.value(this, value);
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

	serialize(): any {
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

export class EntityEvents {
	readonly accessedEvent: Event<Entity, EntityAccessEventArgs>;
	readonly changedEvent: Event<Entity, EntityChangeEventArgs>;
	constructor() {
		this.accessedEvent = new Event<Entity, EntityAccessEventArgs>();
		this.changedEvent = new Event<Entity, EntityChangeEventArgs>();
	}
}
