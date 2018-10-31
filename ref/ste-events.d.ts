/// <reference path="./ste-core.d.ts" />
declare module 'ste-events' {
    import { IEventManagement, ISubscribable, IBaseEventHandling } from "ste-core";
    /**
     * Models an event with a generic sender and generic argument.
     */
    export interface IEvent<TSender, TArgs> extends ISubscribable<IEventHandler<TSender, TArgs>> {
    }
    /**
     * Interface for event handlers.
     *
     * @export
     * @interface IEventHandler
     * @template TSender The sender type.
     * @template TArgs The arguments type.
     */
    export interface IEventHandler<TSender, TArgs> {
        (sender: TSender, args: TArgs, ev: IEventManagement): void;
    }
    /**
     * Indicates the object is capable of handling named events.
     */
    export interface IEventHandling<TSender, TArgs> extends IBaseEventHandling<IEventHandler<TSender, TArgs>> {
    }
    import { DispatcherBase, EventListBase } from "ste-core";
    /**
     * Dispatcher implementation for events. Can be used to subscribe, unsubscribe
     * or dispatch events. Use the ToEvent() method to expose the event.
     */
    export class EventDispatcher<TSender, TArgs> extends DispatcherBase<IEventHandler<TSender, TArgs>> implements IEvent<TSender, TArgs> {
        /**
         * Creates a new EventDispatcher instance.
         */
        constructor();
        /**
         * Dispatches the event.
         * @param sender The sender.
         * @param args The arguments object.
         */
        dispatch(sender: TSender, args: TArgs): void;
        /**
         * Dispatches the events thread.
         * @param sender The sender.
         * @param args The arguments object.
         */
        dispatchAsync(sender: TSender, args: TArgs): void;
        /**
         * Creates an event from the dispatcher. Will return the dispatcher
         * in a wrapper. This will prevent exposure of any dispatcher methods.
         */
        asEvent(): IEvent<TSender, TArgs>;
    }
    /**
     * Storage class for multiple events that are accessible by name.
     * Events dispatchers are automatically created.
     */
    export class EventList<TSender, TArgs> extends EventListBase<EventDispatcher<TSender, TArgs>> {
        /**
         * Creates a new EventList instance.
         */
        constructor();
        /**
         * Creates a new dispatcher instance.
         */
        protected createDispatcher(): EventDispatcher<TSender, TArgs>;
    }
    /**
     * Extends objects with event handling capabilities.
     */
    export abstract class EventHandlingBase<TSender, TArgs> implements IEventHandling<TSender, TArgs> {
        private _events;
        /**
         * Gets the list with all the event dispatchers.
         */
        protected readonly events: EventList<TSender, TArgs>;
        /**
         * Subscribes to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        subscribe(name: string, fn: IEventHandler<TSender, TArgs>): void;
        /**
         * Subscribes to the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        sub(name: string, fn: IEventHandler<TSender, TArgs>): void;
        /**
         * Unsubscribes from the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        unsubscribe(name: string, fn: IEventHandler<TSender, TArgs>): void;
        /**
         * Unsubscribes from the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        unsub(name: string, fn: IEventHandler<TSender, TArgs>): void;
        /**
         * Subscribes to once the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        one(name: string, fn: IEventHandler<TSender, TArgs>): void;
        /**
         * Subscribes to once the event with the specified name.
         * @param name The name of the event.
         * @param fn The event handler.
         */
        has(name: string, fn: IEventHandler<TSender, TArgs>): boolean;
    }
}