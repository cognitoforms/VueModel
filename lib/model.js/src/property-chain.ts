import { Type } from "./type";
import { Property, PropertyAccessEventArgs, PropertyChangeEventArgs, PropertyConstructor } from "./property";
import { Event, EventSubscriber, ContextualEventRegistration, EventObject } from "./events";
import { FunctorWith1Arg, Functor$create } from "./functor";
import { Entity } from "./entity";
import { Format } from "./format";
import { getEventSubscriptions } from "./helpers";
import { Model$getJsType, Model$whenTypeAvailable, ModelNamespace } from "./model";
import { Signal } from "./signal";
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

	constructor(rootType: Type, properties: Property[], filters: ((obj: Entity) => boolean)[]) {

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

	append(prop: Property | PropertyChain): PropertyChain {
		// TODO: Validate that the property or property chain is valid to append?
		let newProps = this._properties.slice();
		let newFilters = this._propertyFilters ? this._propertyFilters.slice() : new Array(this._properties.length);
		if (prop instanceof Property) {
			newProps.push(prop as Property & Property);
			newFilters.push(null);
		} else if (prop instanceof PropertyChain) {
			Array.prototype.push.apply(newProps, prop._properties);
			Array.prototype.push.apply(newFilters, prop._propertyFilters || new Array(prop._properties.length));
		} else {
			throw new Error("Method `IPropertyChain.append(prop)` expects an argument of type `IProperty` or `IPropertyChain`.");
		}
		return new PropertyChain(this.rootType, newProps, newFilters);
	}

	prepend(prop: Property | PropertyChain) {
		// TODO: Validate that the property or property chain is valid to prepend?
		let newProps: Property[];
		let newRootType: Type;
		let newFilters: ((obj: Entity) => boolean)[];
		if (prop instanceof Property) {
			newProps = this._properties.slice();
			newFilters = this._propertyFilters.slice();
			newRootType = prop.containingType as Type;
			newProps.splice(0, 0, prop as Property);
			newFilters.splice(0, 0, null);
		} else if (prop instanceof PropertyChain) {
			newProps = this._properties.slice();
			newFilters = this._propertyFilters.slice();
			newRootType = prop._properties[0].containingType as Type;
			let noRemovalSpliceArgs: Array<any> = [0, 0];
			Array.prototype.splice.apply(newProps, noRemovalSpliceArgs.concat(prop._properties));
			Array.prototype.splice.apply(newFilters, noRemovalSpliceArgs.concat(prop._propertyFilters || new Array(prop._properties.length)));
		} else {
			throw new Error("Method `IPropertyChain.prepend(prop)` expects an argument of type `IProperty` or `IPropertyChain`.");
		}
		return new PropertyChain(newRootType, newProps, newFilters);
	}

	canSetValue(obj: Entity, value: any): boolean {
		return this.lastProperty.canSetValue(this.getLastTarget(obj), value);
	}

	// Determines if this property chain connects two objects.
	testConnection(fromRoot: Entity, toObj: any, viaProperty: Property): boolean {
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

	// TODO: is this needed?
	// starts listening for the get event of the last property in the chain on any known instances. Use obj argument to
	// optionally filter the events to a specific object
	// addGet(handler, obj): IEventHandler<IPropertyChain, PropertyAccessEventArgs> {
	// 	var chain = this;

	// 	this.lastProperty().addGet(function PropertyChain$_raiseGet(sender, property, value, isInited) {
	// 		handler(sender, chain, value, isInited);
	// 	}, obj);

	// 	// Return the property to support method chaining
	// 	return this;
	// }

	get propertyType(): any {
		return this.lastProperty.propertyType;
	}

	get format(): Format {
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

export function PropertyChain$create(rootType: Type, pathTokens: PathTokens /*, forceLoadTypes: boolean, success: Function, fail: Function */): PropertyChain {
	/// <summary>
	/// Attempts to synchronously or asynchronously create a property chain for the specified 
	/// root type and path.  Also handles caching of property chains at the type level.
	/// </summary>

	var type = rootType;
	var properties: Property[] = [];
	var filters: ((target: Entity) => boolean)[] = [];
	var filterTypes: any[] = [];

	// initialize optional callback arguments
	var forceLoadTypes = arguments.length >= 3 && arguments[2] && arguments[2].constructor === Boolean ? arguments[2] : false;
	var success: (chain: PropertyChain) => void = arguments.length >= 4 && arguments[3] && arguments[3] instanceof Function ? arguments[3] : null;
	var fail: (error: string) => void = arguments.length >= 5 && arguments[4] && arguments[4] instanceof Function ?
		arguments[4] : function (error: string) { if (success) { throw new Error(error); } };

	// process each step in the path either synchronously or asynchronously depending on arguments
	var processStep = function PropertyChain$processStep() {

		// get the next step
		var step = pathTokens.steps.shift();
		if (!step) {
			fail(`Syntax error in property path: ${pathTokens.expression}`);

			// return null to indicate that the path is not valid
			return null;
		}

		// get the property for the step 
		var prop = type.getProperty(step.property);
		if (!prop) {
			fail(`Path '${pathTokens.expression}' references unknown property "${step.property}" on type "${type}".`);

			// return null if the property does not exist
			return null;
		}

		// ensure the property is not static because property chains are not valid for static properties
		if (prop.isStatic) {
			fail(`Path '${pathTokens.expression}' references static property "${step.property}" on type "${type}".`);

			// return null to indicate that the path references a static property
			return null;
		}

		// store the property for the step
		properties.push(prop);

		// handle optional type filters
		if (step.cast) {

			// determine the filter type
			type = Model$getJsType(step.cast, rootType.model._allTypesRoot, true).meta as Type;
			if (!type) {
				fail(`Path '${pathTokens.expression}' references an invalid type: "${step.cast}".`);
				return null;
			}

			var jstype = type.jstype;
			filterTypes[properties.length] = jstype;
			filters[properties.length] = function (target: Entity) {
				return target instanceof jstype;
			};
		} else {
			type = prop.propertyType.meta;
		}

		// process the next step if not at the end of the path
		if (pathTokens.steps.length > 0) {
			return Model$whenTypeAvailable(type, forceLoadTypes, processStep);
		}

		// otherwise, create and return the new property chain
		else {

			// processing the path is complete, verify that chain is not zero-length
			if (properties.length === 0) {
				fail("IPropertyChain cannot be zero-length.");
				return null;
			}

			// ensure filter types on the last step are loaded
			var filterTypeSignal = new Signal("filterType");
			var filterType = filterTypes[properties.length - 1];
			if (filterType) {
				Model$whenTypeAvailable(filterType.meta, forceLoadTypes, filterTypeSignal.pending(null, null, true));
			}
			var ret;
			filterTypeSignal.waitForAll(function () {
				// create and cache the new property chain
				var chain = new PropertyChain(rootType, properties, filters);

				/*
				// TODO: Implement property chain caching?
				if (!rootType._chains) {
					rootType._chains = {};
				}
				rootType._chains[pathTokens.expression] = chain;
				*/

				// if asynchronous processing was allowed, invoke the success callback
				if (success) {
					success(chain);
				}

				// return the new property chain
				ret = chain;
			}, null, true);
			return ret;
		}
	};

	// begin processing steps in the path
	return Model$whenTypeAvailable(type, forceLoadTypes, processStep);
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
	originalEntity: Entity;
	originalProperty: Property;
}

export interface PropertyChainChangeEventHandler {
    (this: Entity, args: EventObject & PropertyChainChangeEventArgs): void;
}

export interface PropertyChainChangeEventArgs extends PropertyChangeEventArgs {
	originalEntity: Entity;
	originalProperty: Property;
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
		previousStepType = p.propertyType.meta as Type;
	});

	return steps.join(".");

}

function onPropertyChainStepAccessed(chain: PropertyChain, priorProp: Property, entity: Entity, args: PropertyAccessEventArgs) {
	// scan all known objects of this type and raise event for any instance connected
	// to the one that sent the event.
	chain.rootType.known().forEach(function (known: Entity) {
		if (chain.testConnection(known, args.property, priorProp)) {
			// Copy the original arguments so that we don't affect other code
			var newArgs: PropertyAccessEventArgs | any = {
				property: args.property,
				value: args.value,
			};

			// Reset property to be the chain, but store the original property as "triggeredBy"
			newArgs.originalEntity = args.entity;
			newArgs.originalProperty = newArgs.property;
			newArgs.property = chain;

			// Call the handler, passing through the arguments
			chain._events.accessedEvent.publish(known, newArgs as PropertyChainAccessEventArgs);
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

	// TODO: Implement partial access tolerance if implementing lazy loading...

	propertyAccessFilters.add((entity) => chain.isInited(entity, true));

	updatePropertyAccessSubscriptions(chain, chain._properties, chain._propertyAccessSubscriptions);

	filteredHandler = function (args) {
		let filterResults = propertyAccessFilters(args.entity);
		if (!filterResults.some(b => !b)) {
			handler.call(this, args);
		}
	};

	chain._events.accessedEvent.subscribe(filteredHandler);

	chain._propertyChainAccessSubscriptions.push({ registeredHandler: filteredHandler, handler, context });

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
		if (chain.testConnection(known, args.property, priorProp)) {
			// Copy the original arguments so that we don't affect other code
			var newArgs: PropertyChangeEventArgs | any = {
				property: args.property,
				oldValue: args.oldValue,
				newValue: args.newValue,
			};

			// Reset property to be the chain, but store the original property as "triggeredBy"
			newArgs.originalEntity = args.entity;
			newArgs.originalProperty = args.property;
			newArgs.property = chain;

			// Call the handler, passing through the arguments
			chain._events.changedEvent.publish(known, newArgs as PropertyChainChangeEventArgs);
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

	/*
	// TODO: Implement partial access tolerance if implementing lazy loading...
	// Ensure that the chain is inited from the root if toleratePartial is false
	if (toleratePartial) {
		propertyEventFilters.add(function (sender, args) {
			var allCanBeAccessed = true;
			chain.forEach(sender, function (target, targetIndex, targetArray, property, propertyIndex, properties) {
				if (!property.isInited(target)) {
					var propertyGetWouldCauseError = false;
					if (LazyLoader.isRegistered(target)) {
						propertyGetWouldCauseError = true;
					} else if (property.isList) {
						var list = target[property._fieldName];
						if (list && LazyLoader.isRegistered(list)) {
							propertyGetWouldCauseError = true;
						}
					}

					if (propertyGetWouldCauseError) {
						allCanBeAccessed = false;

						// Exit immediately
						return false;
					}
				}
			});
			return allCanBeAccessed;
		});
	} else {
		...
	}
	*/

	propertyChangeFilters.add((entity) => chain.isInited(entity, true));

	updatePropertyChangeSubscriptions(chain, chain._properties, chain._propertyChangeSubscriptions);

	filteredHandler = function (args) {
		let filterResults = propertyChangeFilters(args.entity);
		if (!filterResults.some(b => !b)) {
			handler.call(this, args);
		}
	};

	chain._events.changedEvent.subscribe(filteredHandler);

	chain._propertyChainChangeSubscriptions.push({ registeredHandler: filteredHandler, handler, context });

}

export function PropertyChain$_removeChangedHandler(chain: PropertyChain, handler: PropertyChainChangeEventHandler, obj: Entity = null, toleratePartial: boolean): void {
	chain._propertyChangeSubscriptions.forEach(sub => {
		if (handler === sub.handler && ((!obj && !sub.context) || (obj && obj === sub.context))) {
			chain._events.changedEvent.unsubscribe(sub.registeredHandler);
		}
	});
}
