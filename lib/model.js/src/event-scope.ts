import { EventDispatcher, IEvent } from "ste-events";
import { getEventSubscriptions } from "./helpers";

export let EventScope$current: EventScope = null;

// TODO: Make `nonExitingScopeNestingCount` an editable configuration value
// Controls the maximum number of times that a child event scope can transfer events
// to its parent while the parent scope is exiting. A large number indicates that
// rules are not reaching steady-state. Technically something other than rules could
// cause this scenario, but in practice they are the primary use-case for event scope. 
const nonExitingScopeNestingCount: number = 100;

interface EventScopeExitEventArgs {
}

interface EventScopeAbortEventArgs {
	maxNestingExceeded: boolean;
}

class EventScopeEventDispatchers {

	readonly exitEvent: EventDispatcher<EventScope, EventScopeExitEventArgs>;

	readonly abortEvent: EventDispatcher<EventScope, EventScopeAbortEventArgs>;

	constructor() {
		this.exitEvent = new EventDispatcher<EventScope, EventScopeExitEventArgs>();
		this.abortEvent = new EventDispatcher<EventScope, EventScopeAbortEventArgs>();
	}

}

export class EventScope {

	// Public read-only properties: aspects of the object that cannot be
	// changed without fundamentally changing what the property is
	parent: EventScope;

	// Backing fields for properties that are settable and also derived from
	// other data, calculated in some way, or cannot simply be changed
	_isActive: boolean;

	private _exitEventVersion: number;
	private _exitEventHandlerCount: number;

	readonly _eventDispatchers: EventScopeEventDispatchers;

	constructor() {
		// If there is a current event scope
		// then it will be the parent of the new event scope
		var parent = EventScope$current;

		// Public read-only properties
		Object.defineProperty(this, "parent", { enumerable: true, value: parent });

		// Backing fields for properties
		Object.defineProperty(this, "_isActive", { enumerable: false, value: true, writable: true });

		Object.defineProperty(this, "_eventDispatchers", { value: new EventScopeEventDispatchers() });

		EventScope$current = this;
	}

	get isActive(): boolean {
		return this._isActive;
	}

	get exitEvent(): IEvent<EventScope, EventScopeExitEventArgs> {
		return this._eventDispatchers.exitEvent.asEvent();
	}

	get abortEvent(): IEvent<EventScope, EventScopeAbortEventArgs> {
		return this._eventDispatchers.abortEvent.asEvent();
	}

	abort(maxNestingExceeded: boolean = false) {
		if (!this.isActive) {
			throw new Error("The event scope cannot be aborted because it is not active.");
		}

		try {
			// TODO: Don't raise event if nothing is subscribed
			this._eventDispatchers.abortEvent.dispatch(this, { maxNestingExceeded: maxNestingExceeded });

			// Clear the events to ensure that they aren't
			// inadvertantly raised again through this scope
			this._eventDispatchers.abortEvent.clear();
			this._eventDispatchers.exitEvent.clear();
		}
		finally {
			// The event scope is no longer active
			this._isActive = false;

			if (EventScope$current && EventScope$current === this) {
				// Roll back to the closest active scope
				while (EventScope$current && !EventScope$current.isActive) {
					EventScope$current = EventScope$current.parent;
				}
			}
		}
	}

	exit() {
		if (!this.isActive) {
			throw new Error("The event scope cannot be exited because it is not active.");
		}

		try {
			var exitSubscriptions = getEventSubscriptions(this._eventDispatchers.exitEvent);
			if (exitSubscriptions && exitSubscriptions.length > 0) {

				// If there is no parent scope, then go ahead and execute the 'exit' event
				if (this.parent === null || !this.parent.isActive) {

					// Record the initial version and initial number of subscribers
					this._exitEventVersion = 0;
					this._exitEventHandlerCount = exitSubscriptions.length;

					// Invoke all subscribers
					this._eventDispatchers.exitEvent.dispatch(this, {});

					// Delete the fields to indicate that raising the exit event suceeded
					delete this._exitEventHandlerCount;
					delete this._exitEventVersion;

				} else {
					// if (typeof ...config.nonExitingScopeNestingCount === "number") { ...
					var maxNesting = nonExitingScopeNestingCount - 1;
					if (this.parent.hasOwnProperty("_exitEventVersion") && this.parent._exitEventVersion >= maxNesting) {
						this.abort(true);
						// TODO: Warn... "Event scope 'exit' subscribers were discarded due to non-exiting."
						return;
					}

					// Move subscribers to the parent scope
					exitSubscriptions.forEach(sub => {
						if (!sub.isOnce || !sub.isExecuted) {
							this.parent._eventDispatchers.exitEvent.subscribe(sub.handler);
						}
					});

					if (this.parent.hasOwnProperty("_exitEventVersion")) {
						this.parent._exitEventVersion++;
					}
				}

				// Clear the events to ensure that they aren't
				// inadvertantly raised again through this scope
				this._eventDispatchers.abortEvent.clear();
				this._eventDispatchers.exitEvent.clear();
			}
		}
		finally {
			// The event scope is no longer active
			this._isActive = false;

			if (EventScope$current && EventScope$current === this) {
				// Roll back to the closest active scope
				while (EventScope$current && !EventScope$current.isActive) {
					EventScope$current = EventScope$current.parent;
				}
			}
		}
	}
}

export function EventScope$onExit(callback: Function, thisPtr: any = null) {
	if (EventScope$current === null) {
		// Immediately invoke the callback
		if (thisPtr) {
			callback.call(thisPtr);
		} else {
			callback();
		}
	} else if (!EventScope$current.isActive) {
		throw new Error("The current event scope cannot be inactive.");
	} else {
		// Subscribe to the exit event
		EventScope$current._eventDispatchers.exitEvent.subscribe(callback.bind(thisPtr));
	}
}

export function EventScope$onAbort(callback: Function, thisPtr: any = null) {
	if (EventScope$current !== null) {
		if (!EventScope$current.isActive) {
			throw new Error("The current event scope cannot be inactive.");
		}

		// Subscribe to the abort event
		EventScope$current._eventDispatchers.abortEvent.subscribe(callback.bind(thisPtr));
	}
}

export function EventScope$perform(callback: Function, thisPtr: any = null) {
	// Create an event scope
	var scope = new EventScope();
	try {
		// Invoke the callback
		if (thisPtr) {
			callback.call(thisPtr);
		} else {
			callback();
		}
	} finally {
		// Exit the event scope
		scope.exit();
	}
}
