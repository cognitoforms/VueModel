import { Type, isEntityType, EntityType } from "./type";
import { Property, PropertyAccessEventArgs, PropertyChangeEventArgs } from "./property";
import { Event, EventSubscriber, ContextualEventRegistration, EventObject } from "./events";
import { FunctorWith1Arg, Functor$create } from "./functor";
import { Entity } from "./entity";
import { Format } from "./format";
import { getEventSubscriptions } from "./helpers";
import { PathTokens } from "./path-tokens";

/**
 * Encapsulates the logic required to work with a chain of properties and
 * a root object, allowing interaction with the chain as if it were a 
 * single property of the root object.
 */
export class PropertyChain {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the object is
	readonly rootType: Type;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
	readonly _properties: Property[];
	readonly _propertyFilters: ((obj: Entity) => boolean)[];
	readonly _propertyAccessSubscriptions: ContextualEventRegistration<Entity, PropertyAccessEventArgs, Entity>[];
	readonly _propertyChainAccessSubscriptions: ContextualEventRegistration<Entity, PropertyChainAccessEventArgs, Entity>[];
	readonly _propertyChangeSubscriptions: ContextualEventRegistration<Entity, PropertyChangeEventArgs, Entity>[];
	readonly _propertyChainChangeSubscriptions: ContextualEventRegistration<Entity, PropertyChainChangeEventArgs, Entity>[];
	readonly _events: PropertyChainEvents;

	private _path: string;

	constructor(rootType: Type, pathTokens: PathTokens) {

		// Properties and filters will be derived from path tokens
		var properties: Property[] = [];
		var filters: ((target: Entity) => boolean)[] = [];

		var type = rootType;

		// Process each step in the path
		while (pathTokens.steps.length > 0) {

			// Get the next step in the path
			var step = pathTokens.steps.shift();
			if (!step) {
				throw new Error(`Syntax error in property path: ${pathTokens.expression}`);
			}

			// Get the property for the step 
			var prop = type.getProperty(step.property);
			if (!prop) {
				throw new Error(`Path '${pathTokens.expression}' references unknown property "${step.property}" on type "${type}".`);
			}

			// Ensure the property is not static because property chains are not valid for static properties
			if (prop.isStatic) {
				throw new Error(`Path '${pathTokens.expression}' references static property "${step.property}" on type "${type}".`);
			}

			// Store the property for the step
			properties.push(prop);

			// Handle optional type filters
			if (step.cast) {

				// Determine the filter type
				type = rootType.model.types[step.cast];
				if (!type) {
					throw new Error(`Path '${pathTokens.expression}' references an invalid type: "${step.cast}".`);
				}

				var jstype = type.jstype;
				filters[properties.length] = function (target: Entity) {
					return target instanceof jstype;
				};
			} else if (isEntityType(prop.propertyType)) {
				type = prop.propertyType.meta;
			} else {
				type = null;
			}

		}

		if (properties.length === 0) {
			throw new Error("A property chain cannot be zero-length.");
		}

		// Public read-only properties
		Object.defineProperty(this, "rootType", { enumerable: true, value: rootType });

		// Backing fields for properties
		Object.defineProperty(this, "_properties", { value: properties });
		Object.defineProperty(this, "_propertyFilters", { value: filters || new Array(properties.length) });
		Object.defineProperty(this, "_propertyAccessSubscriptions", { value: [] });
		Object.defineProperty(this, "_propertyChainAccessSubscriptions", { value: [] });
		Object.defineProperty(this, "_propertyChangeSubscriptions", { value: [] });
		Object.defineProperty(this, "_propertyChainChangeSubscriptions", { value: [] });

		Object.defineProperty(this, "_events", { value: new PropertyChainEvents() });

		// Cache the chain to avoid having to evaluate the same path more than once
		var cache: { [name: string]: PropertyChain } = (rootType as any)._chains;
		if (!cache) {
			(rootType as any)._chains = cache = {};
		}

		cache[pathTokens.expression] = this;
	}

	get changed(): EventSubscriber<Entity, PropertyChainChangeEventArgs> {
		return this._events.changedEvent.asEventSubscriber();
	}

	get accessed(): EventSubscriber<Entity, PropertyChainAccessEventArgs> {
		return this._events.accessedEvent.asEventSubscriber();
	}

