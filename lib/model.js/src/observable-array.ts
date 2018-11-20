import { Event, EventSubscriber } from "./events";
import { hasOwnProperty } from "./helpers";

export interface ObservableArray<ItemType> extends Array<ItemType> {

	readonly __ob__: ArrayObserver<ItemType>;

	readonly changed: EventSubscriber<Array<ItemType>, ArrayChangedEventArgs<ItemType>>;

	/**
	 * Begin queueing changes to the array, make changes in the given callback function, then stop queueing and raise events
	 */
	batchUpdate(fn: (array: ObservableArray<ItemType>) => void): void;

}

export interface ObservableArrayMethods<ItemType> extends Array<ItemType> {

	/**
	 * The copyWithin() method shallow copies part of an array to another location in the same array and returns it, without modifying its size.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin
	 * @param target Zero based index at which to copy the sequence to. If negative, target will be counted from the end. If target is at or greater than arr.length, nothing will be copied. If target is positioned after start, the copied sequence will be trimmed to fit arr.length.
	 * @param start Zero based index at which to start copying elements from. If negative, start will be counted from the end. If start is omitted, copyWithin will copy from the start (defaults to 0).
	 * @param end Zero based index at which to end copying elements from. copyWithin copies up to but not including end. If negative, end will be counted from the end. If end is omitted, copyWithin will copy until the end (default to arr.length).
	 * @returns The modified array.
	 */
	copyWithin(target: number, start?: number, end?: number): this;

	/**
	 * The fill() method fills all the elements of an array from a start index to an end index with a static value. The end index is not included.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
	 * @param value Value to fill an array.
	 * @param start Start index, defaults to 0.
	 * @param end End index, defaults to this.length.
	 * @returns The modified array.
	 */
	fill(value: ItemType, start?: number, end?: number): this;

	/**
	 * The pop() method removes the last element from an array and returns that element. This method changes the length of the array.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
	 * @returns The removed element from the array; undefined if the array is empty.
	 */
	pop(): ItemType | undefined;

	/**
	 * The push() method adds one or more elements to the end of an array and returns the new length of the array.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
	 * @param items The elements to add to the end of the array.
	 * @returns The new length property of the object upon which the method was called.
	 */
	push(...items: ItemType[]): number;

	/**
	 * The reverse() method reverses an array in place. The first array element becomes the last, and the last array element becomes the first.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse
	 * @returns The reversed array.
	 */
	reverse(): this;

	/**
	 * The shift() method removes the first element from an array and returns that removed element. This method changes the length of the array.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
	 * @returns The removed element from the array; undefined if the array is empty.
	 */
	shift(): ItemType | undefined;

	/**
	 * The sort() method sorts the elements of an array in place and returns the array. Javascript sort algorithm on V8 is now stable. The default sort order is according to string Unicode code points.
	 * The time and space complexity of the sort cannot be guaranteed as it is implementation dependent.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	 * @param compareFunction Specifies a function that defines the sort order. If omitted, the array is sorted according to each character's Unicode code point value, according to the string conversion of each element.
	 * @returns The sorted array. Note that the array is sorted in place, and no copy is made.
	 */
	sort(compareFunction?: (a: ItemType, b: ItemType) => number): this;

	/**
	 * The splice() method changes the contents of an array by removing existing elements and/or adding new elements.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
	 * @param start  Index at which to start changing the array (with origin 0). If greater than the length of the array, actual starting index will be set to the length of the array. If negative, will begin that many elements from the end of the array (with origin -1) and will be set to 0 if absolute value is greater than the length of the array.
	 * @param deleteCount An integer indicating the number of old array elements to remove. If deleteCount is omitted, or if its value is larger than array.length - start (that is, if it is greater than the number of elements left in the array, starting at start), then all of the elements from start through the end of the array will be deleted. If deleteCount is 0 or negative, no elements are removed. In this case, you should specify at least one new element (see below).
	 * @param items The elements to add to the array, beginning at the start index. If you don't specify any elements, splice() will only remove elements from the array.
	 * @returns An array containing the deleted elements. If only one element is removed, an array of one element is returned. If no elements are removed, an empty array is returned.
	 */
	splice(start: number, deleteCount?: number, ...items: ItemType[]): ItemType[];

