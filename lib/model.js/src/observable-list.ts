import { Event, EventSubscriber } from "./events";
import { randomText } from "./helpers";

let observableListMarkerField = "_oL" + randomText(3, false, true);

export interface ObservableList<ItemType> extends Array<ItemType> {
	add(item: ItemType): void;
	remove(item: ItemType): boolean;
	changed: EventSubscriber<Array<ItemType>, ObservableListChangedArgs<ItemType>>;
}

export interface ObservableListChangedArgs<ItemType> {
	added: ItemType[];
	addedIndex: number;
	removed: ItemType[];
	removedIndex: number;
}

export abstract class ObservableList<ItemType> extends Array<ItemType> implements ObservableList<ItemType> {

	/**
	 * Creates a new observable list
	 * @param items The array of initial items
	 */
	protected constructor(items: ItemType[] = null) {
		super(...items);
	}

	// ObservableList members:
	// abstract changed: EventSubscriber<Array<ItemType>, ObservableListChangedArgs<ItemType>>;
	// abstract add(item: ItemType): void;
	// // abstract addRange(items: ItemType[]): void;
	// // abstract clear(): void;
	// // abstract insert(index: number, item: ItemType): void;
	// abstract remove(item: ItemType): boolean;

	public static isObservableList<ItemType>(array: Array<ItemType>): boolean {
		return Object.prototype.hasOwnProperty.call(array, observableListMarkerField) && (array as any)[observableListMarkerField] === true;
	}

	protected static _markObservable(target: any) {
		Object.defineProperty(target, observableListMarkerField, {
			configurable: false,
			enumerable: false,
			value: true,
			writable: false
		});
	}

	public static ensureObservable<ItemType>(array: Array<ItemType> | ObservableListImplementation<ItemType>): ObservableList<ItemType> {

		// Check to see if the array is already an observable list
		if (this.isObservableList(array)) {
			var implementation = array as ObservableListImplementation<ItemType>;
			return (implementation as unknown) as ObservableList<ItemType>;
		}

		return ObservableListImplementation.implementObservableList(array);
	}

	public static create<ItemType>(items: ItemType[] = null): ObservableList<ItemType> {
		var implementation = new ObservableListImplementation(items);
		var list = ObservableListImplementation.ensureObservable<ItemType>(implementation);
		return list;
	}

}

export class ObservableListMethods {

	/**
	 * Add an item and raise the list changed event.
	 * @param item The item to add
	 */
	static add<ItemType>(list: ObservableListImplementation<ItemType>, item: ItemType): void {
		let added = [item];
		let newLength = Array.prototype.push.apply(list, added);
		let addedIndex = newLength - 1;
		list._changedEvent.publish(list, { added, addedIndex, removed: [], removedIndex: -1 });
	}

	/**
	 * Remove an item and raise the list changed event.
	 * @param item The item to remove
	 * @returns True if removed, otherwise false.
	 */
	static remove<ItemType>(list: ObservableListImplementation<ItemType>, item: ItemType): boolean {
		let removedIndex = Array.prototype.indexOf.call(list, item);
		if (removedIndex !== -1) {
			let removed = Array.prototype.splice.call(list, removedIndex, 1);
			list._changedEvent.publish(list, { added: [], addedIndex: -1, removed, removedIndex });
			return true;
		}
	}

}

export class ObservableListImplementation<ItemType> extends ObservableList<ItemType> {

	readonly _changedEvent: Event<Array<ItemType>, ObservableListChangedArgs<ItemType>>;

	/**
	 * Creates a new observable list
	 * @param items The array of initial items
	 */
	public constructor(items: ItemType[] = null) {
		super(items);
		if (this.constructor === ObservableListImplementation) {
			ObservableListImplementation._initFields<ItemType>(this);
			ObservableList._markObservable(this);
		} else {
			ObservableListImplementation.implementObservableList(this);
		}
	}

	private static _initFields<ItemType>(target: any, changedEvent: Event<Array<ItemType>, ObservableListChangedArgs<ItemType>> = null) {

		if (changedEvent == null) {
			changedEvent = new Event<Array<ItemType>, ObservableListChangedArgs<ItemType>>();
		}

		// Define the `_changedEvent` readonly property
		Object.defineProperty(target, "_changedEvent", {
			configurable: false,
			enumerable: false,
			value: changedEvent,
			writable: false
		});

	}

	public static implementObservableList<ItemType>(array: Array<ItemType> | ObservableListImplementation<ItemType>): ObservableList<ItemType> {

		ObservableListImplementation._initFields(array);

		(array as any)["add"] = (function (item: ItemType) { ObservableListMethods.add(this, item); });
		(array as any)["remove"] = (function (item: ItemType) { return ObservableListMethods.remove(this, item); });

		Object.defineProperty(array, 'changed', {
			get: function() {
				return this._changedEvent.asEventSubscriber();
			}
		});

		ObservableListImplementation._markObservable(array);
	
		return (array as unknown) as ObservableList<ItemType>;

	}

	/**
	 * Add an item and raise the list changed event.
	 * @param item The item to add
	 */
	add(item: ItemType): void {
		ObservableListMethods.add(this, item);
	}

	/**
	 * Removes the specified item from the list.
	 * @param item The item to remove.
	 * @returns True if removed, otherwise false.
	 */
	remove(item: ItemType): boolean {
		return ObservableListMethods.remove(this, item);
	}

	/** Expose the changed event */
	get changed(): EventSubscriber<Array<ItemType>, ObservableListChangedArgs<ItemType>> {
		return this._changedEvent.asEventSubscriber();
	}

}

export interface ObservableListConstructor<ItemType> {
	new(items?: ItemType[]): ObservableList<ItemType>;
	isObservableList(array: Array<ItemType>): boolean;
	ensureObservable(array: Array<ItemType>): ObservableList<ItemType>;
	create(items?: ItemType[]): ObservableList<ItemType>;
}