	equals(prop: Property | PropertyChain): boolean {

		if (prop === null || prop === undefined) {
			return;
		}

		if (prop instanceof Property) {
			return this._properties.length === 1 && this._properties[0] === prop;
		}

		if (prop instanceof PropertyChain) {
			if (prop._properties.length !== this._properties.length) {
				return false;
			}

			for (var i = 0; i < this._properties.length; i++) {
				if (!this._properties[i].equals(prop._properties[i])) {
					return false;
				}
			}

			return true;
		}

	}

	/**
	 * Iterates over all objects along a property chain starting with the root object (obj).
	 * This is analogous to the Array forEach function. The callback may return a Boolean
	 * value to indicate whether or not to continue iterating.
	 * @param obj The root object (of type `IEntity`) to use in iterating over the chain.
	 * @param callback The function to invoke at each iteration step.  May return a Boolean value to indicate whether or not to continue iterating.
	 * @param thisPtr Optional object to use as the `this` pointer when invoking the callback.
	 * @param propFilter An optional property filter, if specified, only iterates over the results of this property.
	 */
	forEach(obj: Entity, callback: (obj: any, index: number, array: Array<any>, prop: Property, propIndex: number, props: Property[]) => any, thisPtr: any = null, propFilter: Property = null /*, target: IEntity, p: number, lastProp: IProperty */) {
		/// <summary>
		/// </summary>
	
		if (obj == null) throw new Error("Argument 'obj' cannot be null or undefined.");
		if (callback == null) throw new Error("Argument 'callback' cannot be null or undefined.");
		if (typeof (callback) != "function") throw new Error("Argument 'callback' must be of type function: " + callback + ".");
	
		// invoke callback on obj first
		var target: Entity = arguments[4] || obj;
		var lastProp: Property = arguments[6] || null;
		var props = this._properties.slice(arguments[5] || 0);
		for (var p: number = arguments[5] || 0; p < this._properties.length; p++) {
			var prop = this._properties[p];
			var isLastProperty = p === this._properties.length - 1;
			var canSkipRemainingProps = isLastProperty || (propFilter && lastProp === propFilter);
			var enableCallback = (!propFilter || lastProp === propFilter);
	
			if (target instanceof Array) {
				// if the target is a list, invoke the callback once per item in the list
				for (var i = 0; i < target.length; ++i) {
					// take into account any any chain filters along the way
					if (!this._propertyFilters || !this._propertyFilters[p] || this._propertyFilters[p](target[i])) {
	
						if (enableCallback && callback.call(thisPtr || this, target[i], i, target, prop, p, props) === false) {
							return false;
						}
	
						if (!canSkipRemainingProps) {
							var targetValue = prop.value(target[i]);
							// continue along the chain for this list item
							if (!targetValue || PropertyChain.prototype.forEach.call(this, obj, callback, thisPtr, propFilter, targetValue, p + 1, prop) === false) {
								return false;
							}
						}
					}
				}
				// subsequent properties already visited in preceding loop
				return true;
			} else {
				// return early if the target is filtered and does not match
				if (this._propertyFilters && this._propertyFilters[p] && this._propertyFilters[p](target) === false) {
					break;
				}
	
				// take into account any chain filters along the way
				if (enableCallback && callback.call(thisPtr || this, target, -1, null, prop, p, props) === false) {
					return false;
				}
			}
	
			// if a property filter is used and was just evaluated, stop early
			if (canSkipRemainingProps) {
				break;
			}
	
			// move to next property in the chain
			target = (target as any)[prop.fieldName];
	
			// break early if the target is undefined
			if (target === undefined || target === null) {
				break;
			}
	
			lastProp = prop;
		}
	
		return true;
	}

	get path(): string {
		if (!this._path) {
			let path = getPropertyChainPathFromIndex(this, 0);
			Object.defineProperty(this, "_path", { enumerable: false, value: path, writable: true });
		}

		return this._path;
	}

	get firstProperty(): Property {
		return this._properties[0];
	}

	get lastProperty(): Property {
		return this._properties[this._properties.length - 1];
	}

	toPropertyArray(): Property[] {
		return this._properties.slice();
	}

