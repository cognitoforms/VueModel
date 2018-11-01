declare module 'Model' {
	import { EventDispatcher, IEvent } from "ste-events";
	export class ObjectMeta {
	    readonly type: Type;
	    readonly entity: Entity;
	    constructor(type: Type, entity: Entity, id: string, isNew: boolean);
	    id: string;
	    readonly isNew: boolean;
	    legacyId: string;
	    destroy(): void;
	}
	export interface ObjectMetaConstructor {
	    new(type: Type, entity: Entity, id: string, isNew: boolean): ObjectMeta;
	}
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
	    new(options: FormatOptions): Format;
	}
	export class Entity {
	    readonly meta: ObjectMeta;
	    init(properties: { [name: string]: any; }): void;
	    init(property: string, value: any): void;
	    set(properties: { [name: string]: any; }): void;
	    set(property: string, value: any): void;
	    get(property: string): any;
	    toString(format: string): string;
	    static toIdString(obj: Entity): string;
	    static fromIdString(idString: string): any;
	}
	export interface EntityConstructor {
		new(): Entity;
	    toIdString(obj: Entity): string;
	    fromIdString(idString: string): any;
	}
	export interface ObservableListChangedArgs<ItemType> {
	    added: ItemType[];
	    addedIndex: number;
	    removed: ItemType[];
	    removedIndex: number;
	}
	export interface ObservableList<ItemType> extends Array<ItemType> {
	    changed: IEvent<Array<ItemType>, ObservableListChangedArgs<ItemType>>;
	    add(item: ItemType): void;
	    remove(item: ItemType): boolean;
	}
	export interface ObservableListConstructor {
	    isObservableList<ItemType>(array: Array<ItemType>): boolean;
	    ensureObservable<ItemType>(array: Array<ItemType>): ObservableList<ItemType>;
	    create<ItemType>(items?: ItemType[]): ObservableList<ItemType>;
	}
	export interface PropertyEventArgs {
	    property: Property;
	}
	export interface PropertyAccessEventArgs extends PropertyEventArgs {
	    value: any;
	}
	export interface PropertyChangeEventArgs extends PropertyEventArgs {
	    newValue: any;
	    oldValue: any;
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
	    new(containingType: Type, name: string, jstype: any, label: string, helptext: string, format: Format, isList: boolean, isStatic: boolean, isPersisted: boolean, isCalculated: boolean, defaultValue?: any, origin?: string): Property;
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
	export class Type {
	    readonly model: Model;
	    readonly fullName: string;
	    readonly jstype: any;
	    readonly baseType: Type;
	    origin: string;
	    originForNewProperties: string;
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
	    new(model: Model, fullName: string, baseType?: Type, origin?: string): Type;
	    newIdPrefix: string;
	}
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
	}
	export class Model {
	    constructor(createOwnProperties?: boolean);
	    readonly typeAddedEvent: IEvent<Model, ModelTypeAddedEventArgs>;
	    readonly entityRegisteredEvent: IEvent<Model, ModelEntityRegisteredEventArgs>;
	    readonly entityUnregisteredEvent: IEvent<Model, ModelEntityUnregisteredEventArgs>;
	    readonly propertyAddedEvent: IEvent<Model, ModelPropertyAddedEventArgs>;
	    dispose(): void;
	    readonly types: Array<Type>;
	    addType(name: string, baseType?: Type, origin?: string): Type;
		static getJsType(name: string, allowUndefined?: boolean): any;
	}
	export interface ModelConstructor {
	    new(createOwnProperties?: boolean): Model;
		getJsType(name: string, allowUndefined?: boolean): any;
		Model: ModelConstructor;
		Type: TypeConstructor;
		Property: PropertyConstructor;
		Entity: EntityConstructor;
		Format: FormatConstructor;
	}
}
