declare module 'ste-core' {
    /**
     * Manages the event.
     *
     * @export
     * @interface IEventManagement
     */
    export interface IEventManagement {
        /**
         * Will unsubscribe the handler.
         *
         * @memberof IEventManagement
         */
        unsub(): void;
        /**
         * Stops the propagation of the event.
         * Cannot be used when async dispatch is done.
         *
         * @memberof IEventManagement
         */
        stopPropagation(): void;
    }
    /**
     * Allows the user to interact with the event.
     *
     * @class EventManagement
     * @implements {IEventManagement}
     */
    class EventManagement implements IEventManagement {
        unsub: () => void;
        propagationStopped: boolean;
        constructor(unsub: () => void);
        stopPropagation(): void;
    }
    /**
     * Indicates the object implements generic subscriptions.
     */
    export interface ISubscribable<THandlerType> {
        /**
         * Subscribe to the event.
         * @param fn The event handler that is called when the event is dispatched.
         * @returns A function that unsubscribes the event handler from the event.
         */
        subscribe(fn: THandlerType): () => void;
        /**
         * Subscribe to the event.
         * @param fn The event handler that is called when the event is dispatched.
         * @returns A function that unsubscribes the event handler from the event.
         */
        sub(fn: THandlerType): () => void;
        /**
         * Unsubscribe from the event.
         * @param fn The event handler that will be unsubsribed from the event.
         */
        unsubscribe(fn: THandlerType): void;
        /**
         * Unsubscribe from the event.
         * @param fn The event handler that will be unsubsribed from the event.
         */
        unsub(fn: THandlerType): void;
        /**
         * Subscribes to the event only once.
         * @param fn The event handler that is called when the event is dispatched.
         * @returns A function that unsubscribes the event handler from the event.
         */
        one(fn: THandlerType): () => void;
        /**
         * Checks it the event has a subscription for the specified handler.
         * @param fn The event handler.
         */
        has(fn: THandlerType): boolean;
        /**
         * Clears all the subscriptions.
         */
        clear(): void;
    }
    /**
     * Base class for implementation of the dispatcher. It facilitates the subscribe
     * and unsubscribe methods based on generic handlers. The TEventType specifies
     * the type of event that should be exposed. Use the asEvent to expose the
     * dispatcher as event.
     */
    export abstract class DispatcherBase<TEventHandler> implements ISubscribable<TEventHandler> {
        private _wrap;
        private _subscriptions;
        /**
         * Subscribe to the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         * @returns A function that unsubscribes the event handler from the event.
         */
        subscribe(fn: TEventHandler): () => void;
        /**
         * Subscribe to the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         * @returns A function that unsubscribes the event handler from the event.
         */
        sub(fn: TEventHandler): () => void;
        /**
         * Subscribe once to the event with the specified name.
         * @param fn The event handler that is called when the event is dispatched.
         * @returns A function that unsubscribes the event handler from the event.
         */
        one(fn: TEventHandler): () => void;
        /**
         * Checks it the event has a subscription for the specified handler.
         * @param fn The event handler.
         */
        has(fn: TEventHandler): boolean;
        /**
         * Unsubscribes the handler from the dispatcher.
         * @param fn The event handler.
         */
        unsubscribe(fn: TEventHandler): void;
        /**
         * Unsubscribes the handler from the dispatcher.
         * @param fn The event handler.
         */
        unsub(fn: TEventHandler): void;
        /**
         * Generic dispatch will dispatch the handlers with the given arguments.
         *
         * @protected
         * @param {boolean} executeAsync True if the even should be executed async.
         * @param {*} The scope the scope of the event. The scope becomes the "this" for handler.
         * @param {IArguments} args The arguments for the event.
         */
        protected _dispatch(executeAsync: boolean, scope: any, args: IArguments): void;
        /**
         * Cleans up subs that ran and should run only once.
         */
        protected cleanup(sub: Subscription<TEventHandler>): void;
        /**
         * Creates an event from the dispatcher. Will return the dispatcher
         * in a wrapper. This will prevent exposure of any dispatcher methods.
         */
        asEvent(): ISubscribable<TEventHandler>;
        /**
         * Clears all the subscriptions.
         */
        clear(): void;
    }
    /**
     * Base class for event lists classes. Implements the get and remove.
     */
    export abstract class EventListBase<TEventDispatcher> {
        private _events;
        /**
         * Gets the dispatcher associated with the name.
         * @param name The name of the event.
         */
        get(name: string): TEventDispatcher;
        /**
         * Removes the dispatcher associated with the name.
         * @param name The name of the event.
         */
        remove(name: string): void;
        /**
         * Creates a new dispatcher instance.
         */
        protected abstract createDispatcher(): TEventDispatcher;
    }
    /**
     * Hides the implementation of the event dispatcher. Will expose methods that
     * are relevent to the event.
     */
    class DispatcherWrapper<THandler> implements ISubscribable<THandler> {
        private _subscribe;
        private _unsubscribe;
        private _one;
        private _has;
        private _clear;
        /**
         * Creates a new EventDispatcherWrapper instance.
         * @param dispatcher The dispatcher.
         */
        constructor(dispatcher: ISubscribable<THandler>);
        /**
         * Subscribe to the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         * @returns A function that unsubscribes the event handler from the event.
         */
        subscribe(fn: THandler): () => void;
        /**
         * Subscribe to the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         * @returns A function that unsubscribes the event handler from the event.
         */
        sub(fn: THandler): () => void;
        /**
         * Unsubscribe from the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         */
        unsubscribe(fn: THandler): void;
        /**
         * Unsubscribe from the event dispatcher.
         * @param fn The event handler that is called when the event is dispatched.
         */
        unsub(fn: THandler): void;
        /**
         * Subscribe once to the event with the specified name.
         * @param fn The event handler that is called when the event is dispatched.
         */
        one(fn: THandler): () => void;
        /**
         * Checks it the event has a subscription for the specified handler.
         * @param fn The event handler.
         */
        has(fn: THandler): boolean;
        /**
         * Clears all the subscriptions.
         */
        clear(): void;
    }
    /**
     * Stores a handler. Manages execution meta data.
     * @class Subscription
     * @template TEventHandler
     */
    export class Subscription<TEventHandler> {
        handler: TEventHandler;
        isOnce: boolean;
        /**
         * Indicates if the subscription has been executed before.
         */
        isExecuted: boolean;
        /**
         * Creates an instance of Subscription.
         *
         * @param {TEventHandler} handler The handler for the subscription.
         * @param {boolean} isOnce Indicates if the handler should only be executed once.
         */
        constructor(handler: TEventHandler, isOnce: boolean);
        /**
         * Executes the handler.
         *
         * @param {boolean} executeAsync True if the even should be executed async.
         * @param {*} scope The scope the scope of the event.
         * @param {IArguments} args The arguments for the event.
         */
        execute(executeAsync: boolean, scope: any, args: IArguments): void;
    }
    /**
     * Base interface for event handling.
     */
    export interface IBaseEventHandling<TEventHandler> {
        /**
         * Subscribe to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler that is called when the event is dispatched.
         */
        subscribe(name: string, fn: TEventHandler): void;
        /**
         * Subscribe to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler that is called when the event is dispatched.
         */
        sub(name: string, fn: TEventHandler): void;
        /**
         * Unsubscribe from the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler that is will be unsubsribed from the event.
         */
        unsubscribe(name: string, fn: TEventHandler): void;
        /**
         * Unsubscribe from the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler that is will be unsubsribed from the event.
         */
        unsub(name: string, fn: TEventHandler): void;
        /**
         * Subscribe once to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler that is called when the event is dispatched.
         */
        one(name: string, fn: TEventHandler): void;
        /**
         * Checks it the event has a subscription for the specified handler.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        has(name: string, fn: TEventHandler): boolean;
    }
}