	getLastTarget(obj: Entity, exitEarly: boolean = false): Entity {
		for (var p = 0; p < this._properties.length - 1; p++) {
			var prop = this._properties[p];

			// exit early on null or undefined
			if (obj === undefined || obj === null) {
				if (exitEarly) {
					return obj;
				} else {
					throw new Error("Property chain is not complete.");
				}
			}

			obj = prop.value(obj);
		}

		return obj;
	}

	canSetValue(obj: Entity, value: any): boolean {
		return this.lastProperty.canSetValue(this.getLastTarget(obj), value);
	}

	// Determines if this property chain connects two objects.
	testConnection(fromRoot: Entity, toObj: Entity, viaProperty: Property): boolean {
		var connected = false;

		// perform simple comparison if no property is defined
		if (!viaProperty) {
			return fromRoot === toObj;
		}

		this.forEach(fromRoot, function (target) {
			if (target === toObj) {
				connected = true;
				return false;
			}
		}, this, viaProperty);

		return connected;
	}

	getRootedPath(rootType: Type) {
		for (var i = 0; i < this._properties.length; i++) {
			if (rootType.hasModelProperty(this._properties[i])) {
				var path = getPropertyChainPathFromIndex(this, i);
				return this._properties[i].isStatic ? this._properties[i].containingType + "." + path : path;
			}
		}
	}

	get propertyType(): any {
		return this.lastProperty.propertyType;
	}

	get format(): Format<any> {
		return this.lastProperty.format;
	}

	get isList(): boolean {
		return this.lastProperty.isList;
	}

	// get isStatic(): boolean {
	// 	return this.lastProperty.isStatic;
	// }

	get label(): string {
		return this.lastProperty.label;
	}

	get helptext(): string {
		return this.lastProperty.helptext;
	}

	// get name() {
	// 	return this.lastProperty.name;
	// }

	// rules(filter) {
	// 	return this.lastProperty().rules(filter);
	// }

	value(obj: Entity = null, val: any = null, additionalArgs: any = null): any {
		var lastTarget = this.getLastTarget(obj);
		var lastProp = this.lastProperty;

		if (arguments.length > 1) {
			lastProp.value(lastTarget, val, additionalArgs);
		} else if (lastTarget) {
			return lastProp.value(lastTarget);
		}
	}

	/**
	 * Determines if the property chain is initialized, akin to single IProperty initialization.
	 * @param obj The root object
	 * @param enforceCompleteness Whether or not the chain must be complete in order to be considered initialized
	 */
	isInited(obj: Entity, enforceCompleteness: boolean = false /*, fromIndex: number, fromProp: IProperty */) {
		var allInited = true, initedProperties: Property[] = [], fromIndex = arguments[2] || 0, fromProp = arguments[3] || null, expectedProps = this._properties.length - fromIndex;

		PropertyChain.prototype.forEach.call(this, obj, function (target: any, targetIndex: number, targetArray: any[], property: Property, propertyIndex: number, properties: Property[]) {
			if (targetArray && enforceCompleteness) {
				if (targetArray.every(function (item) { return this.isInited(item, true, propertyIndex, properties[propertyIndex - 1]); }, this)) {
					Array.prototype.push.apply(initedProperties, properties.slice(propertyIndex));
				}
				else {
					allInited = false;
				}

				// Stop iterating at an array value
				return false;
			}
			else {
				if (!property.isInited(target)) {
					allInited = false;

					// Exit immediately since chain is not inited
					return false;
				} else if (!targetArray || targetIndex === 0) {
					initedProperties.push(property);
				}
			}
		}, this, null, obj, fromIndex, fromProp);

		return allInited && (!enforceCompleteness || initedProperties.length === expectedProps);
	}

	getPath(): string {
		return this.path;
	}

	toString() {
		var path = this._properties.map(function (e) { return e.name; }).join(".");
		return `this<${this.rootType}>.${path}`;
	}

}

export class PropertyChainEvents {
	readonly changedEvent: Event<Entity, PropertyChainChangeEventArgs>;
	readonly accessedEvent: Event<Entity, PropertyChainAccessEventArgs>;
	constructor() {
		this.changedEvent = new Event<Entity, PropertyChainChangeEventArgs>();
		this.accessedEvent = new Event<Entity, PropertyChainAccessEventArgs>();
	}
}

