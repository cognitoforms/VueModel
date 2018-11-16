import { Functor$create, FunctorWith1Arg, FunctorItem } from "./functor";
import { hasOwnProperty } from "./helpers";

export class EventObject {
    stopPropagation(): void {
        // TODO: Implement 'stopPropagation()'?
        throw new Error("Method 'stopPropagation' is not implemented.");
    }
}

export interface EventHandler<This, EventArgsType> {
    (this: This, event: EventObject & EventArgsType): void;
}

export interface EventSubscriber<This, EventArgsType> {
    subscribe(handler: EventHandler<This, EventArgsType>): void;
    subscribeOne(handler: EventHandler<This, EventArgsType>): void;
    unsubscribe(handler: EventHandler<This, EventArgsType>): void;
	hasSubscribers(handler?: EventHandler<This, EventArgsType>): boolean;
    clear(): void;
}

export interface EventPublisher<This, EventArgsType> extends EventSubscriber<This, EventArgsType> {
	asEventSubscriber(): EventSubscriber<This, EventArgsType>;
	publish(thisObject: This, args: EventArgsType): void;
}

export interface ContextualEventRegistration<This, EventArgsType, TContext> {
	handler: EventHandler<This, EventArgsType>;
	context?: TContext;
}

export interface EventSubscription<This, EventArgsType> {
	handler: EventHandler<This, EventArgsType>,
	isExecuted?: boolean;
	isOnce?: boolean;
}

function createEventObject<EventArgsType>(args: EventArgsType): EventObject & EventArgsType {
    let eventObject = new EventObject();

    for (var prop in args) {
        if (hasOwnProperty(args, prop)) {
            (eventObject as any)[prop] = args[prop];
        }
    }

    return eventObject as EventObject & EventArgsType;
}

export class EventSubWrapper<This, EventArgsType> implements EventSubscriber<This, EventArgsType> {
    private readonly _event: Event<This, EventArgsType>;
    constructor(event: Event<This, EventArgsType>) {
        Object.defineProperty(this, "_event", { value: event });
    }
    subscribe(handler: EventHandler<This, EventArgsType>): void {
        this._event.subscribe(handler);
    }
    subscribeOne(handler: EventHandler<This, EventArgsType>): void {
        this._event.subscribeOne(handler);
    }
    unsubscribe(handler: EventHandler<This, EventArgsType>): void {
        this._event.unsubscribe(handler);
    }
    hasSubscribers(handler?: EventHandler<This, EventArgsType>): boolean {
        return this._event.hasSubscribers(handler);
    }
    clear(): void {
        this._event.clear();
    }
}

export class Event<This, EventArgsType> implements EventPublisher<This, EventArgsType>, EventSubscriber<This, EventArgsType> {
    private _subscriber: EventSubWrapper<This, EventArgsType>;
    private _func: FunctorWith1Arg<EventArgsType, void> & ((this: This, args: EventObject & EventArgsType) => void);

    asEventSubscriber(): EventSubscriber<This, EventArgsType> {
        if (!this._subscriber) {
            Object.defineProperty(this, "_subscriber", { value: new EventSubWrapper(this) });
        }
        return this._subscriber;
    }

    publish(thisObject: This, args: EventArgsType): void {
        if (!this._func) {
            // No subscribers
            return;
        }
        let eventObject = createEventObject<EventArgsType>(args);
        this._func.call(thisObject, eventObject);
    }

    subscribe(handler: EventHandler<This, EventArgsType>): void {
        if (!this._func) {
            Object.defineProperty(this, "_func", { value: Functor$create() });
        }
        this._func.add(handler);
    }

    subscribeOne(handler: EventHandler<This, EventArgsType>): void {
        if (!this._func) {
            Object.defineProperty(this, "_func", { value: Functor$create() });
        }
        this._func.add(handler, null, true);
    }

    hasSubscribers(handler?: EventHandler<This, EventArgsType>): boolean {
        if (!this._func) {
            return false;
        }

        let functorItems = ((this._func as any)._funcs) as FunctorItem[];
        return functorItems.some(function(i) { return i.fn === handler; });
    }

    unsubscribe(handler: EventHandler<This, EventArgsType>): void {
        if (!this._func) {
            // No subscribers
            return;
        }
        this._func.remove(handler);
    }

    clear(): void {
        if (!this._func) {
            // No subscribers
            return;
        }
        this._func.clear();
    }

}