	/**
	 * The unshift() method adds one or more elements to the beginning of an array and returns the new length of the array.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
	 * @param items The elements to add to the front of the array.
	 * @returns The new length property of the object upon which the method was called.
	 */
	unshift(...items: ItemType[]): number;

}

export class ObservableArray<ItemType> {

	/**
	 * Returns a value indicating whether the given array is observable
	 * @param array The array to check for observability
	 */
	public static isObservableArray<ItemType>(array: Array<ItemType> | ObservableArray<ItemType>): boolean {
		return hasOwnProperty(array, "__ob__") && (array as any).__ob__.constructor === ArrayObserver;
	}

	/**
	 * Makes the given array observable, if not already
	 * @param array The array to make observable
	 */
	public static ensureObservable<ItemType>(array: Array<ItemType> | ObservableArray<ItemType>): ObservableArray<ItemType> {
		if (this.isObservableArray)
		
		// Check to see if the array is already an observable list
		if (ObservableArray.isObservableArray(array)) {
			return array as ObservableArray<ItemType>;
		}

		if (hasOwnProperty(array, '__ob__')) {
			// TODO: Warn about invalid '__ob__' property?
			return;
		}

		Object.defineProperty(array, "__ob__", {
			configurable: false,
			enumerable: false,
			value: new ArrayObserver(array),
			writable: false
		});

		Object.defineProperty(array, 'changed', {
			configurable: false,
			enumerable: true,
			get: function() {
				return this.__ob__.changedEvent.asEventSubscriber();
			}
		});

		(array as any)["batchUpdate"] = ObservableArray$batchUpdate;

		ObservableArray$_overrideNativeMethods.call(array);

		return array as ObservableArray<ItemType>;

	}

	/**
	 * Creates a new observable array
	 * @param items The initial array items
	 */
	public static create<ItemType>(items: ItemType[] = null): ObservableArray<ItemType> & Array<ItemType> {
		var array = new ObservableArrayImplementation(...items);
		ObservableArray.ensureObservable<ItemType>(array);
		return array;
	}

}

export interface ArrayChangedEventArgs<ItemType> {
	changes: ArrayChange<ItemType>[];
}

export enum ArrayChangeType {
	remove = 0,
	add = 1,
	replace = 2,
	reorder = 4,
}

export interface ArrayChange<ItemType> {
	type: ArrayChangeType;
	startIndex: number;
	endIndex: number;
	items?: ItemType[];
}

export class ObservableArrayImplementation<ItemType> extends Array<ItemType> implements ObservableArray<ItemType>, ObservableArrayMethods<ItemType> {

	readonly __ob__: ArrayObserver<ItemType>;

	/**
	 * Creates a new observable array
	 * @param items The array of initial items
	 */
	public constructor(...items: ItemType[]) {
		super(...items);

		Object.defineProperty(this, "__ob__", {
			configurable: false,
			enumerable: false,
			value: new ArrayObserver(this),
			writable: false
		});

		Object.defineProperty(this, 'changed', {
			get: function() {
				return this.__ob__.changedEvent.asEventSubscriber();
			}
		});

		if (this.constructor !== ObservableArrayImplementation) {
			this["batchUpdate"] = (function (fn: (array: ObservableArray<ItemType>) => void) { ObservableArray$batchUpdate.call(this, fn); });
			ObservableArray$_overrideNativeMethods.call(this);
		}
	}

	/** Expose the changed event */
	get changed(): EventSubscriber<Array<ItemType>, ArrayChangedEventArgs<ItemType>> {
		return this.__ob__.changedEvent.asEventSubscriber();
	}

	/**
	 * Begin queueing changes to the array, make changes in the given callback function, then stop queueing and raise events
	 */
	batchUpdate(fn: (array: ObservableArray<ItemType>) => void): void {
		ObservableArray$batchUpdate.call(this, fn);
	}

	/**
	 * The copyWithin() method shallow copies part of an array to another location in the same array and returns it, without modifying its size.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin
	 * @param target Zero based index at which to copy the sequence to. If negative, target will be counted from the end. If target is at or greater than arr.length, nothing will be copied. If target is positioned after start, the copied sequence will be trimmed to fit arr.length.
	 * @param start Zero based index at which to start copying elements from. If negative, start will be counted from the end. If start is omitted, copyWithin will copy from the start (defaults to 0).
	 * @param end Zero based index at which to end copying elements from. copyWithin copies up to but not including end. If negative, end will be counted from the end. If end is omitted, copyWithin will copy until the end (default to arr.length).
	 * @returns The modified array.
	 */
	copyWithin(target: number, start?: number, end?: number): this {
		return ObservableArray$copyWithin.apply(this, arguments);
	}

