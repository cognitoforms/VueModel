// import { EventDispatcherIEvent, IEventHandler } from "ste-events";

// export * from "./event-scope";
// export * from "./functor";
// export * from "./observable-list";
// export * from "./rule-invocation-type";
// export * from "./signal";

// Export for type `Model`:
import { Model as ModelInterface } from "./interfaces";
export type Model = ModelInterface;
import { Model as ModelClass } from "./model";
export const Model: ModelConstructor = ModelClass;
import { ModelConstructor, ModelSettings, ModelEntityRegisteredEventArgs, ModelEntityUnregisteredEventArgs, ModelTypeAddedEventArgs, ModelPropertyAddedEventArgs } from "./interfaces";
export type ModelConstructor = ModelConstructor;
export type ModelSettings = ModelSettings;
export type ModelEntityRegisteredEventArgs = ModelEntityRegisteredEventArgs;
export type ModelEntityUnregisteredEventArgs = ModelEntityUnregisteredEventArgs;
export type ModelTypeAddedEventArgs = ModelTypeAddedEventArgs;
export type ModelPropertyAddedEventArgs = ModelPropertyAddedEventArgs;

// Export for type `Type`:
import { Type as TypeInterface } from "./interfaces";
export type Type = TypeInterface;
import { Type as TypeClass } from "./type";
export const Type = TypeClass;
import { TypeConstructor, TypePropertyOptions, TypeEntityInitNewEventArgs, TypeEntityInitExistingEventArgs, TypeEntityDestroyEventArgs } from "./interfaces";
export type TypeConstructor = TypeConstructor;
export type TypePropertyOptions = TypePropertyOptions;
export type TypeEntityInitNewEventArgs = TypeEntityInitNewEventArgs;
export type TypeEntityInitExistingEventArgs = TypeEntityInitExistingEventArgs;
export type TypeEntityDestroyEventArgs = TypeEntityDestroyEventArgs;

// Export for type `Property`:
import { Property as PropertyInterface } from "./interfaces";
export type Property = PropertyInterface;
import { Property as PropertyClass } from "./property";
export const Property = PropertyClass;
import { PropertyConstructor, PropertyEventArgs, PropertyAccessEventArgs, PropertyAccessEventHandler, PropertyChangeEventArgs, PropertyChangeEventHandler } from "./interfaces";
export type PropertyConstructor = PropertyConstructor;
export type PropertyEventArgs = PropertyEventArgs;
export type PropertyAccessEventArgs = PropertyAccessEventArgs;
export type PropertyAccessEventHandler = PropertyAccessEventHandler;
export type PropertyChangeEventArgs = PropertyChangeEventArgs;
export type PropertyChangeEventHandler = PropertyChangeEventHandler;

// Export for type `PropertyChain`:
import { PropertyChain as PropertyChainInterface } from "./interfaces";
export type PropertyChain = PropertyChainInterface;
import { PropertyChain as PropertyChainClass } from "./property-chain";
export const PropertyChain = PropertyChainClass;
import { PropertyChainConstructor, PropertyChainAccessEventArgs, PropertyChainAccessEventHandler, PropertyChainChangeEventArgs, PropertyChainChangeEventHandler } from "./interfaces";
export type PropertyChainConstructor = PropertyChainConstructor;
export type PropertyChainAccessEventArgs = PropertyChainAccessEventArgs;
export type PropertyChainAccessEventHandler = PropertyChainAccessEventHandler;
export type PropertyChainChangeEventArgs = PropertyChainChangeEventArgs;
export type PropertyChainChangeEventHandler = PropertyChainChangeEventHandler;

// Export for type `Entity`:
import { Entity as EntityInterface } from "./interfaces";
export type Entity = EntityInterface;
import { Entity as EntityClass } from "./entity";
export const Entity = EntityClass;
import { EntityConstructor, EntityConstructorForType } from "./interfaces";
export type EntityConstructor = EntityConstructor;
export type EntityConstructorForType<TEntity extends Entity> = EntityConstructorForType<TEntity>;

// Export for type `ObjectMeta`:
import { ObjectMeta as ObjectMetaInterface } from "./interfaces";
export type ObjectMeta = ObjectMetaInterface;
import { ObjectMeta as ObjectMetaClass } from "./object-meta";
export const ObjectMeta = ObjectMetaClass;
import { ObjectMetaConstructor } from "./interfaces";
export type ObjectMetaConstructor = ObjectMetaConstructor;

// Export for type `Format`:
import { Format as FormatInterface } from "./interfaces";
export type Format = FormatInterface;
import { Format as FormatClass } from "./format";
export const Format = FormatClass;
import { FormatConstructor, FormatOptions, FormatConvertFunction, FormatConvertBackFunction } from "./interfaces";
export type FormatConstructor = FormatConstructor;
export type FormatOptions = FormatOptions;
export type FormatConvertFunction = FormatConvertFunction;
export type FormatConvertBackFunction = FormatConvertBackFunction;

// Export for type `Rule`:
import { Rule as RuleInterface } from "./interfaces";
export type Rule = RuleInterface;
import { Rule as RuleClass } from "./rule";
export const Rule = RuleClass;
import { RuleConstructor, RuleOptions } from "./interfaces";
export type RuleConstructor = RuleConstructor;
export type RuleOptions = RuleOptions;
