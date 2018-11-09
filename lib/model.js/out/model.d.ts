declare module 'model.js/interfaces' {
	import { IEvent, EventDispatcher } from "ste-events";
	export interface Model {
	    readonly settings: ModelSettings;
	    typeAddedEvent: IEvent<Model, ModelTypeAddedEventArgs>;
	    entityRegisteredEvent: IEvent<Model, ModelEntityRegisteredEventArgs>;
	    entityUnregisteredEvent: IEvent<Model, ModelEntityUnregisteredEventArgs>;
	    propertyAddedEvent: IEvent<Model, ModelPropertyAddedEventArgs>;
	    dispose(): void;
	    addType(name: string, baseType?: Type, origin?: string): Type;
	    registerRule(rule: Rule): void;
	    registerRules(): void;
	}
	export interface ModelConstructor {
	    new (createOwnProperties?: boolean): Model;
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
	    readonly createOwnProperties: boolean;
	}
	export interface ModelNamespace {
	    [name: string]: ModelNamespace | EntityConstructor;
	}
	export interface Type {
	    readonly model: Model;
	    readonly fullName: string;
	    readonly ctor: EntityConstructorForType<Entity>;
	    readonly baseType: Type;
	    readonly derivedTypes: Type[];
	    readonly properties: Property[];
	    origin: string;
	    originForNewProperties: string;
	    destroyEvent: IEvent<Type, TypeEntityDestroyEventArgs>;
	    initNewEvent: IEvent<Type, TypeEntityInitNewEventArgs>;
	    initExistingEvent: IEvent<Type, TypeEntityInitExistingEventArgs>;
	    get(id: string, exactTypeOnly?: boolean): Entity;
	    known(): Entity[];
	    addProperty(name: string, jstype: any, isList: boolean, isStatic: boolean, options?: TypePropertyOptions): Property;
	    getProperty(name: string): Property;
	    addRule(def: ((entity: Entity) => void) | RuleOptions): Rule;
	    isSubclassOf(type: Type): boolean;
	    hasModelProperty(prop: Property): boolean;
	    register(obj: Entity, id: string, suppressModelEvent?: boolean): void;
	    unregister(obj: Entity): void;
	}
	export interface TypeConstructor {
	    new (model: Model, fullName: string, baseType?: Type, origin?: string): Type;
	}
	export interface TypeEntityInitNewEventArgs {
	    entity: Entity;
	}
	export interface TypeEntityInitExistingEventArgs {
	    entity: Entity;
	}
	export interface TypeEntityDestroyEventArgs {
	    entity: Entity;
	}
	export interface TypePropertyOptions {
	    label?: string;
	    helptext?: string;
	    format?: Format;
	    isPersisted?: boolean;
	    isCalculated?: boolean;
	    defaultValue?: any;
	}
	export interface PropertySpec {
	    readonly containingType: Type;
	    readonly name: string;
	    readonly propertyType: any;
	    readonly format: Format;
	    readonly label: string;
	    readonly helptext: string;
	    readonly isStatic: boolean;
	    readonly isList: boolean;
	    equals(prop: Property | PropertyChain): boolean;
	    canSetValue(obj: Entity, value: any): boolean;
	    value(obj?: Entity, val?: any, additionalArgs?: any): any;
	}
	export interface Property extends PropertySpec {
	    readonly fieldName: string;
	    readonly defaultValue: any;
	    readonly changedEvent: IEvent<Entity, PropertyChangeEventArgs>;
	    readonly accessedEvent: IEvent<Entity, PropertyAccessEventArgs>;
	    readonly getter: (args?: any) => any;
	    readonly setter: (value: any, args?: any) => void;
	    isInited(obj: Entity): boolean;
	}
	export interface PropertyConstructor {
	    new (containingType: Type, name: string, jstype: any, label: string, helptext: string, format: Format, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue?: any, origin?: string): Property;
	}
	export interface PropertyEventDispatchers {
	    readonly changedEvent: EventDispatcher<Entity, PropertyChangeEventArgs>;
	    readonly accessedEvent: EventDispatcher<Entity, PropertyAccessEventArgs>;
	}
	export interface PropertyEventArgs {
	    property: PropertySpec;
	}
	export interface PropertyAccessEventHandler {
	    (sender: Entity, args: PropertyAccessEventArgs): void;
	}
	export interface PropertyAccessEventArgs extends PropertyEventArgs {
	    value: any;
	}
	export interface PropertyChangeEventHandler {
	    (sender: Entity, args: PropertyChangeEventArgs): void;
	}
	export interface PropertyChangeEventArgs extends PropertyEventArgs {
	    newValue: any;
	    oldValue: any;
	}
	export type PropertyGetMethod = (property: Property, entity: Entity, additionalArgs: any) => any;
	export type PropertySetMethod = (property: Property, entity: Entity, val: any, additionalArgs: any, skipTypeCheck: boolean) => void;
	export interface PropertyChain extends PropertySpec {
	    readonly rootType: Type;
	    toPropertyArray(): Property[];
	    equals(prop: Property | PropertyChain): boolean;
	    testConnection(fromRoot: Entity, toObj: any, viaProperty: Property): boolean;
	    isInited(obj: Entity, enforceCompleteness?: boolean): boolean;
	    path: string;
	}
	export interface PropertyChainConstructor {
	    new (rootType: Type, properties: Property[], filters: ((obj: Entity) => boolean)[]): PropertyChain;
	}
	export interface PropertyChainAccessEventHandler {
	    (sender: Entity, args: PropertyChainAccessEventArgs): void;
	}
	export interface PropertyChainAccessEventArgs extends PropertyAccessEventArgs {
	    originalSender: Entity;
	    triggeredBy: Property;
	}
	export interface PropertyChainChangeEventHandler {
	    (sender: Entity, args: PropertyChainChangeEventArgs): void;
	}
	export interface PropertyChainChangeEventArgs extends PropertyChangeEventArgs {
	    originalSender: Entity;
	    triggeredBy: Property;
	}
	export interface Entity {
	    readonly meta: ObjectMeta;
	    readonly accessedEvent: IEvent<Property, EntityAccessEventArgs>;
	    readonly changedEvent: IEvent<Property, EntityChangeEventArgs>;
	    init(properties: {
	        [name: string]: any;
	    }): void;
	    init(property: string, value: any): void;
	    init(property: any, value?: any): void;
	    set(properties: {
	        [name: string]: any;
	    }): void;
	    set(property: string, value: any): void;
	    set(property: any, value?: any): void;
	    get(property: string): any;
	    toString(format: string): string;
	}
	export interface EntityConstructor {
	    new (): Entity;
	}
	export interface EntityConstructorForType<TEntity extends Entity> extends EntityConstructor {
	    new (): TEntity;
	    meta: Type;
	}
	export interface EntityEventDispatchers {
	    readonly accessedEvent: EventDispatcher<Property, EntityAccessEventArgs>;
	    readonly changedEvent: EventDispatcher<Property, EntityChangeEventArgs>;
	}
	export interface EntityEventArgs {
	    entity: Entity;
	}
	export interface EntityAccessEventHandler {
	    (sender: Property, args: EntityAccessEventArgs): void;
	}
	export interface EntityAccessEventArgs extends EntityEventArgs {
	    property: Property;
	}
	export interface EntityChangeEventHandler {
	    (sender: Property, args: EntityChangeEventArgs): void;
	}
	export interface EntityChangeEventArgs extends EntityEventArgs {
	    property: Property;
	}
	export interface ObjectMeta {
	    readonly type: Type;
	    readonly entity: Entity;
	    id: string;
	    readonly isNew: boolean;
	    legacyId: string;
	    destroy(): void;
	}
	export interface ObjectMetaConstructor {
	    new (type: Type, entity: Entity, id: string, isNew: boolean): ObjectMeta;
	}
	export interface Format {
	    specifier: string;
	    convertFn: FormatConvertFunction;
	    convertBackFn: FormatConvertBackFunction;
	    formatEval: (value: string) => string;
	    description: string;
	    nullString: string;
	    undefinedString: string;
	    convert(val: any): string;
	    convertBack(val: string): any;
	}
	export interface FormatOptions {
	    specifier: string;
	    convert: FormatConvertFunction;
	    convertBack?: FormatConvertBackFunction;
	    formatEval?: (value: string) => string;
	    description?: string;
	    nullString?: string;
	    undefinedString?: string;
	}
	export interface FormatConstructor {
	    new (options: FormatOptions): Format;
	}
	export type FormatConvertFunction = (value: any) => string;
	export type FormatConvertBackFunction = (value: string) => string;
	export interface PathTokens {
	    expression: string;
	    steps: PathToken[];
	}
	export interface PathToken {
	    property: string;
	    cast: string;
	}
	export interface RuleOptions {
	    /** The optional unique name of the rule. */
	    name?: string;
	    /** The source property for the allowed values (either a Property or PropertyChain instance or a string property path). */
	    execute?: (entity: Entity) => void;
	    /** Indicates that the rule should run when an instance of the root type is initialized. */
	    onInit?: boolean;
	    /** Indicates that the rule should run when a new instance of the root type is initialized. */
	    onInitNew?: boolean;
	    /** Indicates that the rule should run when an existing instance of the root type is initialized. */
	    onInitExisting?: boolean;
	    /** Array of property paths (strings, Property or PropertyChain instances) that trigger rule execution when changed. */
	    onChangeOf?: (string | Property | PropertyChain)[];
	    /** Array of properties (strings or Property instances) that the rule is responsible for calculating */
	    returns?: (string | Property)[];
	}
	/**
	 * Encapsulates a function that executes automatically in response to model change events.
	 */
	export interface Rule {
	    /** The name of the rule. */
	    readonly name: string;
	    /** The root type the rule is bound to */
	    readonly rootType: Type;
	    /** The function to execute when the rule is triggered. */
	    execute: (entity: Entity) => void;
	    /** Array of property paths (strings, Property or PropertyChain instances) that trigger rule execution when changed. */
	    readonly predicates: (Property | PropertyChain)[];
	    /** Array of properties (strings or Property instances) that the rule is responsible for calculating */
	    readonly returnValues: Property[];
	    register(): void;
	}
	export interface RuleConstructor {
	    new (rootType: Type, name: string, options: RuleOptions): Rule;
	}
	export interface EventRegistration<TSender, THandler> {
	    handler: THandler;
	    sender?: TSender;
	    unsubscribe: () => void;
	}
	export interface EventSubscription<THandler> {
	    handler: THandler;
	    isExecuted?: boolean;
	    isOnce?: boolean;
	}

}
declare module 'model.js/object-meta' {
	import { Type as IType } from 'model.js/interfaces';
	import { Entity as IEntity } from 'model.js/interfaces';
	import { ObjectMeta as IObjectMeta } from 'model.js/interfaces';
	export class ObjectMeta implements IObjectMeta {
	    readonly type: IType;
	    readonly entity: IEntity;
	    private _id;
	    private _isNew;
	    private _legacyId;
	    constructor(type: IType, entity: IEntity, id: string, isNew: boolean);
	    id: string;
	    readonly isNew: boolean;
	    legacyId: string;
	    destroy(): void;
	}

}
declare module 'model.js/functor' {
	export interface Functor {
	    add(fn: Function, filter?: () => boolean, once?: boolean): void;
	    remove(fn: Function): boolean;
	    isEmpty(args?: Array<any>): boolean;
	    clear(): void;
	}
	export interface FunctorWith1Arg<TArg1, TResult> extends Functor {
	    add(fn: (a1: TArg1) => TResult, filter?: () => boolean, once?: boolean): void;
	}
	export interface FunctorWith2Args<TArg1, TArg2, TResult> extends Functor {
	    add(fn: (a1: TArg1, a2: TArg2) => TResult, filter?: () => boolean, once?: boolean): void;
	}
	export interface FunctorItem {
	    fn: Function;
	    applied?: boolean;
	    filter?: () => boolean;
	    once?: boolean;
	}
	export function Functor$create(functions?: Function[], returns?: boolean): Functor & Function;
	export function FunctorItem$new(fn: Function, filter?: () => boolean, once?: boolean): FunctorItem;
	export function Functor$add(fn: Function, filter?: () => boolean, once?: boolean): void;
	export function Functor$remove(fn: Function): boolean;
	export function Functor$isEmpty(args?: Array<any>): boolean;
	export function Functor$clear(): void;

}
declare module 'model.js/helpers' {
	import { EventDispatcher, IEventHandler } from "ste-events";
	import { EventSubscription } from 'model.js/interfaces';
	export function ensureNamespace(name: string, parentNamespace: any): any;
	export function navigateAttribute(obj: any, attr: string, callback: Function, thisPtr?: any): void;
	export function evalPath(obj: any, path: string, nullValue?: any, undefinedValue?: any): any;
	export function parseFunctionName(fn: Function): string;
	export function getTypeName(obj: any): any;
	export function isNumber(obj: any): boolean;
	export function getDefaultValue(isList: boolean, jstype: any): any;
	export function randomInteger(min?: number, max?: number): number;
	export function randomText(len: number, includeDigits?: boolean): string;
	export function toTitleCase(input: string): string;
	export function hasOwnProperty(obj: any, prop: string): boolean;
	export function getEventSubscriptions<TSender, TArgs>(dispatcher: EventDispatcher<TSender, TArgs>): EventSubscription<IEventHandler<TSender, TArgs>>[];
	export interface ObjectLiteral<T> {
	    [key: string]: T;
	}

}
declare module 'model.js/internals' {
	export function createSecret(key: string, len?: number, includeLetters?: boolean, includeDigits?: boolean, prefix?: string): string;
	export function getSecret(key: string): string;

}
declare module 'model.js/observable-list' {
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
declare module 'model.js/signal' {
	export class Signal {
	    readonly label: string;
	    private _waitForAll;
	    private _pending;
	    constructor(label: string);
	    readonly isActive: boolean;
	    pending(callback: Function, thisPtr?: any, executeImmediately?: boolean): () => void;
	    waitForAll(callback: Function, thisPtr?: any, executeImmediately?: boolean, args?: any[]): void;
	    decrement(): void;
	}

}
declare module 'model.js/path-tokens' {
	import { PathTokens as IPathTokens } from 'model.js/interfaces';
	import { PathToken as IPathToken } from 'model.js/interfaces';
	import { PropertySpec } from 'model.js/interfaces';
	export class PathTokens implements IPathTokens {
	    expression: string;
	    steps: IPathToken[];
	    constructor(expression: string);
	    buildExpression(): string;
	    toString(): string;
	}
	export function PathTokens$normalizePaths(paths: (string | PropertySpec)[]): PathTokens[];

}
declare module 'model.js/property-chain' {
	import { Type as IType } from 'model.js/interfaces';
	import { PropertyChain as IPropertyChain, PropertyChainChangeEventArgs, PropertyChainAccessEventArgs } from 'model.js/interfaces';
	import { Property as IProperty, PropertyAccessEventHandler, PropertyChangeEventHandler } from 'model.js/interfaces';
	import { Entity as IEntity } from 'model.js/interfaces';
	import { EventDispatcher, IEvent } from "ste-events";
	import { Format as IFormat } from 'model.js/interfaces';
	import { PathTokens } from 'model.js/path-tokens'; class PropertyChainEventDispatchers {
	    readonly changedEvent: EventDispatcher<IEntity, PropertyChainChangeEventArgs>;
	    readonly accessedEvent: EventDispatcher<IEntity, PropertyChainAccessEventArgs>;
	    constructor();
	}
	interface EventSubscription<THandler> {
	    handler: THandler;
	    unsubscribe: () => void;
	}
	/**
	 * Encapsulates the logic required to work with a chain of properties and
	 * a root object, allowing interaction with the chain as if it were a
	 * single property of the root object.
	 */
	export class PropertyChain implements IPropertyChain {
	    readonly rootType: IType;
	    readonly _properties: IProperty[];
	    readonly _propertyFilters: ((obj: IEntity) => boolean)[];
	    readonly _propertyAccessSubscriptions: EventSubscription<PropertyAccessEventHandler>[];
	    readonly _propertyChangeSubscriptions: EventSubscription<PropertyChangeEventHandler>[];
	    readonly _eventDispatchers: PropertyChainEventDispatchers;
	    private _path;
	    constructor(rootType: IType, properties: IProperty[], filters: ((obj: IEntity) => boolean)[]);
	    readonly changedEvent: IEvent<IEntity, PropertyChainChangeEventArgs>;
	    readonly accessedEvent: IEvent<IEntity, PropertyChainAccessEventArgs>;
	    equals(prop: IProperty | IPropertyChain): boolean;
	    /**
	     * Iterates over all objects along a property chain starting with the root object (obj).
	     * This is analogous to the Array forEach function. The callback may return a Boolean
	     * value to indicate whether or not to continue iterating.
	     * @param obj The root object (of type `IEntity`) to use in iterating over the chain.
	     * @param callback The function to invoke at each iteration step.  May return a Boolean value to indicate whether or not to continue iterating.
	     * @param thisPtr Optional object to use as the `this` pointer when invoking the callback.
	     * @param propFilter An optional property filter, if specified, only iterates over the results of this property.
	     */
	    forEach(obj: IEntity, callback: (obj: any, index: number, array: Array<any>, prop: IProperty, propIndex: number, props: IProperty[]) => any, thisPtr?: any, propFilter?: IProperty): boolean;
	    readonly path: string;
	    readonly firstProperty: IProperty;
	    readonly lastProperty: IProperty;
	    toPropertyArray(): IProperty[];
	    getLastTarget(obj: IEntity): IEntity;
	    append(prop: IProperty | IPropertyChain): IPropertyChain;
	    prepend(prop: IProperty | IPropertyChain): PropertyChain;
	    canSetValue(obj: IEntity, value: any): boolean;
	    testConnection(fromRoot: IEntity, toObj: any, viaProperty: IProperty): boolean;
	    getRootedPath(rootType: IType): string;
	    readonly containingType: IType;
	    readonly propertyType: any;
	    readonly format: IFormat;
	    readonly isList: boolean;
	    readonly isStatic: boolean;
	    readonly label: string;
	    readonly helptext: string;
	    readonly name: string;
	    value(obj?: IEntity, val?: any, additionalArgs?: any): any;
	    /**
	     * Determines if the property chain is initialized, akin to single IProperty initialization.
	     * @param obj The root object
	     * @param enforceCompleteness Whether or not the chain must be complete in order to be considered initialized
	     */
	    isInited(obj: IEntity, enforceCompleteness?: boolean): boolean;
	    toString(): string;
	}
	export function PropertyChain$isPropertyChain(obj: any): boolean;
	export function PropertyChain$_getEventDispatchers(chain: IPropertyChain): PropertyChainEventDispatchers;
	export function PropertyChain$_dispatchEvent<TSender, TArgs>(chain: IPropertyChain, eventName: string, sender: TSender, args: TArgs): void;
	export function PropertyChain$create(rootType: IType, pathTokens: PathTokens): IPropertyChain;
	export function PropertyChain$_addAccessedHandler(chain: PropertyChain, handler: (sender: IEntity, args: PropertyChainAccessEventArgs) => void, obj: IEntity, toleratePartial: boolean): () => void;
	export function PropertyChain$_addChangedHandler(chain: PropertyChain, handler: (sender: IEntity, args: PropertyChainChangeEventArgs) => void, obj: IEntity, toleratePartial: boolean): () => void;
	export {};

}
declare module 'model.js/entity' {
	import { IEvent } from "ste-events";
	import { Entity as IEntity, EntityEventDispatchers, EntityChangeEventArgs, EntityAccessEventArgs } from 'model.js/interfaces';
	import { Property as IProperty } from 'model.js/interfaces';
	import { ObjectMeta as IObjectMeta } from 'model.js/interfaces';
	export class Entity implements IEntity {
	    readonly meta: IObjectMeta;
	    readonly _eventDispatchers: EntityEventDispatchers;
	    constructor();
	    readonly accessedEvent: IEvent<IProperty, EntityAccessEventArgs>;
	    readonly changedEvent: IEvent<IProperty, EntityChangeEventArgs>;
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
	}
	export function Entity$toIdString(obj: IEntity): string;
	export function Entity$fromIdString(idString: string): IEntity;
	export function Entity$_getEventDispatchers(prop: IEntity): EntityEventDispatchers;
	export function Entity$_dispatchEvent<TSender, TArgs>(entity: IEntity, eventName: string, sender: TSender, args: TArgs): void;

}
declare module 'model.js/property' {
	import { IEvent } from "ste-events";
	import { Entity as IEntity } from 'model.js/interfaces';
	import { Format as IFormat } from 'model.js/interfaces';
	import { ObjectMeta as IObjectMeta } from 'model.js/interfaces';
	import { EventRegistration } from 'model.js/interfaces';
	import { Property as IProperty, PropertyEventDispatchers, PropertyChangeEventArgs, PropertyAccessEventArgs, PropertyAccessEventHandler, PropertyChangeEventHandler } from 'model.js/interfaces';
	import { PropertyChain as IPropertyChain } from 'model.js/interfaces';
	import { Type as IType } from 'model.js/interfaces';
	export class Property implements IProperty {
	    readonly containingType: IType;
	    readonly name: string;
	    readonly propertyType: any;
	    readonly isList: boolean;
	    readonly isStatic: boolean;
	    helptext: string;
	    isPersisted: boolean;
	    isCalculated: boolean;
	    private _label;
	    private _format;
	    private _origin;
	    private _defaultValue;
	    readonly _propertyAccessSubscriptions: EventRegistration<IEntity, PropertyAccessEventHandler>[];
	    readonly _propertyChangeSubscriptions: EventRegistration<IEntity, PropertyChangeEventHandler>[];
	    readonly _eventDispatchers: PropertyEventDispatchers;
	    readonly getter: (args?: any) => any;
	    readonly setter: (value: any, args?: any) => void;
	    constructor(containingType: IType, name: string, jstype: any, label: string, helptext: string, format: IFormat, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue?: any, origin?: string);
	    readonly fieldName: string;
	    readonly changedEvent: IEvent<IEntity, PropertyChangeEventArgs>;
	    readonly accessedEvent: IEvent<IEntity, PropertyAccessEventArgs>;
	    equals(prop: IProperty | IPropertyChain): boolean;
	    toString(): string;
	    readonly label: string;
	    readonly format: IFormat;
	    readonly origin: string;
	    readonly defaultValue: any;
	    getPath(): string;
	    canSetValue(obj: IEntity, val: any): boolean;
	    value(obj?: IEntity, val?: any, additionalArgs?: any): any;
	    isInited(obj: IEntity): boolean;
	}
	export function Property$isProperty(obj: any): boolean;
	export function Property$equals(prop1: IProperty | IPropertyChain, prop2: IProperty | IPropertyChain): boolean;
	export function Property$_generateShortcuts(property: IProperty, target: any, recurse?: boolean, overwrite?: boolean): void;
	export function Property$_generateStaticProperty(property: IProperty): void;
	export function Property$_generatePrototypeProperty(property: IProperty): void;
	export function Property$_generateOwnProperty(property: IProperty, obj: IEntity): void;
	export function Property$_getEventDispatchers(prop: IProperty): PropertyEventDispatchers;
	export function Property$_dispatchEvent<TSender, TArgs>(prop: IProperty, eventName: string, sender: TSender, args: TArgs): void;
	export function Property$_generateOwnPropertyWithClosure(property: Property, obj: IEntity): void;
	export function Property$pendingInit(target: IType | IObjectMeta, prop: IProperty, value?: boolean): boolean | void;
	export function Property$addAccessed(prop: IProperty | IPropertyChain, handler: (sender: IEntity, args: any) => void, obj?: IEntity, toleratePartial?: boolean): () => void;
	export function Property$_addChangedHandler(prop: IProperty, handler: (sender: IEntity, args: PropertyChangeEventArgs) => void, obj?: IEntity): () => void;
	export function Property$addChanged(prop: IProperty | IPropertyChain, handler: (sender: IEntity, args: any) => void, obj?: IEntity, toleratePartial?: boolean): () => void;
	export function hasPropertyChangedSubscribers(prop: IProperty, obj: IEntity): boolean;

}
declare module 'model.js/rule-invocation-type' {
	export const enum RuleInvocationType {
	    /** Occurs when an existing instance is initialized.*/
	    InitExisting = 2,
	    /** Occurs when a new instance is initialized. */
	    InitNew = 4,
	    /** Occurs when a property value is retrieved. */
	    PropertyGet = 8,
	    /** Occurs when a property value is changed. */
	    PropertyChanged = 16
	}

}
declare module 'model.js/event-scope' {
	import { EventDispatcher, IEvent } from "ste-events";
	export let EventScope$current: EventScope;
	interface EventScopeExitEventArgs {
	}
	interface EventScopeAbortEventArgs {
	    maxNestingExceeded: boolean;
	} class EventScopeEventDispatchers {
	    readonly exitEvent: EventDispatcher<EventScope, EventScopeExitEventArgs>;
	    readonly abortEvent: EventDispatcher<EventScope, EventScopeAbortEventArgs>;
	    constructor();
	}
	export class EventScope {
	    parent: EventScope;
	    _isActive: boolean;
	    private _exitEventVersion;
	    private _exitEventHandlerCount;
	    readonly _eventDispatchers: EventScopeEventDispatchers;
	    constructor();
	    readonly isActive: boolean;
	    readonly exitEvent: IEvent<EventScope, EventScopeExitEventArgs>;
	    readonly abortEvent: IEvent<EventScope, EventScopeAbortEventArgs>;
	    abort(maxNestingExceeded?: boolean): void;
	    exit(): void;
	}
	export function EventScope$onExit(callback: Function, thisPtr?: any): void;
	export function EventScope$onAbort(callback: Function, thisPtr?: any): void;
	export function EventScope$perform(callback: Function, thisPtr?: any): void;
	export {};

}
declare module 'model.js/rule' {
	import { Entity as IEntity } from 'model.js/interfaces';
	import { Property as IProperty } from 'model.js/interfaces';
	import { Rule as IRule, RuleOptions } from 'model.js/interfaces';
	import { PropertyChain as IPropertyChain } from 'model.js/interfaces';
	import { Type as IType } from 'model.js/interfaces';
	import { RuleInvocationType } from 'model.js/rule-invocation-type';
	export class Rule implements IRule {
	    readonly rootType: IType;
	    readonly name: string;
	    execute: (entity: IEntity) => void;
	    invocationTypes: RuleInvocationType;
	    predicates: (IProperty | IPropertyChain)[];
	    returnValues: IProperty[];
	    private _registered;
	    /**
	     * Creates a rule that executes a delegate when specified model events occur.
	     * @param rootType The model type the rule is for.
	     * @param options The options for the rule.
	     */
	    constructor(rootType: IType, name: string, options: RuleOptions);
	    onInitNew(): this;
	    onInitExisting(): this;
	    onInit(): this;
	    /**
	     * Indicates that the rule should automatically run when one of the specified property paths changes.
	     * @param predicates An array of property paths (strings, Property or PropertyChain instances) that drive when the rule should execute due to property changes.
	     */
	    onChangeOf(predicates: (string | IProperty | IPropertyChain)[]): this;
	    onChangeOf(...predicates: (string | IProperty | IPropertyChain)[]): this;
	    /**
	     * Indicates that the rule is responsible for calculating and returning values of one or more properties on the root type.
	     * @param properties An array of properties (string name or IProperty instance) that the rule is responsible to calculating the value of.
	     */
	    returns(properties: (string | IProperty)[]): this;
	    returns(...properties: (string | IProperty)[]): this;
	    register(): void;
	}
	export function Rule$create(rootType: IType, optionsOrFunction: ((entity: IEntity) => void) | RuleOptions): Rule;

}
declare module 'model.js/type' {
	import { Model as IModel } from 'model.js/interfaces';
	import { Type as IType, TypeEntityInitNewEventArgs, TypeEntityInitExistingEventArgs, TypeEntityDestroyEventArgs, TypePropertyOptions } from 'model.js/interfaces';
	import { Entity as IEntity, EntityConstructorForType } from 'model.js/interfaces';
	import { Property as IProperty } from 'model.js/interfaces';
	import { EventDispatcher, IEvent } from "ste-events";
	import { Rule as IRule, RuleOptions } from 'model.js/interfaces'; class TypeEventDispatchers {
	    readonly initNewEvent: EventDispatcher<IType, TypeEntityInitNewEventArgs>;
	    readonly initExistingEvent: EventDispatcher<IType, TypeEntityInitExistingEventArgs>;
	    readonly destroyEvent: EventDispatcher<IType, TypeEntityDestroyEventArgs>;
	    constructor();
	}
	export class Type implements IType {
	    readonly model: IModel;
	    readonly fullName: string;
	    readonly ctor: EntityConstructorForType<IEntity>;
	    readonly baseType: Type;
	    origin: string;
	    originForNewProperties: string;
	    private _lastId;
	    private _known;
	    private readonly _pool;
	    private readonly _legacyPool;
	    private readonly _properties;
	    private readonly _derivedTypes;
	    readonly _eventDispatchers: TypeEventDispatchers;
	    constructor(model: IModel, fullName: string, baseType?: Type, origin?: string);
	    readonly destroyEvent: IEvent<IType, TypeEntityDestroyEventArgs>;
	    readonly initNewEvent: IEvent<IType, TypeEntityInitNewEventArgs>;
	    readonly initExistingEvent: IEvent<IType, TypeEntityInitExistingEventArgs>;
	    newId(): string;
	    register(obj: IEntity, id: string, suppressModelEvent?: boolean): void;
	    changeObjectId(oldId: string, newId: string): IEntity;
	    unregister(obj: IEntity): void;
	    get(id: string, exactTypeOnly?: boolean): IEntity;
	    known(): IEntity[];
	    addProperty(name: string, jstype: any, isList: boolean, isStatic: boolean, options?: TypePropertyOptions): IProperty;
	    getProperty(name: string): IProperty;
	    readonly properties: IProperty[];
	    addRule(def: ((entity: IEntity) => void) | RuleOptions): IRule;
	    readonly derivedTypes: IType[];
	    hasModelProperty(prop: IProperty): boolean;
	    isSubclassOf(type: IType): boolean;
	    toString(): string;
	}
	export function Type$_getEventDispatchers(type: IType): TypeEventDispatchers;
	export function Type$_dispatchEvent<TSender, TArgs>(type: IType, eventName: string, sender: TSender, args: TArgs): void;
	export function Type$create(model: IModel, fullName: string, baseType?: IType, origin?: string): Type;
	export function Type$isType(obj: any): boolean;
	export {};

}
declare module 'model.js/model' {
	import { Model as IModel, ModelNamespace, ModelSettings, ModelTypeAddedEventArgs, ModelEntityRegisteredEventArgs, ModelEntityUnregisteredEventArgs, ModelPropertyAddedEventArgs } from 'model.js/interfaces';
	import { Type as IType } from 'model.js/interfaces';
	import { IEvent, EventDispatcher } from "ste-events";
	import { Entity as IEntity, EntityConstructorForType } from 'model.js/interfaces';
	import { Property as IProperty } from 'model.js/interfaces';
	import { PropertyChain as IPropertyChain } from 'model.js/interfaces';
	import { PathTokens as IPathTokens } from 'model.js/interfaces';
	import { Rule as IRule } from 'model.js/interfaces'; class ModelEventDispatchers {
	    readonly typeAddedEvent: EventDispatcher<IModel, ModelTypeAddedEventArgs>;
	    readonly entityRegisteredEvent: EventDispatcher<IModel, ModelEntityRegisteredEventArgs>;
	    readonly entityUnregisteredEvent: EventDispatcher<IModel, ModelEntityUnregisteredEventArgs>;
	    readonly propertyAddedEvent: EventDispatcher<IModel, ModelPropertyAddedEventArgs>;
	    constructor();
	}
	export let Model$_allTypesRoot: ModelNamespace;
	export class Model implements IModel {
	    readonly settings: ModelSettings;
	    readonly _types: {
	        [name: string]: IType;
	    };
	    private readonly _eventDispatchers;
	    private _ruleQueue;
	    constructor(createOwnProperties?: boolean);
	    readonly typeAddedEvent: IEvent<IModel, ModelTypeAddedEventArgs>;
	    readonly entityRegisteredEvent: IEvent<IModel, ModelEntityRegisteredEventArgs>;
	    readonly entityUnregisteredEvent: IEvent<IModel, ModelEntityUnregisteredEventArgs>;
	    readonly propertyAddedEvent: IEvent<IModel, ModelPropertyAddedEventArgs>;
	    dispose(): void;
	    readonly types: IType[];
	    addType(name: string, baseType?: IType, origin?: string): import("./type").Type;
	    registerRule(rule: IRule): void;
	    registerRules(): void;
	}
	export function Model$_getEventDispatchers(model: IModel): ModelEventDispatchers;
	export function Model$_dispatchEvent<TSender, TArgs>(model: IModel, eventName: string, sender: TSender, args: TArgs): void;
	export function Model$whenTypeAvailable(type: IType, forceLoad: boolean, callback: Function): any;
	/**
	 * Retrieves the JavaScript constructor function corresponding to the given full type name.
	 * @param fullName The full name of the type, including the namespace
	 * @param allowUndefined If true, return undefined if the type is not defined
	 */
	export function Model$getJsType<TEntity extends IEntity>(fullName: string, allowUndefined?: boolean): EntityConstructorForType<TEntity>;
	export function Model$getPropertyOrPropertyChain(pathOrTokens: string | IPathTokens, thisType: any, forceLoadTypes: boolean, callback: (result: IProperty | IPropertyChain) => void, thisPtr?: any): IProperty | IPropertyChain | void;
	export {};

}
declare module 'model.js/format' {
	import { Format as IFormat, FormatOptions, FormatConvertFunction, FormatConvertBackFunction } from 'model.js/interfaces';
	export class Format implements IFormat {
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

}
declare module 'model.js/main' {
	import { Model as ModelInterface } from 'model.js/interfaces';
	export type Model = ModelInterface;
	export const Model: ModelConstructor;
	import { ModelConstructor, ModelSettings, ModelEntityRegisteredEventArgs, ModelEntityUnregisteredEventArgs, ModelTypeAddedEventArgs, ModelPropertyAddedEventArgs } from 'model.js/interfaces';
	export type ModelConstructor = ModelConstructor;
	export type ModelSettings = ModelSettings;
	export type ModelEntityRegisteredEventArgs = ModelEntityRegisteredEventArgs;
	export type ModelEntityUnregisteredEventArgs = ModelEntityUnregisteredEventArgs;
	export type ModelTypeAddedEventArgs = ModelTypeAddedEventArgs;
	export type ModelPropertyAddedEventArgs = ModelPropertyAddedEventArgs;
	import { Type as TypeInterface } from 'model.js/interfaces';
	export type Type = TypeInterface;
	import { Type as TypeClass } from 'model.js/type';
	export const Type: typeof TypeClass;
	import { TypeConstructor, TypePropertyOptions, TypeEntityInitNewEventArgs, TypeEntityInitExistingEventArgs, TypeEntityDestroyEventArgs } from 'model.js/interfaces';
	export type TypeConstructor = TypeConstructor;
	export type TypePropertyOptions = TypePropertyOptions;
	export type TypeEntityInitNewEventArgs = TypeEntityInitNewEventArgs;
	export type TypeEntityInitExistingEventArgs = TypeEntityInitExistingEventArgs;
	export type TypeEntityDestroyEventArgs = TypeEntityDestroyEventArgs;
	import { Property as PropertyInterface } from 'model.js/interfaces';
	export type Property = PropertyInterface;
	import { Property as PropertyClass } from 'model.js/property';
	export const Property: typeof PropertyClass;
	import { PropertyConstructor, PropertyEventArgs, PropertyAccessEventArgs, PropertyAccessEventHandler, PropertyChangeEventArgs, PropertyChangeEventHandler } from 'model.js/interfaces';
	export type PropertyConstructor = PropertyConstructor;
	export type PropertyEventArgs = PropertyEventArgs;
	export type PropertyAccessEventArgs = PropertyAccessEventArgs;
	export type PropertyAccessEventHandler = PropertyAccessEventHandler;
	export type PropertyChangeEventArgs = PropertyChangeEventArgs;
	export type PropertyChangeEventHandler = PropertyChangeEventHandler;
	import { PropertyChain as PropertyChainInterface } from 'model.js/interfaces';
	export type PropertyChain = PropertyChainInterface;
	import { PropertyChain as PropertyChainClass } from 'model.js/property-chain';
	export const PropertyChain: typeof PropertyChainClass;
	import { PropertyChainConstructor, PropertyChainAccessEventArgs, PropertyChainAccessEventHandler, PropertyChainChangeEventArgs, PropertyChainChangeEventHandler } from 'model.js/interfaces';
	export type PropertyChainConstructor = PropertyChainConstructor;
	export type PropertyChainAccessEventArgs = PropertyChainAccessEventArgs;
	export type PropertyChainAccessEventHandler = PropertyChainAccessEventHandler;
	export type PropertyChainChangeEventArgs = PropertyChainChangeEventArgs;
	export type PropertyChainChangeEventHandler = PropertyChainChangeEventHandler;
	import { Entity as EntityInterface } from 'model.js/interfaces';
	export type Entity = EntityInterface;
	import { Entity as EntityClass } from 'model.js/entity';
	export const Entity: typeof EntityClass;
	import { EntityConstructor, EntityConstructorForType } from 'model.js/interfaces';
	export type EntityConstructor = EntityConstructor;
	export type EntityConstructorForType<TEntity extends Entity> = EntityConstructorForType<TEntity>;
	import { ObjectMeta as ObjectMetaInterface } from 'model.js/interfaces';
	export type ObjectMeta = ObjectMetaInterface;
	import { ObjectMeta as ObjectMetaClass } from 'model.js/object-meta';
	export const ObjectMeta: typeof ObjectMetaClass;
	import { ObjectMetaConstructor } from 'model.js/interfaces';
	export type ObjectMetaConstructor = ObjectMetaConstructor;
	import { Format as FormatInterface } from 'model.js/interfaces';
	export type Format = FormatInterface;
	import { Format as FormatClass } from 'model.js/format';
	export const Format: typeof FormatClass;
	import { FormatConstructor, FormatOptions, FormatConvertFunction, FormatConvertBackFunction } from 'model.js/interfaces';
	export type FormatConstructor = FormatConstructor;
	export type FormatOptions = FormatOptions;
	export type FormatConvertFunction = FormatConvertFunction;
	export type FormatConvertBackFunction = FormatConvertBackFunction;
	import { Rule as RuleInterface } from 'model.js/interfaces';
	export type Rule = RuleInterface;
	import { Rule as RuleClass } from 'model.js/rule';
	export const Rule: typeof RuleClass;
	import { RuleConstructor, RuleOptions } from 'model.js/interfaces';
	export type RuleConstructor = RuleConstructor;
	export type RuleOptions = RuleOptions;

}
