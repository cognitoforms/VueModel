import { EventSubscriber } from "../events";

export enum ArrayChangeType {
	add = 1,
	remove = 2,
	replace = 4,
	reorder = 8,
}

export interface ArrayChange<ItemType> {
	type: ArrayChangeType;
	startIndex: number;
	endIndex: number;
	items?: ItemType[];
}

export interface ArrayChangedEventArgs<ItemType> {
	changes: ArrayChange<ItemType>[];
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

export interface ObservableArray<ItemType> extends ObservableArrayMethods<ItemType> {
	readonly changed: EventSubscriber<Array<ItemType>, ArrayChangedEventArgs<ItemType>>;

	/**
	 * Begin queueing changes to the array, make changes in the given callback function, then stop queueing and raise events
	 */
	batchUpdate(fn: (array: ObservableArray<ItemType>) => void): void;
}