export interface PropertyChainAccessEventHandler {
    (this: Entity, args: EventObject & PropertyChainAccessEventArgs): void;
}

export interface PropertyChainAccessEventArgs extends PropertyAccessEventArgs {
	chain: PropertyChain;
	originalEntity: Entity;
}

export interface PropertyChainChangeEventHandler {
    (this: Entity, args: EventObject & PropertyChainChangeEventArgs): void;
}

export interface PropertyChainChangeEventArgs extends PropertyChangeEventArgs {
	chain: PropertyChain;
	originalEntity: Entity;
}

export interface PropertyChainConstructor {
	new(rootType: Type, properties: Property[], filters: ((obj: Entity) => boolean)[]): PropertyChain;
}

function getPropertyChainPathFromIndex(chain: PropertyChain, startIndex: number) {

	var steps: string[] = [];

	let props = chain.toPropertyArray();

	if (props[startIndex].isStatic) {
		steps.push(props[startIndex].containingType.fullName);
	}

	let previousStepType: Type;

	props.slice(startIndex).forEach(function (p, i) {
		if (i !== 0) {
			if (p.containingType !== previousStepType && (p.containingType as Type).isSubclassOf(previousStepType)) {
				steps[steps.length - 1] = steps[steps.length - 1] + "<" + p.containingType.fullName + ">";
			}
		}
		steps.push(p.name);
		previousStepType = (p.propertyType as EntityType).meta;
	});

	return steps.join(".");

}

function onPropertyChainStepAccessed(chain: PropertyChain, priorProp: Property, entity: Entity, args: PropertyAccessEventArgs) {
	// scan all known objects of this type and raise event for any instance connected
	// to the one that sent the event.
	chain.rootType.known().forEach(function (known: Entity) {
		if (chain.testConnection(known, args.entity, priorProp)) {
			chain._events.accessedEvent.publish(known, {
				entity: known,
				chain: chain,
				originalEntity: args.entity,
				property: args.property,
				value: args.value,
			});
		}
	});
}

function updatePropertyAccessSubscriptions(chain: PropertyChain, props: (Property & Property)[], subscriptions: ContextualEventRegistration<Entity, PropertyAccessEventArgs, Entity>[]) {
	var chainEventSubscriptions = getEventSubscriptions<Entity, PropertyChainAccessEventArgs>(chain._events.accessedEvent);
	var chainEventSubscriptionsExist = chainEventSubscriptions && chainEventSubscriptions.length > 0;
	var subscribedToPropertyChanges = subscriptions !== null && subscriptions.length > 0;

	if (!chainEventSubscriptionsExist && subscribedToPropertyChanges) {
		// If there are no more subscribers then unsubscribe from property-level events
		props.forEach((prop: Property, index: number) => prop.accessed.unsubscribe(subscriptions[index].handler));
		subscriptions.length = 0;
	}

	if (chainEventSubscriptionsExist && !subscribedToPropertyChanges) {
		// If there are subscribers and we have not subscribed to property-level events, then do so
		subscriptions.length = 0;
		props.forEach(function (prop, index) {
			var priorProp = (index === 0) ? undefined : props[index - 1];
			let handler = function (this: Entity, args: PropertyAccessEventArgs) { onPropertyChainStepAccessed(chain, priorProp, this, args) };
			prop._events.accessedEvent.subscribe(handler);
			subscriptions.push({ registeredHandler: handler, handler });
		}, chain);
	}
}

export function PropertyChain$_addAccessedHandler(chain: PropertyChain, handler: PropertyChainAccessEventHandler, obj: Entity = null, toleratePartial: boolean): void {

	let propertyAccessFilters = Functor$create(true) as FunctorWith1Arg<Entity, boolean> & ((entity: Entity) => boolean[]);

	let context: Entity = null;

	let filteredHandler: (this: Entity, args: EventObject & PropertyChainAccessEventArgs) => void = null;

	if (obj) {
		propertyAccessFilters.add((entity) => entity === obj);
		context = obj;
	}

	propertyAccessFilters.add((entity) => chain.isInited(entity, true));

	filteredHandler = function (args) {
		let filterResults = propertyAccessFilters(args.entity);
		if (!filterResults.some(b => !b)) {
			handler.call(this, args);
		}
	};

	chain._events.accessedEvent.subscribe(filteredHandler);

	chain._propertyChainAccessSubscriptions.push({ registeredHandler: filteredHandler, handler, context });

	updatePropertyAccessSubscriptions(chain, chain._properties, chain._propertyAccessSubscriptions);

}

