import { isNumber } from "./helpers";

var pendingSignalTimeouts: Function[] = null;

let signalMaxBatchSize: number = null;

let signalTimeout: boolean = false;

interface SignalItem {
	callback: Function;
	thisPtr?: any;
	executeImmediately?: boolean;
	args?: any[];
}

export class Signal {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the property is
	readonly label: string;

	private _waitForAll: SignalItem[];
	private _pending: number;

	constructor(label: string) {
		
		// Public read-only properties
		Object.defineProperty(this, "label", { enumerable: true, value: label });

		// Backing fields for properties
		Object.defineProperty(this, "_waitForAll", { enumerable: false, value: [], writable: true });
		Object.defineProperty(this, "_pending", { enumerable: false, value: 0, writable: true });

	}

	get isActive(): boolean {
		return this._pending > 0;
	}

	pending(callback: Function, thisPtr: any = null, executeImmediately: boolean = null) {
		var result = generateSignalPendingCallback(this, callback, thisPtr, executeImmediately);
		this._pending++;
		return result;
	}

	waitForAll(callback: Function, thisPtr: any = null, executeImmediately: boolean = null, args: any[] = null) {
		if (!callback) {
			return;
		}

		if (this._pending === 0) {
			doSignalCallback("waitForAll", thisPtr, callback, args, executeImmediately);
		}
		else {
			this._waitForAll.push({ callback, thisPtr, executeImmediately, args });
		}
	}

	decrement() {
		--this._pending;

		while (this._pending === 0 && this._waitForAll.length > 0) {
			var item = this._waitForAll.shift();
			doSignalCallback("waitForAll", item.thisPtr, item.callback, item.args, item.executeImmediately);
		}
	}
}

var setupCallbacks = function setupCallbacks(thisPtr: any, args: any[] = null) {
	setTimeout(function () {
		var callbacks, maxBatch = isNumber(signalMaxBatchSize) ? signalMaxBatchSize : null;
		if (maxBatch && pendingSignalTimeouts.length > maxBatch) {
			// Exceeds max batch size, so only invoke the max number and delay the rest
			callbacks = pendingSignalTimeouts.splice(0, maxBatch);
			setupCallbacks(thisPtr, args);
		}
		else {
			// No max batch, or does not exceed size, so call all pending callbacks
			callbacks = pendingSignalTimeouts;
			pendingSignalTimeouts = null;
		}
		// Call each callback in order
		callbacks.forEach((arg: Function) => arg.apply(thisPtr, args));
	}, 1);
};

function doSignalCallback(name: string, thisPtr: any, callback: Function, args: any[] = null, executeImmediately: boolean = null) {
	if (executeImmediately === false || (signalTimeout === true && executeImmediately !== true)) {
		// manage a queue of callbacks to ensure the order of execution

		var setup = false;
		if (pendingSignalTimeouts === null) {
			pendingSignalTimeouts = [];
			setup = true;
		}

		pendingSignalTimeouts.push(function() {
			callback.apply(thisPtr, args || []);
		});

		if (setup) {
			setupCallbacks(thisPtr, args);
		}
	}
	else {
		callback.apply(thisPtr, args || []);
	}
}

function generateSignalPendingCallback(signal: Signal, callback: Function, thisPtr: any = null, executeImmediately: boolean = null) {
	var called = false;
	return function Signal$_genCallback$result() {
		doSignalCallback("pending", thisPtr || this, function Signal$_genCallback$fn() {

			if (called) {
				// TODO: Warn about signal callback called more than once?
				// throw new Error("(" + signal.label + ") signal callback was called more than once.");
				return;
			}

			// Record the fact that the callback has already been called in case it is called again
			called = true;

			// Invoke the callback if it exists
			if (callback) callback.apply(this, arguments);

			// Signal that the callback is complete
			signal.decrement();

		}, arguments.length > 0 ? Array.prototype.slice.call(arguments) : null, executeImmediately);
	};
}
