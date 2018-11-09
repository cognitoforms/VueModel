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
	new(createOwnProperties?: boolean): Model;
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
	new(model: Model, fullName: string, baseType?: Type, origin?: string): Type;
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
	new(containingType: Type, name: string, jstype: any, label: string, helptext: string, format: Format, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue?: any, origin?: string): Property;
}

export interface PropertyEventDispatchers {
	readonly changedEvent: EventDispatcher<Entity, PropertyChangeEventArgs>;
	readonly accessedEvent: EventDispatcher<Entity, PropertyAccessEventArgs>;
}

export interface PropertyEventArgs {
	property: PropertySpec,
}

export interface PropertyAccessEventHandler {
    (sender: Entity, args: PropertyAccessEventArgs): void;
}

export interface PropertyAccessEventArgs extends PropertyEventArgs {
	value: any,
}

export interface PropertyChangeEventHandler {
    (sender: Entity, args: PropertyChangeEventArgs): void;
}

export interface PropertyChangeEventArgs extends PropertyEventArgs {
	newValue: any,
	oldValue: any,
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
	new(rootType: Type, properties: Property[], filters: ((obj: Entity) => boolean)[]): PropertyChain;
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
	init(properties: { [name: string]: any }): void;
	init(property: string, value: any): void;
	init(property: any, value?: any): void;
	set(properties: { [name: string]: any }): void;
	set(property: string, value: any): void;
	set(property: any, value?: any): void;
	get(property: string): any;
	toString(format: string): string;
}

export interface EntityConstructor {
	new(): Entity;
}

export interface EntityConstructorForType<TEntity extends Entity> extends EntityConstructor {
	new(): TEntity;
	meta: Type;
}

export interface EntityEventDispatchers {
	readonly accessedEvent: EventDispatcher<Property, EntityAccessEventArgs>;
	readonly changedEvent: EventDispatcher<Property, EntityChangeEventArgs>;
}

export interface EntityEventArgs {
	entity: Entity,
}

export interface EntityAccessEventHandler {
    (sender: Property, args: EntityAccessEventArgs): void;
}

export interface EntityAccessEventArgs extends EntityEventArgs {
	property: Property,
}

export interface EntityChangeEventHandler {
    (sender: Property, args: EntityChangeEventArgs): void;
}

export interface EntityChangeEventArgs extends EntityEventArgs {
	property: Property,
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
	new(type: Type, entity: Entity, id: string, isNew: boolean): ObjectMeta;
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
	new(options: FormatOptions): Format;
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
	new(rootType: Type, name: string, options: RuleOptions): Rule;
}

export interface EventRegistration<TSender, THandler> {
	handler: THandler;
	sender?: TSender;
	unsubscribe: () => void;
}

export interface EventSubscription<THandler> {
	handler: THandler,
	isExecuted?: boolean;
	isOnce?: boolean;
}