export function PropertyChain$_removeAccessedHandler(chain: PropertyChain, handler: PropertyChainAccessEventHandler, obj: Entity = null, toleratePartial: boolean): void {
	chain._propertyAccessSubscriptions.forEach(sub => {
		if (handler === sub.handler && ((!obj && !sub.context) || (obj && obj === sub.context))) {
			chain._events.accessedEvent.unsubscribe(sub.registeredHandler);
		}
	});
}

function onPropertyChainStepChanged(chain: PropertyChain, priorProp: Property, entity: Entity, args: PropertyChangeEventArgs) {
	// scan all known objects of this type and raise event for any instance connected
	// to the one that sent the event.
	chain.rootType.known().forEach(function (known: Entity) {
		if (chain.testConnection(known, args.entity, priorProp)) {
			chain._events.changedEvent.publish(known, {
				entity: known,
				chain: chain,
				property: args.property,
				originalEntity: args.entity,
				oldValue: args.oldValue,
				newValue: args.newValue,
			});
		}
	});
}

function updatePropertyChangeSubscriptions(chain: PropertyChain, props: Property[] = null, subscriptions: ContextualEventRegistration<Entity, PropertyChangeEventArgs, Entity>[]) {
	var chainEventSubscriptions = getEventSubscriptions<Entity, PropertyChainChangeEventArgs>(chain._events.changedEvent);
	var chainEventSubscriptionsExist = chainEventSubscriptions && chainEventSubscriptions.length > 0;
	var subscribedToPropertyChanges = subscriptions !== null && subscriptions.length > 0;

	if (!chainEventSubscriptionsExist && subscribedToPropertyChanges) {
		// If there are no more subscribers then unsubscribe from property-level events
		props.forEach((prop: Property, index: number) => prop.changed.unsubscribe(subscriptions[index].registeredHandler));
		subscriptions.length = 0;
	}

	if (chainEventSubscriptionsExist && !subscribedToPropertyChanges) {
		// If there are subscribers and we have not subscribed to property-level events, then do so
		subscriptions.length = 0;
		props.forEach((prop, index) => {
			var priorProp = (index === 0) ? undefined : props[index - 1];
			let handler = function (this: Entity, args: PropertyChangeEventArgs) { onPropertyChainStepChanged(chain, priorProp, this, args) };
			prop.changed.subscribe(handler);
			subscriptions.push({ registeredHandler: handler, handler });
		}, chain);
	}
}

// starts listening for change events along the property chain on any known instances. Use obj argument to
// optionally filter the events to a specific object
export function PropertyChain$_addChangedHandler(chain: PropertyChain, handler: PropertyChainChangeEventHandler, obj: Entity = null, toleratePartial: boolean): void {

	let propertyChangeFilters = Functor$create(true) as FunctorWith1Arg<Entity, boolean> & ((entity: Entity) => boolean[]);

	let context: Entity;

	let filteredHandler: (this: Entity, args: EventObject & PropertyChainChangeEventArgs) => void = null;

	if (obj) {
		propertyChangeFilters.add((entity) => entity === obj);
		context = obj;
	}

	propertyChangeFilters.add((entity) => chain.isInited(entity, true));

	filteredHandler = function (args) {
		let filterResults = propertyChangeFilters(args.entity);
		if (!filterResults.some(b => !b)) {
			handler.call(this, args);
		}
	};

	chain._events.changedEvent.subscribe(filteredHandler);

	chain._propertyChainChangeSubscriptions.push({ registeredHandler: filteredHandler, handler, context });

	updatePropertyChangeSubscriptions(chain, chain._properties, chain._propertyChangeSubscriptions);

}

export function PropertyChain$_removeChangedHandler(chain: PropertyChain, handler: PropertyChainChangeEventHandler, obj: Entity = null, toleratePartial: boolean): void {
	chain._propertyChangeSubscriptions.forEach(sub => {
		if (handler === sub.handler && ((!obj && !sub.context) || (obj && obj === sub.context))) {
			chain._events.changedEvent.unsubscribe(sub.registeredHandler);
		}
	});
}
