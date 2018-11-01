import { ObjectMeta } from "./object-meta";
import { Model } from "./model";
import { Format } from "./format";

export class Entity {

	readonly meta: ObjectMeta;
	
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
				let prop = this.meta.type.property(name);

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
				let prop = this.meta.type.property(name);

				if (!prop)
					throw new Error("Could not find property \"" + name + "\" on type \"" + this.meta.type.fullName + "\".");

				prop.value(this, value);
			}
		}
	}

	get(property: string) {
		return this.meta.type.property(property).value(this);
	}

	toString(format: string) {
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
			return Entity.toIdString(this);
	}

	// Gets the typed string id suitable for roundtripping via fromIdString
	static toIdString(obj: Entity) {
		return `${obj.meta.type.fullName}|${obj.meta.id}`;
	}

	// Gets or loads the entity with the specified typed string id
	static fromIdString(idString: string) {
		// Typed identifiers take the form "type|id".
		var type = idString.substring(0, idString.indexOf("|"));
		var id = idString.substring(type.length + 1);

		// Use the left-hand portion of the id string as the object's type.
		var jstype = Model.getJsType(type);

		// Retrieve the object with the given id.
		return jstype.meta.get(id,
			// Typed identifiers may or may not be the exact type of the instance.
			// An id string may be constructed with only knowledge of the base type.
			false
		);
	}
}