	/**
	 * The fill() method fills all the elements of an array from a start index to an end index with a static value. The end index is not included.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
	 * @param value Value to fill an array.
	 * @param start Start index, defaults to 0.
	 * @param end End index, defaults to this.length.
	 * @returns The modified array.
	 */
	fill(value: ItemType, start?: number, end?: number): this {
		return ObservableArray$fill.apply(this, arguments);
	}

	/**
	 * The pop() method removes the last element from an array and returns that element. This method changes the length of the array.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
	 * @returns The removed element from the array; undefined if the array is empty.
	 */
	pop(): ItemType | undefined {
		return ObservableArray$pop.apply(this, arguments);
	}

	/**
	 * The push() method adds one or more elements to the end of an array and returns the new length of the array.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
	 * @param items The elements to add to the end of the array.
	 * @returns The new length property of the object upon which the method was called.
	 */
	push(...elements: ItemType[]): number {
		return ObservableArray$push.apply(this, arguments);
	}

	/**
	 * The reverse() method reverses an array in place. The first array element becomes the last, and the last array element becomes the first.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse
	 * @returns The reversed array.
	 */
	reverse(): this {
		return ObservableArray$reverse.apply(this, arguments);
	}

	/**
	 * The shift() method removes the first element from an array and returns that removed element. This method changes the length of the array.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
	 * @returns The removed element from the array; undefined if the array is empty.
	 */
	shift(): ItemType | undefined {
		return ObservableArray$shift.apply(this, arguments);
	}

	/**
	 * The sort() method sorts the elements of an array in place and returns the array. Javascript sort algorithm on V8 is now stable. The default sort order is according to string Unicode code points.
	 * The time and space complexity of the sort cannot be guaranteed as it is implementation dependent.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	 * @param compareFunction Specifies a function that defines the sort order. If omitted, the array is sorted according to each character's Unicode code point value, according to the string conversion of each element.
	 * @returns The sorted array. Note that the array is sorted in place, and no copy is made.
	 */
	sort(compareFunction?: (a: ItemType, b: ItemType) => number): this {
		return ObservableArray$sort.apply(this, arguments);
	}

	/**
	 * The splice() method changes the contents of an array by removing existing elements and/or adding new elements.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
	 * @param start  Index at which to start changing the array (with origin 0). If greater than the length of the array, actual starting index will be set to the length of the array. If negative, will begin that many elements from the end of the array (with origin -1) and will be set to 0 if absolute value is greater than the length of the array.
	 * @param deleteCount An integer indicating the number of old array elements to remove. If deleteCount is omitted, or if its value is larger than array.length - start (that is, if it is greater than the number of elements left in the array, starting at start), then all of the elements from start through the end of the array will be deleted. If deleteCount is 0 or negative, no elements are removed. In this case, you should specify at least one new element (see below).
	 * @param items The elements to add to the array, beginning at the start index. If you don't specify any elements, splice() will only remove elements from the array.
	 * @returns An array containing the deleted elements. If only one element is removed, an array of one element is returned. If no elements are removed, an empty array is returned.
	 */
	splice(start: number, deleteCount?: number, ...items: ItemType[]): ItemType[] {
		return ObservableArray$splice.apply(this, arguments);
	}

	/**
	 * The unshift() method adds one or more elements to the beginning of an array and returns the new length of the array.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
	 * @param items The elements to add to the front of the array.
	 * @returns The new length property of the object upon which the method was called.
	 */
	unshift(...items: ItemType[]): number {
		return ObservableArray$unshift.apply(this, arguments);
	}

}

/**
 * Override's native Array methods that manipulate the array 
 * @param array The array to extend
 */
