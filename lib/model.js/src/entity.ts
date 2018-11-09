import { EventDispatcher, IEvent } from "ste-events";
import { Entity as IEntity, EntityEventDispatchers, EntityChangeEventArgs, EntityAccessEventArgs } from "./interfaces";
import { Property as IProperty } from "./interfaces";
import { ObjectMeta as IObjectMeta } from "./interfaces";
import { Format as IFormat } from "./interfaces";
import { Model$getJsType } from "./model";

class EntityEventDispatchersImplementation implements EntityEventDispatchers {
	readonly accessedEvent: EventDispatcher<IProperty, EntityAccessEventArgs>;
	readonly changedEvent: EventDispatcher<IProperty, EntityChangeEventArgs>;
	constructor() {
		this.accessedEvent = new EventDispatcher<IProperty, EntityAccessEventArgs>();
		this.changedEvent = new EventDispatcher<IProperty, EntityChangeEventArgs>();
	}
}

export class Entity implements IEntity {

	readonly meta: IObjectMeta;

	readonly _eventDispatchers: EntityEventDispatchers;	

	constructor() {
		Object.defineProperty(this, "_eventDispatchers", { value: new EntityEventDispatchersImplementation() });
	}

	get accessedEvent(): IEvent<IProperty, EntityAccessEventArgs> {
		return this._eventDispatchers.accessedEvent.asEvent();
	}

	get changedEvent(): IEvent<IProperty, EntityChangeEventArgs> {
		return this._eventDispatchers.changedEvent.asEvent();
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
		let formatter: IFormat = null;
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

// Gets the typed string id suitable for roundtripping via fromIdString
export function Entity$toIdString(obj: IEntity): string {
	return `${obj.meta.type.fullName}|${obj.meta.id}`;
}

// Gets or loads the entity with the specified typed string id
export function Entity$fromIdString(idString: string): IEntity {
	// Typed identifiers take the form "type|id".
	var type = idString.substring(0, idString.indexOf("|"));
	var id = idString.substring(type.length + 1);

	// Use the left-hand portion of the id string as the object's type.
	var jstype = Model$getJsType(type);

	// Retrieve the object with the given id.
	return jstype.meta.get(id,
		// Typed identifiers may or may not be the exact type of the instance.
		// An id string may be constructed with only knowledge of the base type.
		false
	);
}

export function Entity$_getEventDispatchers(prop: IEntity): EntityEventDispatchers {
	return (prop as any)._eventDispatchers as EntityEventDispatchers;
}

export function Entity$_dispatchEvent<TSender, TArgs>(entity: IEntity, eventName: string, sender: TSender, args: TArgs): void {
	let dispatchers = Entity$_getEventDispatchers(entity) as { [eventName: string]: any };
	let dispatcher = dispatchers[eventName + "Event"] as EventDispatcher<TSender, TArgs>;
	dispatcher.dispatch(sender, args);
}
