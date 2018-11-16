import { Event, EventSubscriber, EventObject } from "./events";
import { Format } from "./format";
import { Model$getJsType, Model } from "./model";
import { Type } from "./type";
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

	toString(format: string): string {
		let formatter: Format = null;
		if (format) {
			// TODO: Use format to convert entity to string
			// formatter = getFormat(this.constructor, format);
		}
		else {
			// TODO: Use format to convert entity to string
			// formatter = this.meta.type.get_format();
		}

		if (formatter)
			return formatter.convert(this);
		else
			return Entity$toIdString(this);
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

// Gets the typed string id suitable for roundtripping via fromIdString
export function Entity$toIdString(obj: Entity): string {
	return `${obj.meta.type.fullName}|${obj.meta.id}`;
}

// Gets or loads the entity with the specified typed string id
export function Entity$fromIdString(model: Model, idString: string): Entity {
	// Typed identifiers take the form "type|id".
	var type = idString.substring(0, idString.indexOf("|"));
	var id = idString.substring(type.length + 1);

	// Use the left-hand portion of the id string as the object's type.
	var jstype = Model$getJsType(type, model._allTypesRoot);

	// Retrieve the object with the given id.
	return jstype.meta.get(id,
		// Typed identifiers may or may not be the exact type of the instance.
		// An id string may be constructed with only knowledge of the base type.
		false
	);
}