export function ObservableArray$_overrideNativeMethods<ItemType>(this: Array<ItemType> | ObservableArrayImplementation<ItemType>): void {
	(this as any)["copyWithin"] = ObservableArray$copyWithin;
	(this as any)["fill"] = ObservableArray$fill;
	(this as any)["pop"] = ObservableArray$pop;
	(this as any)["push"] = ObservableArray$push;
	(this as any)["reverse"] = ObservableArray$reverse;
	(this as any)["shift"] = ObservableArray$shift;
	(this as any)["sort"] = ObservableArray$sort;
	(this as any)["splice"] = ObservableArray$splice;
	(this as any)["unshift"] = ObservableArray$unshift;
}

/**
 * Begin queueing changes to the array, make changes in the given callback function, then stop queueing and raise events
 */
export function ObservableArray$batchUpdate<ItemType>(this: ObservableArray<ItemType>, fn: (array: ObservableArray<ItemType>) => void): void {
	this.__ob__.startQueueingChanges();
	try {
		fn(this);
		this.__ob__.stopQueueingChanges(true);
	} finally {
		if (this.__ob__._isQueuingChanges) {
			this.__ob__.stopQueueingChanges(false);
		}
	}
}

/**
 * The copyWithin() method shallow copies part of an array to another location in the same array and returns it, without modifying its size.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin
 * @param array The observable array
 * @param target Zero based index at which to copy the sequence to. If negative, target will be counted from the end. If target is at or greater than arr.length, nothing will be copied. If target is positioned after start, the copied sequence will be trimmed to fit arr.length.
 * @param start Zero based index at which to start copying elements from. If negative, start will be counted from the end. If start is omitted, copyWithin will copy from the start (defaults to 0).
 * @param end Zero based index at which to end copying elements from. copyWithin copies up to but not including end. If negative, end will be counted from the end. If end is omitted, copyWithin will copy until the end (default to arr.length).
 */
export function ObservableArray$copyWithin<ItemType>(this: ObservableArrayImplementation<ItemType>, target: number, start?: number, end?: number): ItemType[] {
	(Array.prototype as any).copyWithin.apply(this, arguments);
	// TODO: Warn about non-observable manipulation of observable array?
	this.__ob__.raiseEvents({ type: ArrayChangeType.replace, startIndex: start, endIndex: end });
	return this;
}

/**
 * The fill() method fills all the elements of an array from a start index to an end index with a static value. The end index is not included.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
 * @param array The observable array
 * @param value Value to fill an array.
 * @param start Start index, defaults to 0.
 * @param end End index, defaults to this.length.
 */
export function ObservableArray$fill<ItemType>(this: ObservableArrayImplementation<ItemType>, value: ItemType, start?: number, end?: number): ItemType[] {
	(Array.prototype as any).fill.apply(this, arguments);
	// TODO: Warn about non-observable manipulation of observable array?
	this.__ob__.raiseEvents({ type: ArrayChangeType.replace, startIndex: start, endIndex: end });
	return this;
}

/**
 * The pop() method removes the last element from an array and returns that element. This method changes the length of the array.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
 * @param array The observable array
 * @returns The removed element from the array; undefined if the array is empty.
 */
export function ObservableArray$pop<ItemType>(this: ObservableArrayImplementation<ItemType>): ItemType | undefined {
	let originalLength = this.length;
	let removed: ItemType = Array.prototype.pop.apply(this, arguments);
	if (this.length !== originalLength) {
		let removedIndex = originalLength - 1;
		this.__ob__.raiseEvents({ type: ArrayChangeType.remove, startIndex: removedIndex, endIndex: removedIndex, items: [removed] });
	}
	return removed;
}

/**
 * The push() method adds one or more elements to the end of an array and returns the new length of the array.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
 * @param array The observable array
 * @param items The elements to add to the end of the array.
 * @returns The new length property of the object upon which the method was called.
 */
export function ObservableArray$push<ItemType>(this: ObservableArrayImplementation<ItemType>, ...items: ItemType[]): number {
	let addedIndex = this.length;
	let addedCount: number = Array.prototype.push.apply(this, arguments);
	if (addedCount > 0) {
		this.__ob__.raiseEvents({ type: ArrayChangeType.add, startIndex: addedIndex, endIndex: addedIndex + addedCount, items });
	}
	return addedCount;
}

/**
 * The reverse() method reverses an array in place. The first array element becomes the last, and the last array element becomes the first.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse
 * @param array The observable array
 * @returns The reversed array.
 */
