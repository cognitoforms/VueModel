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

export function Functor$create(returns: boolean = false): Functor & Function {

	var funcs: FunctorItem[] = [];

	// TODO: Detect functor invocation resulting in continually adding subscribers

	function Functor$fn() {
		let returnsArray: Array<any>;

		if (returns) {
			returnsArray = []
		}

		for (var i = 0; i < funcs.length; ++i) {
			var item = funcs[i];

			// Don't re-run one-time subscriptions that have already been applied.
			if (item.applied === true) {
				continue;
			}

			// Ensure that there is either no filter or the filter passes.
			if (!item.filter || item.filter.apply(this, arguments) === true) {
				// If handler is set to execute once,
				// remove the handler before calling.
				if (item.once === true) {
					// Mark as applied but leave item in array to avoid potential
					// problems due to re-entry into event invalidating iteration
					// index. In some cases re-entry would be a red-flag, but for
					// "global" events, where the context of the event is derived
					// from the arguments, the event could easily be re-entered
					// in a different context with different arguments.
					item.applied = true;
				}

				// Call the handler function.
				let returnValue = item.fn.apply(this, arguments);
				if (returns) {
					returnsArray.push(returnValue);
				}
			}
		}

		if (returns) {
			return returnsArray;
		}
	};

	let f = Functor$fn as any;

	f._funcs = funcs;
	f.add = Functor$add;
	f.remove = Functor$remove;
	f.isEmpty = Functor$isEmpty;
	f.clear = Functor$clear;

	return f as (Functor & Function);

}

export function FunctorItem$new(fn: Function, filter: () => boolean = null, once: boolean = false): FunctorItem {
	var item: any = { fn: fn };

	if (filter != null) {
		item.filter = filter;
	}

	if (once != null) {
		item.once = once;
	}

	return item;
}

export function Functor$add(fn: Function, filter: () => boolean = null, once: boolean = false): void {
	let item = FunctorItem$new(fn, filter, once);
	this._funcs.push(item);
}

export function Functor$remove(fn: Function): boolean {
	for (var i = this._funcs.length - 1; i >= 0; --i) {
		if (this._funcs[i].fn === fn) {
			this._funcs.splice(i, 1);
			return true;
		}
	}

	return false;
}

export function Functor$isEmpty(args: Array<any> = null): boolean {
	return !this._funcs.some(function (item: FunctorItem) { return item.applied !== true && (!args || !item.filter || item.filter.apply(this, args)); }, this);
}

export function Functor$clear(): void {
	this._funcs.length = 0;
}
