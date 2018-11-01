import EventDispatcher from "ste-event"

class EventScope {

	private static currentEventScope: EventScope;

	parent: EventScope;

	isActive: boolean;

	private abort: EventDispatcher<EventScope>;

	constructor() {
		this.parent = EventScope.currentEventScope;
		this.isActive = true;
		EventScope.currentEventScope = this;
	}

	abort() {
		if (!this.isActive) {
			throw new Error("The event scope cannot be aborted because it is not active.");
		}

		try {
			var abortHandler = this._getEventHandler("abort");
			if (abortHandler && !abortHandler.isEmpty()) {
				// Invoke all subscribers
				abortHandler();
			}

			// Clear the events to ensure that they aren't
			// inadvertantly raised again through this scope
			this._clearEvent("abort");
			this._clearEvent("exit");
		}
		finally {
			// The event scope is no longer active
			this.isActive = false;

			if (currentEventScope && currentEventScope === this) {
				// Roll back to the closest active scope
				while (currentEventScope && !currentEventScope.isActive) {
					currentEventScope = currentEventScope.parent;
				}
			}
		}
	}

	exit() {
		if (!this.isActive) {
			throw new Error("The event scope cannot be exited because it is not active.");
		}

		try {
			var exitHandler = this._getEventHandler("exit");
			if (exitHandler && !exitHandler.isEmpty()) {

				// If there is no parent scope, then go ahead and execute the 'exit' event
				if (this.parent === null || !this.parent.isActive) {

					// Record the initial version and initial number of subscribers
					this._exitEventVersion = 0;
					this._exitEventHandlerCount = exitHandler._funcs.length;

					// Invoke all subscribers
					exitHandler();

					// Delete the fields to indicate that raising the exit event suceeded
					delete this._exitEventHandlerCount;
					delete this._exitEventVersion;

				}
				else {
					if (typeof window.ExoWeb.config.nonExitingScopeNestingCount === "number") {
						var maxNesting = window.ExoWeb.config.nonExitingScopeNestingCount - 1;
						if (this.parent.hasOwnProperty("_exitEventVersion") && this.parent._exitEventVersion >= maxNesting) {
							this.abort();
							logWarning("Event scope 'exit' subscribers were discarded due to non-exiting.");
							return;
						}
					}

					// Move subscribers to the parent scope
					this.parent._addEvent("exit", exitHandler);

					if (this.parent.hasOwnProperty("_exitEventVersion")) {
						this.parent._exitEventVersion++;
					}
				}

				// Clear the events to ensure that they aren't
				// inadvertantly raised again through this scope
				this._clearEvent("exit");
				this._clearEvent("abort");
			}
		}
		finally {
			// The event scope is no longer active
			this.isActive = false;

			if (currentEventScope && currentEventScope === this) {
				// Roll back to the closest active scope
				while (currentEventScope && !currentEventScope.isActive) {
					currentEventScope = currentEventScope.parent;
				}
			}
		}
	}
});

function EventScope$onExit(callback, thisPtr) {
	if (currentEventScope === null) {
		// Immediately invoke the callback
		if (thisPtr) {
			callback.call(thisPtr);
		}
		else {
			callback();
		}
	}
	else if (!currentEventScope.isActive) {
		throw new Error("The current event scope cannot be inactive.");
	}
	else {
		// Subscribe to the exit event
		currentEventScope._addEvent("exit", callback.bind(thisPtr));
	}
}

function EventScope$onAbort(callback, thisPtr) {
	if (currentEventScope !== null) {
		if (!currentEventScope.isActive) {
			throw new Error("The current event scope cannot be inactive.");
		}

		// Subscribe to the abort event
		currentEventScope._addEvent("abort", callback.bind(thisPtr));
	}
}

function EventScope$perform(callback, thisPtr) {
	// Create an event scope
	var scope = new EventScope();
	try {
		// Invoke the callback
		if (thisPtr) {
			callback.call(thisPtr);
		}
		else {
			callback();
		}
	}
	finally {
		// Exit the event scope
		scope.exit();
	}
}

exports.EventScopeCtor = EventScope; // IGNORE

exports.reset = function () { currentEventScope = null; }; // IGNORE

// Export public functions
var eventScopeApi = {
	onExit: EventScope$onExit,
	onAbort: EventScope$onAbort,
	perform: EventScope$perform
};

exports.EventScope = eventScopeApi;