export function ObservableArray$reverse<ItemType>(this: ObservableArrayImplementation<ItemType>): ItemType[] {
	Array.prototype.reverse.apply(this, arguments);
	// TODO: Warn about non-observable manipulation of observable array?
	this.__ob__.raiseEvents({ type: ArrayChangeType.reorder, startIndex: 0, endIndex: this.length - 1 });
	return this;
}

/**
 * The shift() method removes the first element from an array and returns that removed element. This method changes the length of the array.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
 * @param array The observable array
 * @returns The removed element from the array; undefined if the array is empty.
 */
export function ObservableArray$shift<ItemType>(this: ObservableArrayImplementation<ItemType>): ItemType | undefined {
	let originalLength = this.length;
	let removed: ItemType = Array.prototype.shift.apply(this, arguments);
	if (this.length !== originalLength) {
		this.__ob__.raiseEvents({ type: ArrayChangeType.remove, startIndex: 0, endIndex: 0, items: [removed] });
	}
	return removed;
}

/**
 * The sort() method sorts the elements of an array in place and returns the array. Javascript sort algorithm on V8 is now stable. The default sort order is according to string Unicode code points.
 * The time and space complexity of the sort cannot be guaranteed as it is implementation dependent.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
 * @param array The observable array
 * @param compareFunction Specifies a function that defines the sort order. If omitted, the array is sorted according to each character's Unicode code point value, according to the string conversion of each element.
 * @returns The sorted array. Note that the array is sorted in place, and no copy is made.
 */
export function ObservableArray$sort<ItemType>(this: ObservableArrayImplementation<ItemType>, compareFunction?: (a: ItemType, b: ItemType) => number): ItemType[] {
	let result: ItemType = Array.prototype.sort.apply(this, arguments);
	// TODO: Warn about non-observable manipulation of observable array?
	this.__ob__.raiseEvents({ type: ArrayChangeType.reorder, startIndex: 0, endIndex: this.length - 1 });
	return this;
}

/**
 * The splice() method changes the contents of an array by removing existing elements and/or adding new elements.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
 * @param array The observable array
 * @param start  Index at which to start changing the array (with origin 0). If greater than the length of the array, actual starting index will be set to the length of the array. If negative, will begin that many elements from the end of the array (with origin -1) and will be set to 0 if absolute value is greater than the length of the array.
 * @param deleteCount An integer indicating the number of old array elements to remove. If deleteCount is omitted, or if its value is larger than array.length - start (that is, if it is greater than the number of elements left in the array, starting at start), then all of the elements from start through the end of the array will be deleted. If deleteCount is 0 or negative, no elements are removed. In this case, you should specify at least one new element (see below).
 * @param items The elements to add to the array, beginning at the start index. If you don't specify any elements, splice() will only remove elements from the array.
 * @returns An array containing the deleted elements. If only one element is removed, an array of one element is returned. If no elements are removed, an empty array is returned.
 */
export function ObservableArray$splice<ItemType>(this: ObservableArrayImplementation<ItemType>, start: number, deleteCount?: number, ...items: ItemType[]): ItemType[] {
	let removed: ItemType[] = Array.prototype.splice.apply(this, arguments);
	if (removed.length > 0 || items.length > 0) {
		let changeEvents: ArrayChange<ItemType>[] = [];
		if (removed.length > 0) {
			changeEvents.push({ type: ArrayChangeType.remove, startIndex: start, endIndex: start + removed.length - 1, items: removed });
		}
		if (items.length > 0) {
			changeEvents.push({ type: ArrayChangeType.add, startIndex: start, endIndex: start + items.length - 1, items });
		}
		this.__ob__.raiseEvents(changeEvents);
	}
	return removed;
}

/**
 * The unshift() method adds one or more elements to the beginning of an array and returns the new length of the array.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
 * @param array The observable array
 * @param items The elements to add to the front of the array.
 * @returns The new length property of the object upon which the method was called.
 */
export function ObservableArray$unshift<ItemType>(this: ObservableArrayImplementation<ItemType>, ...items: ItemType[]): number {
	let originalLength = this.length;
	let newLength: number = Array.prototype.unshift.apply(this, arguments);
	if (newLength !== originalLength) {
		this.__ob__.raiseEvents({ type: ArrayChangeType.add, startIndex: 0, endIndex: items.length - 1, items });
	}
	return newLength;
}

