declare module 'VueModel/src/vue-internals' {
	import Vue, { ComponentOptions } from "vue";
	import { DefaultData, DefaultMethods, DefaultComputed, PropsDefinition, DefaultProps } from "vue/types/options";
	export interface VueConstructor {
	    mixin<V extends Vue, Data = DefaultData<V>, Methods = DefaultMethods<V>, Computed = DefaultComputed, PropsDef = PropsDefinition<DefaultProps>, Props = DefaultProps>(options: ComponentOptions<V, Data, Methods, Computed, PropsDef, Props>): void;
	}
	export class Dep {
	    depend(): void;
	    notify(): void;
	}
	export interface DepConstructor {
	    new (): Dep;
	    target: any;
	}
	export class Observer {
	    dep: Dep;
	    vmCount: number;
	}
	export interface ObserverConstructor {
	    new (value: any): Observer;
	}
	export interface Plugin {
	    install(Vue: VueConstructor): void;
	}

}
declare module 'VueModel/lib/model.js/src/object-meta' {
	import { Type } from 'VueModel/lib/model.js/src/type';
	import { Entity } from 'VueModel/lib/model.js/src/entity';
	export class ObjectMeta {
	    readonly type: Type;
	    readonly entity: Entity;
	    private _id;
	    private _isNew;
	    private _legacyId;
	    constructor(type: Type, entity: Entity, id: string, isNew: boolean);
	    id: string;
	    readonly isNew: boolean;
	    legacyId: string;
	    destroy(): void;
	}
	export interface ObjectMetaConstructor {
	    new (type: Type, entity: Entity, id: string, isNew: boolean): ObjectMeta;
	}

}
declare module 'VueModel/lib/model.js/src/format' {
	export type FormatConvertFunction = (value: any) => string;
	export type FormatConvertBackFunction = (value: string) => string;
	export interface FormatOptions {
	    specifier: string;
	    convert: FormatConvertFunction;
	    convertBack?: FormatConvertBackFunction;
	    formatEval?: (value: string) => string;
	    description?: string;
	    nullString?: string;
	    undefinedString?: string;
	}
	export class Format {
	    specifier: string;
	    convertFn: FormatConvertFunction;
	    convertBackFn: FormatConvertBackFunction;
	    formatEval: (value: string) => string;
	    description: string;
	    nullString: string;
	    undefinedString: string;
	    constructor(options: FormatOptions);
	    convert(val: any): string;
	    convertBack(val: string): any;
	    toString(): string;
	}
	export interface FormatConstructor {
	    new (options: FormatOptions): Format;
	}

}
declare module 'VueModel/lib/model.js/src/entity' {
	import { ObjectMeta } from 'VueModel/lib/model.js/src/object-meta';
	export class Entity {
	    readonly meta: ObjectMeta;
	    init(properties: {
	        [name: string]: any;
	    }): void;
	    init(property: string, value: any): void;
	    set(properties: {
	        [name: string]: any;
	    }): void;
	    set(property: string, value: any): void;
	    get(property: string): any;
	    toString(format: string): string;
	    static toIdString(obj: Entity): string;
	    static fromIdString(idString: string): any;
	}
	export interface EntityConstructor {
	    new (): Entity;
	    toIdString(obj: Entity): string;
	    fromIdString(idString: string): any;
	}

}
declare module 'VueModel/lib/model.js/node_modules/ste-core/dist/management' {
	/**
	 * Manages the event.
	 *
	 * @export
	 * @interface IEventManagement
	 */
	export interface IEventManagement {
	    /**
	     * Will unsubscribe the handler.
	     *
	     * @memberof IEventManagement
	     */
	    unsub(): void;
	    /**
	     * Stops the propagation of the event.
	     * Cannot be used when async dispatch is done.
	     *
	     * @memberof IEventManagement
	     */
	    stopPropagation(): void;
	}
	/**
	 * Allows the user to interact with the event.
	 *
	 * @class EventManagement
	 * @implements {IEventManagement}
	 */
	export class EventManagement implements IEventManagement {
	    unsub: () => void;
	    propagationStopped: boolean;
	    constructor(unsub: () => void);
	    stopPropagation(): void;
	}

}
declare module 'VueModel/lib/model.js/node_modules/ste-core/dist/definitions/subscribable' {
	/**
	 * Indicates the object implements generic subscriptions.
	 */
	export interface ISubscribable<THandlerType> {
	    /**
	     * Subscribe to the event.
	     * @param fn The event handler that is called when the event is dispatched.
	     * @returns A function that unsubscribes the event handler from the event.
	     */
	    subscribe(fn: THandlerType): () => void;
	    /**
	     * Subscribe to the event.
	     * @param fn The event handler that is called when the event is dispatched.
	     * @returns A function that unsubscribes the event handler from the event.
	     */
	    sub(fn: THandlerType): () => void;
	    /**
	     * Unsubscribe from the event.
	     * @param fn The event handler that will be unsubsribed from the event.
	     */
	    unsubscribe(fn: THandlerType): void;
	    /**
	     * Unsubscribe from the event.
	     * @param fn The event handler that will be unsubsribed from the event.
	     */
	    unsub(fn: THandlerType): void;
	    /**
	     * Subscribes to the event only once.
	     * @param fn The event handler that is called when the event is dispatched.
	     * @returns A function that unsubscribes the event handler from the event.
	     */
	    one(fn: THandlerType): () => void;
	    /**
	     * Checks it the event has a subscription for the specified handler.
	     * @param fn The event handler.
	     */
	    has(fn: THandlerType): boolean;
	    /**
	     * Clears all the subscriptions.
	     */
	    clear(): void;
	}

}
declare module 'VueModel/lib/model.js/node_modules/ste-core/dist/subscription' {
	/**
	 * Stores a handler. Manages execution meta data.
	 * @class Subscription
	 * @template TEventHandler
	 */
	export class Subscription<TEventHandler> {
	    handler: TEventHandler;
	    isOnce: boolean;
	    /**
	     * Indicates if the subscription has been executed before.
	     */
	    isExecuted: boolean;
	    /**
	     * Creates an instance of Subscription.
	     *
	     * @param {TEventHandler} handler The handler for the subscription.
	     * @param {boolean} isOnce Indicates if the handler should only be executed once.
	     */
	    constructor(handler: TEventHandler, isOnce: boolean);
	    /**
	     * Executes the handler.
	     *
	     * @param {boolean} executeAsync True if the even should be executed async.
	     * @param {*} scope The scope the scope of the event.
	     * @param {IArguments} args The arguments for the event.
	     */
	    execute(executeAsync: boolean, scope: any, args: IArguments): void;
	}

}
declare module 'VueModel/lib/model.js/node_modules/ste-core/dist/dispatching' {
	import { ISubscribable } from 'VueModel/lib/model.js/node_modules/ste-core/dist/definitions/subscribable';
	import { Subscription } from 'VueModel/lib/model.js/node_modules/ste-core/dist/subscription';
	/**
	 * Base class for implementation of the dispatcher. It facilitates the subscribe
	 * and unsubscribe methods based on generic handlers. The TEventType specifies
	 * the type of event that should be exposed. Use the asEvent to expose the
	 * dispatcher as event.
	 */
	export abstract class DispatcherBase<TEventHandler> implements ISubscribable<TEventHandler> {
	    private _wrap;
	    private _subscriptions;
	    /**
	     * Subscribe to the event dispatcher.
	     * @param fn The event handler that is called when the event is dispatched.
	     * @returns A function that unsubscribes the event handler from the event.
	     */
	    subscribe(fn: TEventHandler): () => void;
	    /**
	     * Subscribe to the event dispatcher.
	     * @param fn The event handler that is called when the event is dispatched.
	     * @returns A function that unsubscribes the event handler from the event.
	     */
	    sub(fn: TEventHandler): () => void;
	    /**
	     * Subscribe once to the event with the specified name.
	     * @param fn The event handler that is called when the event is dispatched.
	     * @returns A function that unsubscribes the event handler from the event.
	     */
	    one(fn: TEventHandler): () => void;
	    /**
	     * Checks it the event has a subscription for the specified handler.
	     * @param fn The event handler.
	     */
	    has(fn: TEventHandler): boolean;
	    /**
	     * Unsubscribes the handler from the dispatcher.
	     * @param fn The event handler.
	     */
	    unsubscribe(fn: TEventHandler): void;
	    /**
	     * Unsubscribes the handler from the dispatcher.
	     * @param fn The event handler.
	     */
	    unsub(fn: TEventHandler): void;
	    /**
	     * Generic dispatch will dispatch the handlers with the given arguments.
	     *
	     * @protected
	     * @param {boolean} executeAsync True if the even should be executed async.
	     * @param {*} The scope the scope of the event. The scope becomes the "this" for handler.
	     * @param {IArguments} args The arguments for the event.
	     */
	    protected _dispatch(executeAsync: boolean, scope: any, args: IArguments): void;
	    /**
	     * Cleans up subs that ran and should run only once.
	     */
	    protected cleanup(sub: Subscription<TEventHandler>): void;
	    /**
	     * Creates an event from the dispatcher. Will return the dispatcher
	     * in a wrapper. This will prevent exposure of any dispatcher methods.
	     */
	    asEvent(): ISubscribable<TEventHandler>;
	    /**
	     * Clears all the subscriptions.
	     */
	    clear(): void;
	}
	/**
	 * Base class for event lists classes. Implements the get and remove.
	 */
	export abstract class EventListBase<TEventDispatcher> {
	    private _events;
	    /**
	     * Gets the dispatcher associated with the name.
	     * @param name The name of the event.
	     */
	    get(name: string): TEventDispatcher;
	    /**
	     * Removes the dispatcher associated with the name.
	     * @param name The name of the event.
	     */
	    remove(name: string): void;
	    /**
	     * Creates a new dispatcher instance.
	     */
	    protected abstract createDispatcher(): TEventDispatcher;
	}
	/**
	 * Hides the implementation of the event dispatcher. Will expose methods that
	 * are relevent to the event.
	 */
	export class DispatcherWrapper<THandler> implements ISubscribable<THandler> {
	    private _subscribe;
	    private _unsubscribe;
	    private _one;
	    private _has;
	    private _clear;
	    /**
	     * Creates a new EventDispatcherWrapper instance.
	     * @param dispatcher The dispatcher.
	     */
	    constructor(dispatcher: ISubscribable<THandler>);
	    /**
	     * Subscribe to the event dispatcher.
	     * @param fn The event handler that is called when the event is dispatched.
	     * @returns A function that unsubscribes the event handler from the event.
	     */
	    subscribe(fn: THandler): () => void;
	    /**
	     * Subscribe to the event dispatcher.
	     * @param fn The event handler that is called when the event is dispatched.
	     * @returns A function that unsubscribes the event handler from the event.
	     */
	    sub(fn: THandler): () => void;
	    /**
	     * Unsubscribe from the event dispatcher.
	     * @param fn The event handler that is called when the event is dispatched.
	     */
	    unsubscribe(fn: THandler): void;
	    /**
	     * Unsubscribe from the event dispatcher.
	     * @param fn The event handler that is called when the event is dispatched.
	     */
	    unsub(fn: THandler): void;
	    /**
	     * Subscribe once to the event with the specified name.
	     * @param fn The event handler that is called when the event is dispatched.
	     */
	    one(fn: THandler): () => void;
	    /**
	     * Checks it the event has a subscription for the specified handler.
	     * @param fn The event handler.
	     */
	    has(fn: THandler): boolean;
	    /**
	     * Clears all the subscriptions.
	     */
	    clear(): void;
	}

}
declare module 'VueModel/lib/model.js/node_modules/ste-core/dist/definitions/handling' {
	/**
	 * Base interface for event handling.
	 */
	export interface IBaseEventHandling<TEventHandler> {
	    /**
	     * Subscribe to the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler that is called when the event is dispatched.
	     */
	    subscribe(name: string, fn: TEventHandler): void;
	    /**
	     * Subscribe to the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler that is called when the event is dispatched.
	     */
	    sub(name: string, fn: TEventHandler): void;
	    /**
	     * Unsubscribe from the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler that is will be unsubsribed from the event.
	     */
	    unsubscribe(name: string, fn: TEventHandler): void;
	    /**
	     * Unsubscribe from the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler that is will be unsubsribed from the event.
	     */
	    unsub(name: string, fn: TEventHandler): void;
	    /**
	     * Subscribe once to the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler that is called when the event is dispatched.
	     */
	    one(name: string, fn: TEventHandler): void;
	    /**
	     * Checks it the event has a subscription for the specified handler.
	     * @param name The name of the event.
	     * @param fn The event handler.
	     */
	    has(name: string, fn: TEventHandler): boolean;
	}

}
declare module 'VueModel/lib/model.js/node_modules/ste-core/dist/index' {
	/*!
	 * Strongly Typed Events for TypeScript - Core
	 * https://github.com/KeesCBakker/StronlyTypedEvents/
	 * http://keestalkstech.com
	 *
	 * Copyright Kees C. Bakker / KeesTalksTech
	 * Released under the MIT license
	 */
	export { IEventManagement } from 'VueModel/lib/model.js/node_modules/ste-core/dist/management';
	export { ISubscribable } from 'VueModel/lib/model.js/node_modules/ste-core/dist/definitions/subscribable';
	export { DispatcherBase, DispatcherWrapper, EventListBase } from 'VueModel/lib/model.js/node_modules/ste-core/dist/dispatching';
	export { Subscription } from 'VueModel/lib/model.js/node_modules/ste-core/dist/subscription';
	export { IBaseEventHandling } from 'VueModel/lib/model.js/node_modules/ste-core/dist/definitions/handling';

}
declare module 'VueModel/lib/model.js/node_modules/ste-events/dist/definitions' {
	import { IEventManagement, ISubscribable, IBaseEventHandling } from "ste-core";
	/**
	 * Models an event with a generic sender and generic argument.
	 */
	export interface IEvent<TSender, TArgs> extends ISubscribable<IEventHandler<TSender, TArgs>> {
	}
	/**
	 * Interface for event handlers.
	 *
	 * @export
	 * @interface IEventHandler
	 * @template TSender The sender type.
	 * @template TArgs The arguments type.
	 */
	export interface IEventHandler<TSender, TArgs> {
	    (sender: TSender, args: TArgs, ev: IEventManagement): void;
	}
	/**
	 * Indicates the object is capable of handling named events.
	 */
	export interface IEventHandling<TSender, TArgs> extends IBaseEventHandling<IEventHandler<TSender, TArgs>> {
	}

}
declare module 'VueModel/lib/model.js/node_modules/ste-events/dist/events' {
	import { DispatcherBase, EventListBase } from "ste-core";
	import { IEventHandler, IEvent, IEventHandling } from 'VueModel/lib/model.js/node_modules/ste-events/dist/definitions';
	/**
	 * Dispatcher implementation for events. Can be used to subscribe, unsubscribe
	 * or dispatch events. Use the ToEvent() method to expose the event.
	 */
	export class EventDispatcher<TSender, TArgs> extends DispatcherBase<IEventHandler<TSender, TArgs>> implements IEvent<TSender, TArgs> {
	    /**
	     * Creates a new EventDispatcher instance.
	     */
	    constructor();
	    /**
	     * Dispatches the event.
	     * @param sender The sender.
	     * @param args The arguments object.
	     */
	    dispatch(sender: TSender, args: TArgs): void;
	    /**
	     * Dispatches the events thread.
	     * @param sender The sender.
	     * @param args The arguments object.
	     */
	    dispatchAsync(sender: TSender, args: TArgs): void;
	    /**
	     * Creates an event from the dispatcher. Will return the dispatcher
	     * in a wrapper. This will prevent exposure of any dispatcher methods.
	     */
	    asEvent(): IEvent<TSender, TArgs>;
	}
	/**
	 * Storage class for multiple events that are accessible by name.
	 * Events dispatchers are automatically created.
	 */
	export class EventList<TSender, TArgs> extends EventListBase<EventDispatcher<TSender, TArgs>> {
	    /**
	     * Creates a new EventList instance.
	     */
	    constructor();
	    /**
	     * Creates a new dispatcher instance.
	     */
	    protected createDispatcher(): EventDispatcher<TSender, TArgs>;
	}
	/**
	 * Extends objects with event handling capabilities.
	 */
	export abstract class EventHandlingBase<TSender, TArgs> implements IEventHandling<TSender, TArgs> {
	    private _events;
	    /**
	     * Gets the list with all the event dispatchers.
	     */
	    protected readonly events: EventList<TSender, TArgs>;
	    /**
	     * Subscribes to the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler.
	     */
	    subscribe(name: string, fn: IEventHandler<TSender, TArgs>): void;
	    /**
	     * Subscribes to the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler.
	     */
	    sub(name: string, fn: IEventHandler<TSender, TArgs>): void;
	    /**
	     * Unsubscribes from the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler.
	     */
	    unsubscribe(name: string, fn: IEventHandler<TSender, TArgs>): void;
	    /**
	     * Unsubscribes from the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler.
	     */
	    unsub(name: string, fn: IEventHandler<TSender, TArgs>): void;
	    /**
	     * Subscribes to once the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler.
	     */
	    one(name: string, fn: IEventHandler<TSender, TArgs>): void;
	    /**
	     * Subscribes to once the event with the specified name.
	     * @param name The name of the event.
	     * @param fn The event handler.
	     */
	    has(name: string, fn: IEventHandler<TSender, TArgs>): boolean;
	}

}
declare module 'VueModel/lib/model.js/node_modules/ste-events/dist/index' {
	export { EventDispatcher, EventHandlingBase, EventList } from 'VueModel/lib/model.js/node_modules/ste-events/dist/events';
	export { IEventHandler, IEventHandling, IEvent } from 'VueModel/lib/model.js/node_modules/ste-events/dist/definitions';

}
declare module 'VueModel/lib/model.js/src/helpers' {
	export function ensureNamespace(name: string, parentNamespace: any): any;
	export function navigateAttribute(obj: any, attr: string, callback: Function, thisPtr?: any): void;
	export function evalPath(obj: any, path: string, nullValue?: any, undefinedValue?: any): any;
	export function parseFunctionName(fn: Function): string;
	export function getTypeName(obj: any): any;
	export function getDefaultValue(isList: boolean, jstype: any): any;
	export function randomInteger(min?: number, max?: number): number;
	export function randomText(len: number, includeDigits?: boolean): string;
	export function toTitleCase(input: string): string;

}
declare module 'VueModel/lib/model.js/src/internals' {
	export function createSecret(key: string, len?: number, includeLetters?: boolean, includeDigits?: boolean, prefix?: string): string;
	export function getSecret(key: string): string;

}
declare module 'VueModel/lib/model.js/src/observable-list' {
	import { EventDispatcher, IEvent } from "ste-events";
	export interface ObservableListChangedArgs<ItemType> {
	    added: ItemType[];
	    addedIndex: number;
	    removed: ItemType[];
	    removedIndex: number;
	}
	export abstract class ObservableList<ItemType> extends Array<ItemType> {
	    /**
	     * Creates a new observable list
	     * @param items The array of initial items
	     */
	    protected constructor(items?: ItemType[]);
	    abstract changed: IEvent<Array<ItemType>, ObservableListChangedArgs<ItemType>>;
	    abstract add(item: ItemType): void;
	    abstract remove(item: ItemType): boolean;
	    static isObservableList<ItemType>(array: Array<ItemType>): boolean;
	    protected static _markObservable(target: any): void;
	    static ensureObservable<ItemType>(array: Array<ItemType> | ObservableListImplementation<ItemType>): ObservableList<ItemType>;
	    static create<ItemType>(items?: ItemType[]): ObservableList<ItemType>;
	} class ObservableListImplementation<ItemType> extends ObservableList<ItemType> {
	    readonly _changedEvent: EventDispatcher<Array<ItemType>, ObservableListChangedArgs<ItemType>>;
	    /**
	     * Creates a new observable list
	     * @param items The array of initial items
	     */
	    constructor(items?: ItemType[]);
	    private static _initFields;
	    static implementObservableList<ItemType>(array: Array<ItemType> | ObservableListImplementation<ItemType>): ObservableList<ItemType>;
	    /**
	     * Add an item and raise the list changed event.
	     * @param item The item to add
	     */
	    add(item: ItemType): void;
	    /**
	     * Removes the specified item from the list.
	     * @param item The item to remove.
	     * @returns True if removed, otherwise false.
	     */
	    remove(item: ItemType): boolean;
	    /** Expose the changed event */
	    readonly changed: IEvent<Array<ItemType>, ObservableListChangedArgs<ItemType>>;
	}
	export interface ObservableListConstructor {
	    isObservableList<ItemType>(array: Array<ItemType>): boolean;
	    ensureObservable<ItemType>(array: Array<ItemType>): ObservableList<ItemType>;
	    create<ItemType>(items?: ItemType[]): ObservableList<ItemType>;
	}
	export {};

}
declare module 'VueModel/lib/model.js/src/property' {
	import { Type } from 'VueModel/lib/model.js/src/type';
	import { Entity } from 'VueModel/lib/model.js/src/entity';
	import { EventDispatcher, IEvent } from "ste-events";
	import { Format } from 'VueModel/lib/model.js/src/format';
	export interface PropertyEventArgs {
	    property: Property;
	}
	export interface PropertyAccessEventArgs extends PropertyEventArgs {
	    value: any;
	}
	export interface PropertyChangeEventArgs extends PropertyEventArgs {
	    newValue: any;
	    oldValue: any;
	} class PropertyEventDispatchers {
	    readonly changed: EventDispatcher<Entity, PropertyChangeEventArgs>;
	    readonly accessed: EventDispatcher<Entity, PropertyAccessEventArgs>;
	    constructor();
	}
	export class Property {
	    readonly containingType: Type;
	    readonly name: string;
	    readonly jstype: any;
	    readonly isList: boolean;
	    readonly isStatic: boolean;
	    helptext: string;
	    isPersisted: boolean;
	    isCalculated: boolean;
	    private _label;
	    private _format;
	    private _origin;
	    private _defaultValue;
	    readonly _eventDispatchers: PropertyEventDispatchers;
	    readonly _getter: (args?: any) => any;
	    readonly _setter: (value: any, args?: any) => void;
	    constructor(containingType: Type, name: string, jstype: any, label: string, helptext: string, format: Format, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue?: any, origin?: string);
	    readonly fieldName: string;
	    readonly changedEvent: IEvent<Entity, PropertyChangeEventArgs>;
	    readonly accessedEvent: IEvent<Entity, PropertyAccessEventArgs>;
	    equals(prop: Property): boolean;
	    toString(): string;
	    isDefinedBy(type: Type): boolean;
	    readonly label: string;
	    readonly format: Format;
	    readonly origin: string;
	    readonly defaultValue: any;
	    getPath(): string;
	    canSetValue(obj: Entity, val: any): any;
	    value(obj?: Entity, val?: any, additionalArgs?: any): any;
	    rootedPath(type: Type): string;
	}
	export interface PropertyConstructor {
	    new (containingType: Type, name: string, jstype: any, label: string, helptext: string, format: Format, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue?: any, origin?: string): Property;
	}
	export function Property$_generateShortcuts(property: Property, target: any, recurse?: boolean, overwrite?: boolean): void;
	export function Property$_generateStaticProperty(property: Property): void;
	export function Property$_generatePrototypeProperty(property: Property): void;
	export function Property$_generateOwnProperty(property: Property, obj: Entity): void;
	export function Property$_generateOwnPropertyWithClosure(property: Property, obj: Entity): void;
	export {};

}
declare module 'VueModel/lib/model.js/src/type' {
	import { Model } from 'VueModel/lib/model.js/src/model';
	import { Entity } from 'VueModel/lib/model.js/src/entity';
	import { Property } from 'VueModel/lib/model.js/src/property';
	import { EventDispatcher, IEvent } from "ste-events";
	import { ObservableList } from 'VueModel/lib/model.js/src/observable-list';
	import { Format } from 'VueModel/lib/model.js/src/format';
	export interface TypeEntityInitNewEventArgs {
	    entity: Entity;
	}
	export interface TypeEntityInitExistingEventArgs {
	    entity: Entity;
	}
	export interface TypeEntityDestroyEventArgs {
	    entity: Entity;
	} class TypeEventDispatchers {
	    readonly initNew: EventDispatcher<Type, TypeEntityInitNewEventArgs>;
	    readonly initExisting: EventDispatcher<Type, TypeEntityInitExistingEventArgs>;
	    readonly destroy: EventDispatcher<Type, TypeEntityDestroyEventArgs>;
	    constructor();
	}
	export interface TypePropertyOptions {
	    label?: string;
	    helptext?: string;
	    format?: Format;
	    isPersisted?: boolean;
	    isCalculated?: boolean;
	    defaultValue?: any;
	}
	export class Type {
	    readonly model: Model;
	    readonly fullName: string;
	    readonly jstype: any;
	    readonly baseType: Type;
	    origin: string;
	    originForNewProperties: string;
	    private _counter;
	    private _known;
	    private readonly _pool;
	    private readonly _legacyPool;
	    private readonly _properties;
	    private readonly _derivedTypes;
	    readonly _eventDispatchers: TypeEventDispatchers;
	    constructor(model: Model, fullName: string, baseType?: Type, origin?: string);
	    readonly destroyEvent: IEvent<Type, TypeEntityDestroyEventArgs>;
	    readonly initNewEvent: IEvent<Type, TypeEntityInitNewEventArgs>;
	    readonly initExistingEvent: IEvent<Type, TypeEntityInitExistingEventArgs>;
	    static newIdPrefix: string;
	    newId(): string;
	    register(obj: Entity, id: string, suppressModelEvent?: boolean): void;
	    changeObjectId(oldId: string, newId: string): Entity;
	    unregister(obj: Entity): void;
	    get(id: string, exactTypeOnly?: boolean): Entity;
	    known(): ObservableList<Entity>;
	    addProperty(name: string, jstype: any, isList: boolean, isStatic: boolean, options?: TypePropertyOptions): Property;
	    property(name: string): Property;
	    readonly properties: Array<Property>;
	    readonly derivedTypes: Type[];
	    isSubclassOf(type: Type): boolean;
	    toString(): string;
	}
	export interface TypeConstructor {
	    new (model: Model, fullName: string, baseType?: Type, origin?: string): Type;
	    newIdPrefix: string;
	}
	export {};

}
declare module 'VueModel/lib/model.js/src/model' {
	import { Type } from 'VueModel/lib/model.js/src/type';
	import { EventDispatcher, IEvent } from "ste-events";
	import { Entity } from 'VueModel/lib/model.js/src/entity';
	import { Property } from 'VueModel/lib/model.js/src/property';
	export interface NamespaceOrConstructor {
	    [name: string]: NamespaceOrConstructor;
	}
	export interface ModelTypeAddedEventArgs {
	    type: Type;
	}
	export interface ModelEntityRegisteredEventArgs {
	    entity: Entity;
	}
	export interface ModelEntityUnregisteredEventArgs {
	    entity: Entity;
	}
	export interface ModelPropertyAddedEventArgs {
	    property: Property;
	}
	export interface ModelSettings {
	    createOwnProperties: boolean;
	} class ModelEventDispatchers {
	    readonly typeAdded: EventDispatcher<Model, ModelTypeAddedEventArgs>;
	    readonly entityRegistered: EventDispatcher<Model, ModelEntityRegisteredEventArgs>;
	    readonly entityUnregistered: EventDispatcher<Model, ModelEntityUnregisteredEventArgs>;
	    readonly propertyAdded: EventDispatcher<Model, ModelPropertyAddedEventArgs>;
	    constructor();
	}
	export let Model$_allTypesRoot: NamespaceOrConstructor;
	export class Model {
	    readonly _types: {
	        [name: string]: Type;
	    };
	    readonly _settings: ModelSettings;
	    readonly _eventDispatchers: ModelEventDispatchers;
	    constructor(createOwnProperties?: boolean);
	    readonly typeAddedEvent: IEvent<Model, ModelTypeAddedEventArgs>;
	    readonly entityRegisteredEvent: IEvent<Model, ModelEntityRegisteredEventArgs>;
	    readonly entityUnregisteredEvent: IEvent<Model, ModelEntityUnregisteredEventArgs>;
	    readonly propertyAddedEvent: IEvent<Model, ModelPropertyAddedEventArgs>;
	    dispose(): void;
	    readonly types: Array<Type>;
	    addType(name: string, baseType?: Type, origin?: string): Type;
	    /**
	     * Retrieves the JavaScript constructor function corresponding to the given full type name.
	     * @param name The name of the type
	     */
	    static getJsType(name: string, allowUndefined?: boolean): any;
	}
	export interface ModelConstructor {
	    new (createOwnProperties?: boolean): Model;
	    getJsType(name: string, allowUndefined?: boolean): any;
	}
	export {};

}
declare module 'VueModel/src/helpers' {
	export function getProp(obj: any, prop: string): any;
	export function setProp(target: any, key: string, value: any): void;
	export function hasOwnProperty(obj: any, prop: string): any;
	export function debug(message: string): void;

}
declare module 'VueModel/src/vue-helpers' {
	export function Vue$isReserved(str: string): boolean;
	export function Vue$dependArray(value: Array<any>): void;
	export function Vue$proxy(target: Object, sourceKey: string, key: string): void;

}
declare module 'VueModel/src/entity-observer' {
	import { Model, ModelConstructor } from 'VueModel/lib/model.js/src/model';
	import { Entity, EntityConstructor } from 'VueModel/lib/model.js/src/entity';
	import { PropertyConstructor } from 'VueModel/lib/model.js/src/property';
	import { Observer, ObserverConstructor, DepConstructor } from 'VueModel/src/vue-internals';
	export interface EntityObserver extends Observer {
	}
	export interface EntityObserverConstructor {
	    new (entity: Entity): EntityObserver;
	}
	export type ObserveEntityMethod = (entity: Entity, asRootData?: boolean) => EntityObserver;
	export interface EntityObserverDependencies {
	    entitiesAreVueObservable?: boolean;
	    Model$Model: ModelConstructor;
	    Model$Entity: EntityConstructor;
	    Model$Property: PropertyConstructor;
	    Vue$Observer: ObserverConstructor;
	    Vue$Dep: DepConstructor;
	    VueModel$EntityObserver?: EntityObserverConstructor;
	    VueModel$observeEntity?: ObserveEntityMethod;
	}
	export function VueModel$makeEntitiesVueObservable(model: Model, dependencies: EntityObserverDependencies): EntityObserverDependencies;

}
declare module 'VueModel/src/vue-plugin-entities' {
	import Vue from "vue";
	import { Entity, EntityConstructor } from 'VueModel/lib/model.js/src/entity';
	import { ObserveEntityMethod } from 'VueModel/src/entity-observer';
	import { VuePluginDependencies } from 'VueModel/src/vue-plugin';
	export interface VuePluginEntitiesDependencies {
	    entitiesAreVueObservable: boolean;
	    Model$Entity: EntityConstructor;
	    VueModel$observeEntity: ObserveEntityMethod;
	}
	export function preprocessDataToInterceptEntities(vm: Vue, dependencies: VuePluginDependencies): void;
	export function proxyEntityPropertiesOntoComponentInstance(vm: Vue, entity: Entity): void;
	export function restoreComponentEntityData(vm: Vue, dependencies: VuePluginEntitiesDependencies): void;

}
declare module 'VueModel/src/vue-plugin' {
	import { VueConstructor, ObserverConstructor, DepConstructor } from 'VueModel/src/vue-internals';
	import { EntityConstructor } from 'VueModel/lib/model.js/src/entity';
	export interface VuePluginDependencies {
	    entitiesAreVueObservable: boolean;
	    Model$Entity: EntityConstructor;
	    Vue$Observer?: ObserverConstructor;
	    Vue$Dep?: DepConstructor;
	}
	export function VueModel$installPlugin(Vue: VueConstructor, dependencies: VuePluginDependencies): void;

}
declare module 'VueModel/src/vue-model' {
	import { Model } from 'VueModel/lib/model.js/src/model';
	export interface VueModelOptions {
	    createOwnProperties: boolean;
	}
	export class VueModel {
	    readonly $meta: Model;
	    constructor(options: VueModelOptions);
	}

}
declare module 'VueModel/src/source-path-adapter' {
	import { Entity } from 'VueModel/lib/model.js/src/entity';
	import { Property } from 'VueModel/lib/model.js/src/property';
	import { SourceAdapter, SourcePropertyAdapter } from 'VueModel/src/source-adapter';
	export class SourcePathAdapter<TEntity extends Entity, TValue> implements SourcePropertyAdapter, SourceAdapter<TValue> {
	    readonly source: SourceAdapter<TEntity>;
	    readonly path: string;
	    constructor(source: SourceAdapter<TEntity>, path: string);
	    readonly property: Property;
	    readonly label: string;
	    readonly helptext: string;
	    value: TValue;
	    displayValue: string;
	    toString(): string;
	}
	export interface SourcePathAdapterConstructor {
	    new <TEntity extends Entity, TValue>(source: SourceAdapter<TEntity>, path: string): SourcePathAdapter<TEntity, TValue>;
	}

}
declare module 'VueModel/src/source-index-adapter' {
	import { Entity } from 'VueModel/lib/model.js/src/entity';
	import { SourceAdapter } from 'VueModel/src/source-adapter';
	import { SourcePathAdapter } from 'VueModel/src/source-path-adapter';
	export class SourceIndexAdapter<TEntity extends Entity, TValue> implements SourceAdapter<TValue> {
	    readonly source: SourcePathAdapter<TEntity, TValue[]>;
	    readonly index: number;
	    constructor(source: SourcePathAdapter<TEntity, TValue[]>, index: number);
	    value: TValue;
	    displayValue: string;
	    toString(): string;
	}
	export interface SourceIndexAdapterConstructor {
	    new <TEntity extends Entity, TValue>(source: SourcePathAdapter<TEntity, TValue[]>, index: number): SourceIndexAdapter<TEntity, TValue>;
	}

}
declare module 'VueModel/src/source-adapter' {
	import { Property } from 'VueModel/lib/model.js/src/property';
	export interface SourceAdapter<TValue> {
	    value: TValue;
	    displayValue: string;
	}
	export interface SourcePropertyAdapter {
	    readonly label: string;
	    readonly helptext: string;
	    readonly property: Property;
	}
	export function isSourceAdapter(obj: any): boolean;
	export function isSourcePropertyAdapter(obj: any): boolean;

}
declare module 'VueModel/src/source-root-adapter' {
	import { Entity } from 'VueModel/lib/model.js/src/entity';
	import { SourceAdapter } from 'VueModel/src/source-adapter';
	export class SourceRootAdapter<TEntity extends Entity> implements SourceAdapter<TEntity> {
	    readonly entity: TEntity;
	    constructor(entity: TEntity);
	    readonly value: TEntity;
	    readonly displayValue: string;
	    toString(): string;
	}
	export interface SourceRootAdapterConstructor {
	    new <TEntity extends Entity>(entity: TEntity): SourceRootAdapter<TEntity>;
	}

}
declare module 'VueModel/src/source-binding' {
	import Vue from "vue";
	import { EntityConstructor } from 'VueModel/lib/model.js/src/entity';
	import { SourceAdapter } from 'VueModel/src/source-adapter';
	export interface SourceBindingDependencies {
	    Model$Entity: EntityConstructor;
	}
	export function proxySourceAdapterPropertiesOntoComponentInstance(vm: Vue, rootKey: string): void;
	export function preprocessPropsToInterceptSource(vm: Vue): void;
	export function defineDollarSourceProperty(vm: Vue, sourceAdapter: SourceAdapter<any>): void;
	export function getSourceBindingContainer(vm: Vue, dependencies: SourceBindingDependencies, detectImplicitSource?: boolean): Vue;
	export function establishBindingSource(vm: Vue, dependencies: SourceBindingDependencies): void;

}
declare module 'VueModel/src/source-provider' {
	import { EntityConstructor } from 'VueModel/lib/model.js/src/entity';
	export interface SourceProviderDependencies {
	    Model$Entity: EntityConstructor;
	}
	export function SourceProviderMixin(dependencies: SourceProviderDependencies): {
	    props: string[];
	    beforeCreate: () => void;
	    created: () => void;
	};

}
declare module 'VueModel/src/source-consumer' {
	import { EntityConstructor } from 'VueModel/lib/model.js/src/entity';
	export interface SourceConsumerDependencies {
	    Model$Entity: EntityConstructor;
	}
	export function SourceConsumerMixin(dependencies: SourceConsumerDependencies): {
	    created: () => void;
	};

}
declare module 'VueModel/src/main' {
	 let api: any;
	export default api;

}