export interface ObservableArrayConstructor<ItemType> {
	new(items?: ItemType[]): ObservableArray<ItemType>;
	isObservableArray(array: Array<ItemType>): boolean;
	ensureObservable(array: Array<ItemType>): ObservableArray<ItemType>;
	create(items?: ItemType[]): ObservableArray<ItemType>;
}

export class ArrayObserver<ItemType> {

	readonly array: Array<ItemType>;

	readonly changedEvent: Event<Array<ItemType>, ArrayChangedEventArgs<ItemType>>;

	_queuedChanges: ArrayChange<ItemType>[];

	_isQueuingChanges: boolean;

	public constructor(array: Array<ItemType>) {
		this.array = array;
		this.changedEvent = new Event<Array<ItemType>, ArrayChangedEventArgs<ItemType>>();
		this._isQueuingChanges = false;
	}

	raiseEvents(changes: ArrayChange<ItemType>[] | ArrayChange<ItemType>): void {
		if (this._isQueuingChanges) {
			if (!this._queuedChanges) {
				this._queuedChanges = [];
			}
			if (Array.isArray(changes)) {
				Array.prototype.push.apply(this._queuedChanges, changes);
			} else {
				this._queuedChanges.push(changes);
			}
		} else if (Array.isArray(changes)) {
			this.changedEvent.publish(this.array, { changes: changes });
		} else {
			this.changedEvent.publish(this.array, { changes: [changes] });
		}
	}

	startQueueingChanges(): void {
		this._isQueuingChanges = true;
		if (!this._queuedChanges) {
			this._queuedChanges = [];
		}
	}

	stopQueueingChanges(raiseEvents: boolean): void {
		this._isQueuingChanges = false;
		if (raiseEvents) {
			this.raiseEvents(this._queuedChanges);
			delete this._queuedChanges;
		}
	}

}

function observableSplice(arr: any[], events: any[], index: number, removeCount: number, addItems: any[]) {
	var removedItems;

	let arr2 = arr as any;

	if (removeCount) {
		if (removeCount > 1 && arr2.removeRange) {
			removedItems = arr2.removeRange(index, removeCount);
		} else if (removeCount === 1 && arr2.remove) {
			removedItems = [arr2.removeAt(index)];
		} else {
			removedItems = arr.splice(index, removeCount);
		}
	
		if (events) {
			events.push({
				action: 'remove',
				oldStartingIndex: index,
				oldItems: removedItems,
				newStartingIndex: null,
				newItems: null
			});
		}
	}

	if (addItems.length > 0) {
		if (addItems.length > 1 && arr2.insertRange) {
			arr2.insertRange(index, addItems);
		} else if (addItems.length === 1 && arr2.insert) {
			arr2.insert(index, addItems[0]);
		} else {
			var addItemsArgs = addItems.slice();
			addItemsArgs.splice(0, 0, index, 0);
			arr.splice.apply(arr, addItemsArgs);
		}

		if (events) {
			events.push({
				action: 'add',
				oldStartingIndex: null,
				oldItems: null,
				newStartingIndex: index,
				newItems: addItems
			});
		}
	}
}

export function updateArray(array: any[], values: any[] /*, trackEvents */) {
	var trackEvents: boolean = arguments[2],
		events: any[] = trackEvents ? [] : null,
		pointer = 0,
		srcSeek = 0,
		tgtSeek = 0;

	while (srcSeek < array.length) {
		if (array[srcSeek] === values[tgtSeek]) {
			if (pointer === srcSeek && pointer === tgtSeek) {
				// items match, so advance
				pointer = srcSeek = tgtSeek = pointer + 1;
			} else {
				// remove range from source and add range from target
				observableSplice(array, events, pointer, srcSeek - pointer, values.slice(pointer, tgtSeek));

				// reset to index follow target seek location since arrays match up to that point
				pointer = srcSeek = tgtSeek = tgtSeek + 1;
			}
		} else if (tgtSeek >= values.length) {
			// reached the end of the target array, so advance the src pointer and test again
			tgtSeek = pointer;
			srcSeek += 1;
		} else {
			// advance to the next target item to test
			tgtSeek += 1;
		}
	}

	observableSplice(array, events, pointer, srcSeek - pointer, values.slice(pointer, Math.max(tgtSeek, values.length)));

	return events;
}
