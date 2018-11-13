/*!
 * Model.js v0.0.16
 * (c) 2018 Cognito LLC
 * Released under the MIT License.
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var management = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Allows the user to interact with the event.
 *
 * @class EventManagement
 * @implements {IEventManagement}
 */
var EventManagement = /** @class */ (function () {
    function EventManagement(unsub) {
        this.unsub = unsub;
        this.propagationStopped = false;
    }
    EventManagement.prototype.stopPropagation = function () {
        this.propagationStopped = true;
    };
    return EventManagement;
}());
exports.EventManagement = EventManagement;
});

unwrapExports(management);
var management_1 = management.EventManagement;

var subscription = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Stores a handler. Manages execution meta data.
 * @class Subscription
 * @template TEventHandler
 */
var Subscription = /** @class */ (function () {
    /**
     * Creates an instance of Subscription.
     *
     * @param {TEventHandler} handler The handler for the subscription.
     * @param {boolean} isOnce Indicates if the handler should only be executed once.
     */
    function Subscription(handler, isOnce) {
        this.handler = handler;
        this.isOnce = isOnce;
        /**
         * Indicates if the subscription has been executed before.
         */
        this.isExecuted = false;
    }
    /**
     * Executes the handler.
     *
     * @param {boolean} executeAsync True if the even should be executed async.
     * @param {*} scope The scope the scope of the event.
     * @param {IArguments} args The arguments for the event.
     */
    Subscription.prototype.execute = function (executeAsync, scope, args) {
        if (!this.isOnce || !this.isExecuted) {
            this.isExecuted = true;
            var fn = this.handler;
            if (executeAsync) {
                setTimeout(function () {
                    fn.apply(scope, args);
                }, 1);
            }
            else {
                fn.apply(scope, args);
            }
        }
    };
    return Subscription;
}());
exports.Subscription = Subscription;
});

unwrapExports(subscription);
var subscription_1 = subscription.Subscription;

var dispatching = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });


/**
 * Base class for implementation of the dispatcher. It facilitates the subscribe
 * and unsubscribe methods based on generic handlers. The TEventType specifies
 * the type of event that should be exposed. Use the asEvent to expose the
 * dispatcher as event.
 */
var DispatcherBase = /** @class */ (function () {
    function DispatcherBase() {
        this._wrap = new DispatcherWrapper(this);
        this._subscriptions = new Array();
    }
    /**
     * Subscribe to the event dispatcher.
     * @param fn The event handler that is called when the event is dispatched.
     * @returns A function that unsubscribes the event handler from the event.
     */
    DispatcherBase.prototype.subscribe = function (fn) {
        var _this = this;
        if (fn) {
            this._subscriptions.push(new subscription.Subscription(fn, false));
        }
        return function () {
            _this.unsubscribe(fn);
        };
    };
    /**
     * Subscribe to the event dispatcher.
     * @param fn The event handler that is called when the event is dispatched.
     * @returns A function that unsubscribes the event handler from the event.
     */
    DispatcherBase.prototype.sub = function (fn) {
        return this.subscribe(fn);
    };
    /**
     * Subscribe once to the event with the specified name.
     * @param fn The event handler that is called when the event is dispatched.
     * @returns A function that unsubscribes the event handler from the event.
     */
    DispatcherBase.prototype.one = function (fn) {
        var _this = this;
        if (fn) {
            this._subscriptions.push(new subscription.Subscription(fn, true));
        }
        return function () {
            _this.unsubscribe(fn);
        };
    };
    /**
     * Checks it the event has a subscription for the specified handler.
     * @param fn The event handler.
     */
    DispatcherBase.prototype.has = function (fn) {
        if (!fn)
            return false;
        return this._subscriptions.some(function (sub) { return sub.handler == fn; });
    };
    /**
     * Unsubscribes the handler from the dispatcher.
     * @param fn The event handler.
     */
    DispatcherBase.prototype.unsubscribe = function (fn) {
        if (!fn)
            return;
        for (var i = 0; i < this._subscriptions.length; i++) {
            if (this._subscriptions[i].handler == fn) {
                this._subscriptions.splice(i, 1);
                break;
            }
        }
    };
    /**
     * Unsubscribes the handler from the dispatcher.
     * @param fn The event handler.
     */
    DispatcherBase.prototype.unsub = function (fn) {
        this.unsubscribe(fn);
    };
    /**
     * Generic dispatch will dispatch the handlers with the given arguments.
     *
     * @protected
     * @param {boolean} executeAsync True if the even should be executed async.
     * @param {*} The scope the scope of the event. The scope becomes the "this" for handler.
     * @param {IArguments} args The arguments for the event.
     */
    DispatcherBase.prototype._dispatch = function (executeAsync, scope, args) {
        var _this = this;
        var _loop_1 = function (sub) {
            var ev = new management.EventManagement(function () { return _this.unsub(sub.handler); });
            var nargs = Array.prototype.slice.call(args);
            nargs.push(ev);
            sub.execute(executeAsync, scope, nargs);
            //cleanup subs that are no longer needed
            this_1.cleanup(sub);
            if (!executeAsync && ev.propagationStopped) {
                return "break";
            }
        };
        var this_1 = this;
        //execute on a copy because of bug #9
        for (var _i = 0, _a = this._subscriptions.slice(); _i < _a.length; _i++) {
            var sub = _a[_i];
            var state_1 = _loop_1(sub);
            if (state_1 === "break")
                break;
        }
    };
    /**
     * Cleans up subs that ran and should run only once.
     */
    DispatcherBase.prototype.cleanup = function (sub) {
        if (sub.isOnce && sub.isExecuted) {
            var i = this._subscriptions.indexOf(sub);
            if (i > -1) {
                this._subscriptions.splice(i, 1);
            }
        }
    };
    /**
     * Creates an event from the dispatcher. Will return the dispatcher
     * in a wrapper. This will prevent exposure of any dispatcher methods.
     */
    DispatcherBase.prototype.asEvent = function () {
        return this._wrap;
    };
    /**
     * Clears all the subscriptions.
     */
    DispatcherBase.prototype.clear = function () {
        this._subscriptions.splice(0, this._subscriptions.length);
    };
    return DispatcherBase;
}());
exports.DispatcherBase = DispatcherBase;
/**
 * Base class for event lists classes. Implements the get and remove.
 */
var EventListBase = /** @class */ (function () {
    function EventListBase() {
        this._events = {};
    }
    /**
     * Gets the dispatcher associated with the name.
     * @param name The name of the event.
     */
    EventListBase.prototype.get = function (name) {
        var event = this._events[name];
        if (event) {
            return event;
        }
        event = this.createDispatcher();
        this._events[name] = event;
        return event;
    };
    /**
     * Removes the dispatcher associated with the name.
     * @param name The name of the event.
     */
    EventListBase.prototype.remove = function (name) {
        delete this._events[name];
    };
    return EventListBase;
}());
exports.EventListBase = EventListBase;
/**
 * Hides the implementation of the event dispatcher. Will expose methods that
 * are relevent to the event.
 */
var DispatcherWrapper = /** @class */ (function () {
    /**
     * Creates a new EventDispatcherWrapper instance.
     * @param dispatcher The dispatcher.
     */
    function DispatcherWrapper(dispatcher) {
        this._subscribe = function (fn) { return dispatcher.subscribe(fn); };
        this._unsubscribe = function (fn) { return dispatcher.unsubscribe(fn); };
        this._one = function (fn) { return dispatcher.one(fn); };
        this._has = function (fn) { return dispatcher.has(fn); };
        this._clear = function () { return dispatcher.clear(); };
    }
    /**
     * Subscribe to the event dispatcher.
     * @param fn The event handler that is called when the event is dispatched.
     * @returns A function that unsubscribes the event handler from the event.
     */
    DispatcherWrapper.prototype.subscribe = function (fn) {
        return this._subscribe(fn);
    };
    /**
     * Subscribe to the event dispatcher.
     * @param fn The event handler that is called when the event is dispatched.
     * @returns A function that unsubscribes the event handler from the event.
     */
    DispatcherWrapper.prototype.sub = function (fn) {
        return this.subscribe(fn);
    };
    /**
     * Unsubscribe from the event dispatcher.
     * @param fn The event handler that is called when the event is dispatched.
     */
    DispatcherWrapper.prototype.unsubscribe = function (fn) {
        this._unsubscribe(fn);
    };
    /**
     * Unsubscribe from the event dispatcher.
     * @param fn The event handler that is called when the event is dispatched.
     */
    DispatcherWrapper.prototype.unsub = function (fn) {
        this.unsubscribe(fn);
    };
    /**
     * Subscribe once to the event with the specified name.
     * @param fn The event handler that is called when the event is dispatched.
     */
    DispatcherWrapper.prototype.one = function (fn) {
        return this._one(fn);
    };
    /**
     * Checks it the event has a subscription for the specified handler.
     * @param fn The event handler.
     */
    DispatcherWrapper.prototype.has = function (fn) {
        return this._has(fn);
    };
    /**
     * Clears all the subscriptions.
     */
    DispatcherWrapper.prototype.clear = function () {
        this._clear();
    };
    return DispatcherWrapper;
}());
exports.DispatcherWrapper = DispatcherWrapper;
});

unwrapExports(dispatching);
var dispatching_1 = dispatching.DispatcherBase;
var dispatching_2 = dispatching.EventListBase;
var dispatching_3 = dispatching.DispatcherWrapper;

var dist = createCommonjsModule(function (module, exports) {
/*!
 * Strongly Typed Events for TypeScript - Core
 * https://github.com/KeesCBakker/StronlyTypedEvents/
 * http://keestalkstech.com
 *
 * Copyright Kees C. Bakker / KeesTalksTech
 * Released under the MIT license
 */
Object.defineProperty(exports, "__esModule", { value: true });

exports.DispatcherBase = dispatching.DispatcherBase;
exports.DispatcherWrapper = dispatching.DispatcherWrapper;
exports.EventListBase = dispatching.EventListBase;

exports.Subscription = subscription.Subscription;
});

unwrapExports(dist);
var dist_1 = dist.DispatcherBase;
var dist_2 = dist.DispatcherWrapper;
var dist_3 = dist.EventListBase;
var dist_4 = dist.Subscription;

var events = createCommonjsModule(function (module, exports) {
var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });

/**
 * Dispatcher implementation for events. Can be used to subscribe, unsubscribe
 * or dispatch events. Use the ToEvent() method to expose the event.
 */
var EventDispatcher = /** @class */ (function (_super) {
    __extends(EventDispatcher, _super);
    /**
     * Creates a new EventDispatcher instance.
     */
    function EventDispatcher() {
        return _super.call(this) || this;
    }
    /**
     * Dispatches the event.
     * @param sender The sender.
     * @param args The arguments object.
     */
    EventDispatcher.prototype.dispatch = function (sender, args) {
        this._dispatch(false, this, arguments);
    };
    /**
     * Dispatches the events thread.
     * @param sender The sender.
     * @param args The arguments object.
     */
    EventDispatcher.prototype.dispatchAsync = function (sender, args) {
        this._dispatch(true, this, arguments);
    };
    /**
     * Creates an event from the dispatcher. Will return the dispatcher
     * in a wrapper. This will prevent exposure of any dispatcher methods.
     */
    EventDispatcher.prototype.asEvent = function () {
        return _super.prototype.asEvent.call(this);
    };
    return EventDispatcher;
}(dist.DispatcherBase));
exports.EventDispatcher = EventDispatcher;
/**
 * Storage class for multiple events that are accessible by name.
 * Events dispatchers are automatically created.
 */
var EventList = /** @class */ (function (_super) {
    __extends(EventList, _super);
    /**
     * Creates a new EventList instance.
     */
    function EventList() {
        return _super.call(this) || this;
    }
    /**
     * Creates a new dispatcher instance.
     */
    EventList.prototype.createDispatcher = function () {
        return new EventDispatcher();
    };
    return EventList;
}(dist.EventListBase));
exports.EventList = EventList;
/**
 * Extends objects with event handling capabilities.
 */
var EventHandlingBase = /** @class */ (function () {
    function EventHandlingBase() {
        this._events = new EventList();
    }
    Object.defineProperty(EventHandlingBase.prototype, "events", {
        /**
         * Gets the list with all the event dispatchers.
         */
        get: function () {
            return this._events;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Subscribes to the event with the specified name.
     * @param name The name of the event.
     * @param fn The event handler.
     */
    EventHandlingBase.prototype.subscribe = function (name, fn) {
        this._events.get(name).subscribe(fn);
    };
    /**
     * Subscribes to the event with the specified name.
     * @param name The name of the event.
     * @param fn The event handler.
     */
    EventHandlingBase.prototype.sub = function (name, fn) {
        this.subscribe(name, fn);
    };
    /**
     * Unsubscribes from the event with the specified name.
     * @param name The name of the event.
     * @param fn The event handler.
     */
    EventHandlingBase.prototype.unsubscribe = function (name, fn) {
        this._events.get(name).unsubscribe(fn);
    };
    /**
     * Unsubscribes from the event with the specified name.
     * @param name The name of the event.
     * @param fn The event handler.
     */
    EventHandlingBase.prototype.unsub = function (name, fn) {
        this.unsubscribe(name, fn);
    };
    /**
     * Subscribes to once the event with the specified name.
     * @param name The name of the event.
     * @param fn The event handler.
     */
    EventHandlingBase.prototype.one = function (name, fn) {
        this._events.get(name).one(fn);
    };
    /**
     * Subscribes to once the event with the specified name.
     * @param name The name of the event.
     * @param fn The event handler.
     */
    EventHandlingBase.prototype.has = function (name, fn) {
        return this._events.get(name).has(fn);
    };
    return EventHandlingBase;
}());
exports.EventHandlingBase = EventHandlingBase;
});

unwrapExports(events);
var events_1 = events.EventDispatcher;
var events_2 = events.EventList;
var events_3 = events.EventHandlingBase;

var dist$1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });

exports.EventDispatcher = events.EventDispatcher;
exports.EventHandlingBase = events.EventHandlingBase;
exports.EventList = events.EventList;
});

unwrapExports(dist$1);
var dist_1$1 = dist$1.EventDispatcher;
var dist_2$1 = dist$1.EventHandlingBase;
var dist_3$1 = dist$1.EventList;

var ObjectMeta = /** @class */ (function () {
    function ObjectMeta(type, entity, id, isNew) {
        // Public read-only properties
        Object.defineProperty(this, "type", { enumerable: true, value: type });
        Object.defineProperty(this, "entity", { enumerable: true, value: entity });
        // Public settable properties that are simple values with no side-effects or logic
        Object.defineProperty(this, "_id", { enumerable: false, value: id, writable: true });
        Object.defineProperty(this, "_isNew", { enumerable: false, value: isNew, writable: true });
    }
    Object.defineProperty(ObjectMeta.prototype, "id", {
        get: function () {
            // TODO: Obfuscate backing field name?
            return this._id;
        },
        set: function (value) {
            // TODO: Implement logic to change object ID?
            this._id = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ObjectMeta.prototype, "isNew", {
        get: function () {
            // TODO: Obfuscate backing field name?
            // TODO: Implement logic to mark object as no longer new?
            return this._isNew;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ObjectMeta.prototype, "legacyId", {
        get: function () {
            // TODO: Obfuscate backing field name?
            return this._legacyId;
        },
        set: function (value) {
            // TODO: Don't allow setting legacy ID if already set
            this._legacyId = value;
        },
        enumerable: true,
        configurable: true
    });
    // TODO: Should this be a method on the entity itself, or a static method on Entity?
    ObjectMeta.prototype.destroy = function () {
        this.type.unregister(this.entity);
        // Raise the destroy event on this type and all base types
        for (var t = this.type; t; t = t.baseType) {
            Type$_getEventDispatchers(t).destroyEvent.dispatch(t, { entity: this.entity });
        }
    };
    return ObjectMeta;
}());

function ensureNamespace(name, parentNamespace) {
    var result, nsTokens, target = parentNamespace;
    if (target.constructor === String) {
        nsTokens = target.split(".");
        target = window;
        nsTokens.forEach(function (token) {
            target = target[token];
            if (target === undefined) {
                throw new Error("Parent namespace \"" + parentNamespace + "\" could not be found.");
            }
        });
    }
    else if (target === undefined || target === null) {
        target = window;
    }
    // create the namespace object if it doesn't exist, otherwise return the existing namespace
    if (!(name in target)) {
        result = target[name] = {};
        return result;
    }
    else {
        return target[name];
    }
}
function navigateAttribute(obj, attr, callback, thisPtr) {
    if (thisPtr === void 0) { thisPtr = null; }
    for (var val = obj[attr]; val != null; val = val[attr]) {
        if (callback.call(thisPtr || obj, val) === false) {
            return;
        }
    }
}
var fnRegex = /function\s*([\w_\$]*)/i;
function parseFunctionName(fn) {
    var fnMatch = fnRegex.exec(fn.toString());
    return fnMatch ? (fnMatch[1] || "{anonymous}") : "{anonymous}";
}
var typeNameExpr = /\s([a-z|A-Z]+)/;
function getTypeName(obj) {
    if (obj === undefined)
        return "undefined";
    if (obj === null)
        return "null";
    return Object.prototype.toString.call(obj).match(typeNameExpr)[1].toLowerCase();
}
function isNumber(obj) {
    return getTypeName(obj) === "number" && !isNaN(obj);
}
function getDefaultValue(isList, jstype) {
    if (isList)
        return [];
    if (jstype === Boolean)
        return false;
    if (jstype === Number)
        return 0;
    return null;
}
function randomInteger(min, max) {
    if (min === void 0) { min = 0; }
    if (max === void 0) { max = 9; }
    var rand = Math.random();
    return rand === 1 ? max : Math.floor(rand * (max - min + 1)) + min;
}
function randomText(len, includeDigits) {
    if (includeDigits === void 0) { includeDigits = false; }
    var result = "";
    for (var i = 0; i < len; i++) {
        var min = 0;
        var max = includeDigits ? 35 : 25;
        var rand = randomInteger(min, max);
        var charCode;
        if (rand <= 25) {
            // Alpha: add 97 for 'a'
            charCode = rand + 97;
        }
        else {
            // Num: start at 0 and add 48 for 0
            charCode = (rand - 26) + 48;
        }
        result += String.fromCharCode(charCode);
    }
    return result;
}
function toTitleCase(input) {
    // https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript/6475125#6475125
    var i, j, str, lowers, uppers;
    str = input.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
    // Certain minor words should be left lowercase unless 
    // they are the first or last words in the string
    lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At',
        'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto',
        'To', 'With'];
    for (i = 0, j = lowers.length; i < j; i++) {
        str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'), function (txt) {
            return txt.toLowerCase();
        });
    }
    // Certain words such as initialisms or acronyms should be left uppercase
    uppers = ['Id', 'Tv'];
    for (i = 0, j = uppers.length; i < j; i++) {
        str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'), uppers[i].toUpperCase());
    }
    return str;
}
function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
function merge(obj1) {
    var objs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        objs[_i - 1] = arguments[_i];
    }
    var target = {};
    for (var arg in obj1) {
        if (hasOwnProperty(obj1, arg)) {
            target[arg] = obj1[arg];
        }
    }
    for (var i = 0; i < objs.length; i++) {
        var obj = objs[i];
        for (var arg in obj) {
            if (hasOwnProperty(obj, arg)) {
                target[arg] = obj[arg];
            }
        }
    }
    return target;
}
function getEventSubscriptions(dispatcher) {
    var disp = dispatcher;
    var subs = disp._subscriptions;
    return subs;
}

var internalState = {
    secrets: {}
};
function createSecret(key, len, includeLetters, includeDigits, prefix) {
    if (len === void 0) { len = 8; }
    if (includeLetters === void 0) { includeLetters = true; }
    if (includeDigits === void 0) { includeDigits = false; }
    if (prefix === void 0) { prefix = null; }
    var secret;
    if (internalState.secrets.hasOwnProperty(key)) {
        secret = internalState.secrets[key];
        if (secret.indexOf(prefix) !== 0) ;
    }
    else {
        var rand = "";
        if (includeLetters) {
            rand = randomText(len, includeDigits);
        }
        else if (includeDigits) {
            for (var i = 0; i < len; i++) {
                rand += randomInteger(0, 9).toString();
            }
        }
        if (prefix) {
            secret = prefix + rand;
        }
        else {
            secret = rand;
        }
        internalState.secrets[key] = secret;
    }
    return secret;
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var observableListMarkerField = createSecret('ObservableList.markerField', 3, false, true, "_oL");
var ObservableListMethods = /** @class */ (function () {
    function ObservableListMethods() {
    }
    /**
     * Add an item and raise the list changed event.
     * @param item The item to add
     */
    ObservableListMethods.add = function (list, item) {
        var added = [item];
        var newLength = Array.prototype.push.apply(list, added);
        var addedIndex = newLength - 1;
        list._changedEvent.dispatch(list, { added: added, addedIndex: addedIndex, removed: [], removedIndex: -1 });
    };
    /**
     * Remove an item and raise the list changed event.
     * @param item The item to remove
     * @returns True if removed, otherwise false.
     */
    ObservableListMethods.remove = function (list, item) {
        var removedIndex = Array.prototype.indexOf.call(list, item);
        if (removedIndex !== -1) {
            var removed = Array.prototype.splice.call(list, removedIndex, 1);
            list._changedEvent.dispatch(list, { added: [], addedIndex: -1, removed: removed, removedIndex: removedIndex });
            return true;
        }
    };
    return ObservableListMethods;
}());
var ObservableList = /** @class */ (function (_super) {
    __extends(ObservableList, _super);
    /**
     * Creates a new observable list
     * @param items The array of initial items
     */
    function ObservableList(items) {
        if (items === void 0) { items = null; }
        return _super.apply(this, items) || this;
    }
    ObservableList.isObservableList = function (array) {
        return Object.prototype.hasOwnProperty.call(array, observableListMarkerField) && array[observableListMarkerField] === true;
    };
    ObservableList._markObservable = function (target) {
        Object.defineProperty(target, observableListMarkerField, {
            configurable: false,
            enumerable: false,
            value: true,
            writable: false
        });
    };
    ObservableList.ensureObservable = function (array) {
        // Check to see if the array is already an observable list
        if (this.isObservableList(array)) {
            var implementation = array;
            return implementation;
        }
        return ObservableListImplementation.implementObservableList(array);
    };
    ObservableList.create = function (items) {
        if (items === void 0) { items = null; }
        var implementation = new ObservableListImplementation(items);
        var list = ObservableListImplementation.ensureObservable(implementation);
        return list;
    };
    return ObservableList;
}(Array));
var ObservableListImplementation = /** @class */ (function (_super) {
    __extends(ObservableListImplementation, _super);
    /**
     * Creates a new observable list
     * @param items The array of initial items
     */
    function ObservableListImplementation(items) {
        if (items === void 0) { items = null; }
        var _this = _super.call(this, items) || this;
        ObservableListImplementation._initFields(_this);
        ObservableList._markObservable(_this);
        return _this;
    }
    ObservableListImplementation._initFields = function (target, changedEvent) {
        if (changedEvent === void 0) { changedEvent = null; }
        if (changedEvent == null) {
            changedEvent = new dist_1$1();
        }
        // Define the `_changedEvent` readonly property
        Object.defineProperty(target, "_changedEvent", {
            configurable: false,
            enumerable: false,
            value: changedEvent,
            writable: false
        });
    };
    ObservableListImplementation.implementObservableList = function (array) {
        ObservableListImplementation._initFields(array);
        array["add"] = (function (item) { ObservableListMethods.add(this, item); });
        array["remove"] = (function (item) { return ObservableListMethods.remove(this, item); });
        Object.defineProperty(array, 'changed', {
            get: function () {
                return this._changedEvent.asEvent();
            }
        });
        ObservableListImplementation._markObservable(array);
        return array;
    };
    /**
     * Add an item and raise the list changed event.
     * @param item The item to add
     */
    ObservableListImplementation.prototype.add = function (item) {
        ObservableListMethods.add(this, item);
    };
    /**
     * Removes the specified item from the list.
     * @param item The item to remove.
     * @returns True if removed, otherwise false.
     */
    ObservableListImplementation.prototype.remove = function (item) {
        return ObservableListMethods.remove(this, item);
    };
    Object.defineProperty(ObservableListImplementation.prototype, "changed", {
        /** Expose the changed event */
        get: function () {
            return this._changedEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    return ObservableListImplementation;
}(ObservableList));

function Functor$create(functions, returns) {
    if (functions === void 0) { functions = null; }
    if (returns === void 0) { returns = false; }
    var funcs = [];
    if (functions) {
        Array.prototype.push.apply(funcs, functions.map(function (f) { return FunctorItem$new(f); }));
    }
    function Functor$fn() {
        var returnsArray;
        if (returns) {
            returnsArray = [];
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
                var returnValue = item.fn.apply(this, arguments);
                returnsArray.push(returnValue);
            }
        }
        if (returns) {
            return returnsArray;
        }
    }
    var f = Functor$fn;
    f._funcs = funcs;
    f.add = Functor$add;
    f.remove = Functor$remove;
    f.isEmpty = Functor$isEmpty;
    f.clear = Functor$clear;
    return f;
}
function FunctorItem$new(fn, filter, once) {
    if (filter === void 0) { filter = null; }
    if (once === void 0) { once = false; }
    var item = { fn: fn };
    if (filter != null) {
        item.filter = filter;
    }
    if (once != null) {
        item.once = once;
    }
    return item;
}
function Functor$add(fn, filter, once) {
    if (filter === void 0) { filter = null; }
    if (once === void 0) { once = false; }
    var item = FunctorItem$new(fn, filter, once);
    this._funcs.push(item);
}
function Functor$remove(fn) {
    for (var i = this._funcs.length - 1; i >= 0; --i) {
        if (this._funcs[i].fn === fn) {
            this._funcs.splice(i, 1);
            return true;
        }
    }
    return false;
}
function Functor$isEmpty(args) {
    if (args === void 0) { args = null; }
    return !this._funcs.some(function (item) { return item.applied !== true && (!args || !item.filter || item.filter.apply(this, args)); }, this);
}
function Functor$clear() {
    this._funcs.length = 0;
}

var pendingSignalTimeouts = null;
var signalMaxBatchSize = null;
var signalTimeout = false;
var Signal = /** @class */ (function () {
    function Signal(label) {
        // Public read-only properties
        Object.defineProperty(this, "label", { enumerable: true, value: label });
        // Backing fields for properties
        Object.defineProperty(this, "_waitForAll", { enumerable: false, value: [], writable: true });
        Object.defineProperty(this, "_pending", { enumerable: false, value: 0, writable: true });
    }
    Object.defineProperty(Signal.prototype, "isActive", {
        get: function () {
            return this._pending > 0;
        },
        enumerable: true,
        configurable: true
    });
    Signal.prototype.pending = function (callback, thisPtr, executeImmediately) {
        if (thisPtr === void 0) { thisPtr = null; }
        if (executeImmediately === void 0) { executeImmediately = null; }
        var result = generateSignalPendingCallback(this, callback, thisPtr, executeImmediately);
        this._pending++;
        return result;
    };
    Signal.prototype.waitForAll = function (callback, thisPtr, executeImmediately, args) {
        if (thisPtr === void 0) { thisPtr = null; }
        if (executeImmediately === void 0) { executeImmediately = null; }
        if (args === void 0) { args = null; }
        if (!callback) {
            return;
        }
        if (this._pending === 0) {
            doSignalCallback("waitForAll", thisPtr, callback, args, executeImmediately);
        }
        else {
            this._waitForAll.push({ callback: callback, thisPtr: thisPtr, executeImmediately: executeImmediately, args: args });
        }
    };
    Signal.prototype.decrement = function () {
        --this._pending;
        while (this._pending === 0 && this._waitForAll.length > 0) {
            var item = this._waitForAll.shift();
            doSignalCallback("waitForAll", item.thisPtr, item.callback, item.args, item.executeImmediately);
        }
    };
    return Signal;
}());
var setupCallbacks = function setupCallbacks(thisPtr, args) {
    if (args === void 0) { args = null; }
    window.setTimeout(function () {
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
        callbacks.forEach(function (arg) { return arg.apply(thisPtr, args); });
    }, 1);
};
function doSignalCallback(name, thisPtr, callback, args, executeImmediately) {
    if (args === void 0) { args = null; }
    if (executeImmediately === void 0) { executeImmediately = null; }
    if (executeImmediately === false || (signalTimeout === true)) {
        // manage a queue of callbacks to ensure the order of execution
        var setup = false;
        if (pendingSignalTimeouts === null) {
            pendingSignalTimeouts = [];
            setup = true;
        }
        pendingSignalTimeouts.push(function () {
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
function generateSignalPendingCallback(signal, callback, thisPtr, executeImmediately) {
    if (thisPtr === void 0) { thisPtr = null; }
    if (executeImmediately === void 0) { executeImmediately = null; }
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
            if (callback)
                callback.apply(this, arguments);
            // Signal that the callback is complete
            signal.decrement();
        }, arguments.length > 0 ? Array.prototype.slice.call(arguments) : null, executeImmediately);
    };
}

var PropertyChainEventDispatchers = /** @class */ (function () {
    function PropertyChainEventDispatchers() {
        this.changedEvent = new dist_1$1();
        this.accessedEvent = new dist_1$1();
    }
    return PropertyChainEventDispatchers;
}());
/**
 * Encapsulates the logic required to work with a chain of properties and
 * a root object, allowing interaction with the chain as if it were a
 * single property of the root object.
 */
var PropertyChain = /** @class */ (function () {
    function PropertyChain(rootType, properties, filters) {
        // Public read-only properties
        Object.defineProperty(this, "rootType", { enumerable: true, value: rootType });
        // Backing fields for properties
        Object.defineProperty(this, "_properties", { value: properties });
        Object.defineProperty(this, "_propertyFilters", { value: filters || new Array(properties.length) });
        Object.defineProperty(this, "_propertyAccessSubscriptions", { value: [] });
        Object.defineProperty(this, "_propertyChangeSubscriptions", { value: [] });
        Object.defineProperty(this, "_eventDispatchers", { value: new PropertyChainEventDispatchers() });
    }
    Object.defineProperty(PropertyChain.prototype, "changedEvent", {
        get: function () {
            return this._eventDispatchers.changedEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "accessedEvent", {
        get: function () {
            return this._eventDispatchers.accessedEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    PropertyChain.prototype.equals = function (prop) {
        if (prop === null || prop === undefined) {
            return;
        }
        if (Property$isProperty(prop)) {
            return this._properties.length === 1 && this._properties[0] === prop;
        }
        if (prop instanceof PropertyChain) {
            if (prop._properties.length !== this._properties.length) {
                return false;
            }
            for (var i = 0; i < this._properties.length; i++) {
                if (!this._properties[i].equals(prop._properties[i])) {
                    return false;
                }
            }
            return true;
        }
    };
    /**
     * Iterates over all objects along a property chain starting with the root object (obj).
     * This is analogous to the Array forEach function. The callback may return a Boolean
     * value to indicate whether or not to continue iterating.
     * @param obj The root object (of type `IEntity`) to use in iterating over the chain.
     * @param callback The function to invoke at each iteration step.  May return a Boolean value to indicate whether or not to continue iterating.
     * @param thisPtr Optional object to use as the `this` pointer when invoking the callback.
     * @param propFilter An optional property filter, if specified, only iterates over the results of this property.
     */
    PropertyChain.prototype.forEach = function (obj, callback, thisPtr, propFilter /*, target: IEntity, p: number, lastProp: IProperty */) {
        /// <summary>
        /// </summary>
        if (thisPtr === void 0) { thisPtr = null; }
        if (propFilter === void 0) { propFilter = null; }
        if (obj == null)
            throw new Error("Argument 'obj' cannot be null or undefined.");
        if (callback == null)
            throw new Error("Argument 'callback' cannot be null or undefined.");
        if (typeof (callback) != "function")
            throw new Error("Argument 'callback' must be of type function: " + callback + ".");
        // invoke callback on obj first
        var target = arguments[4] || obj;
        var lastProp = arguments[6] || null;
        var props = this._properties.slice(arguments[5] || 0);
        for (var p = arguments[5] || 0; p < this._properties.length; p++) {
            var prop = this._properties[p];
            var isLastProperty = p === this._properties.length - 1;
            var canSkipRemainingProps = isLastProperty || (propFilter && lastProp === propFilter);
            var enableCallback = (!propFilter || lastProp === propFilter);
            if (target instanceof Array) {
                // if the target is a list, invoke the callback once per item in the list
                for (var i = 0; i < target.length; ++i) {
                    // take into account any any chain filters along the way
                    if (!this._propertyFilters || !this._propertyFilters[p] || this._propertyFilters[p](target[i])) {
                        if (enableCallback && callback.call(thisPtr || this, target[i], i, target, prop, p, props) === false) {
                            return false;
                        }
                        if (!canSkipRemainingProps) {
                            var targetValue = prop.value(target[i]);
                            // continue along the chain for this list item
                            if (!targetValue || PropertyChain.prototype.forEach.call(this, obj, callback, thisPtr, propFilter, targetValue, p + 1, prop) === false) {
                                return false;
                            }
                        }
                    }
                }
                // subsequent properties already visited in preceding loop
                return true;
            }
            else {
                // return early if the target is filtered and does not match
                if (this._propertyFilters && this._propertyFilters[p] && this._propertyFilters[p](target) === false) {
                    break;
                }
                // take into account any chain filters along the way
                if (enableCallback && callback.call(thisPtr || this, target, -1, null, prop, p, props) === false) {
                    return false;
                }
            }
            // if a property filter is used and was just evaluated, stop early
            if (canSkipRemainingProps) {
                break;
            }
            // move to next property in the chain
            target = target[prop.fieldName];
            // break early if the target is undefined
            if (target === undefined || target === null) {
                break;
            }
            lastProp = prop;
        }
        return true;
    };
    Object.defineProperty(PropertyChain.prototype, "path", {
        get: function () {
            if (!this._path) {
                var path = getPropertyChainPathFromIndex(this, 0);
                Object.defineProperty(this, "_path", { enumerable: false, value: path, writable: true });
            }
            return this._path;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "firstProperty", {
        get: function () {
            return this._properties[0];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "lastProperty", {
        get: function () {
            return this._properties[this._properties.length - 1];
        },
        enumerable: true,
        configurable: true
    });
    PropertyChain.prototype.toPropertyArray = function () {
        return this._properties.slice();
    };
    PropertyChain.prototype.getLastTarget = function (obj) {
        for (var p = 0; p < this._properties.length - 1; p++) {
            var prop = this._properties[p];
            // exit early on null or undefined
            if (obj === undefined || obj === null) {
                return obj;
            }
            obj = prop.value(obj);
        }
        return obj;
    };
    PropertyChain.prototype.append = function (prop) {
        // TODO: Validate that the property or property chain is valid to append?
        var newProps = this._properties.slice();
        var newFilters = this._propertyFilters ? this._propertyFilters.slice() : new Array(this._properties.length);
        if (Property$isProperty(prop)) {
            newProps.push(prop);
            newFilters.push(null);
        }
        else if (prop instanceof PropertyChain) {
            Array.prototype.push.apply(newProps, prop._properties);
            Array.prototype.push.apply(newFilters, prop._propertyFilters || new Array(prop._properties.length));
        }
        else {
            throw new Error("Method `IPropertyChain.append(prop)` expects an argument of type `IProperty` or `IPropertyChain`.");
        }
        return new PropertyChain(this.rootType, newProps, newFilters);
    };
    PropertyChain.prototype.prepend = function (prop) {
        // TODO: Validate that the property or property chain is valid to prepend?
        var newProps;
        var newRootType;
        var newFilters;
        if (Property$isProperty(prop)) {
            newProps = this._properties.slice();
            newFilters = this._propertyFilters.slice();
            newRootType = prop.containingType;
            newProps.splice(0, 0, prop);
            newFilters.splice(0, 0, null);
        }
        else if (prop instanceof PropertyChain) {
            newProps = this._properties.slice();
            newFilters = this._propertyFilters.slice();
            newRootType = prop._properties[0].containingType;
            var noRemovalSpliceArgs = [0, 0];
            Array.prototype.splice.apply(newProps, noRemovalSpliceArgs.concat(prop._properties));
            Array.prototype.splice.apply(newFilters, noRemovalSpliceArgs.concat(prop._propertyFilters || new Array(prop._properties.length)));
        }
        else {
            throw new Error("Method `IPropertyChain.prepend(prop)` expects an argument of type `IProperty` or `IPropertyChain`.");
        }
        return new PropertyChain(newRootType, newProps, newFilters);
    };
    PropertyChain.prototype.canSetValue = function (obj, value) {
        return this.lastProperty.canSetValue(this.getLastTarget(obj), value);
    };
    // Determines if this property chain connects two objects.
    PropertyChain.prototype.testConnection = function (fromRoot, toObj, viaProperty) {
        var connected = false;
        // perform simple comparison if no property is defined
        if (!viaProperty) {
            return fromRoot === toObj;
        }
        this.forEach(fromRoot, function (target) {
            if (target === toObj) {
                connected = true;
                return false;
            }
        }, this, viaProperty);
        return connected;
    };
    PropertyChain.prototype.getRootedPath = function (rootType) {
        for (var i = 0; i < this._properties.length; i++) {
            if (rootType.hasModelProperty(this._properties[i])) {
                var path = getPropertyChainPathFromIndex(this, i);
                return this._properties[i].isStatic ? this._properties[i].containingType.fullName + "." + path : path;
            }
        }
    };
    Object.defineProperty(PropertyChain.prototype, "containingType", {
        // TODO: is this needed?
        // starts listening for the get event of the last property in the chain on any known instances. Use obj argument to
        // optionally filter the events to a specific object
        // addGet(handler, obj): IEventHandler<IPropertyChain, PropertyAccessEventArgs> {
        // 	var chain = this;
        // 	this.lastProperty().addGet(function PropertyChain$_raiseGet(sender, property, value, isInited) {
        // 		handler(sender, chain, value, isInited);
        // 	}, obj);
        // 	// Return the property to support method chaining
        // 	return this;
        // }
        get: function () {
            return this.rootType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "propertyType", {
        get: function () {
            return this.lastProperty.propertyType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "format", {
        get: function () {
            return this.lastProperty.format;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "isList", {
        get: function () {
            return this.lastProperty.isList;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "isStatic", {
        get: function () {
            // TODO
            return this.lastProperty.isStatic;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "label", {
        get: function () {
            return this.lastProperty.label;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "helptext", {
        get: function () {
            return this.lastProperty.helptext;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "name", {
        get: function () {
            return this.lastProperty.name;
        },
        enumerable: true,
        configurable: true
    });
    // rules(filter) {
    // 	return this.lastProperty().rules(filter);
    // }
    PropertyChain.prototype.value = function (obj, val, additionalArgs) {
        if (obj === void 0) { obj = null; }
        if (val === void 0) { val = null; }
        if (additionalArgs === void 0) { additionalArgs = null; }
        var lastTarget = this.getLastTarget(obj);
        var lastProp = this.lastProperty;
        if (arguments.length > 1) {
            lastProp.value(lastTarget, val, additionalArgs);
        }
        else if (lastTarget) {
            return lastProp.value(lastTarget);
        }
    };
    /**
     * Determines if the property chain is initialized, akin to single IProperty initialization.
     * @param obj The root object
     * @param enforceCompleteness Whether or not the chain must be complete in order to be considered initialized
     */
    PropertyChain.prototype.isInited = function (obj, enforceCompleteness /*, fromIndex: number, fromProp: IProperty */) {
        if (enforceCompleteness === void 0) { enforceCompleteness = false; }
        var allInited = true, initedProperties = [], fromIndex = arguments[2] || 0, fromProp = arguments[3] || null, expectedProps = this._properties.length - fromIndex;
        PropertyChain.prototype.forEach.call(this, obj, function (target, targetIndex, targetArray, property, propertyIndex, properties) {
            if (targetArray && enforceCompleteness) {
                if (targetArray.every(function (item) { return this.isInited(item, true, propertyIndex, properties[propertyIndex - 1]); }, this)) {
                    Array.prototype.push.apply(initedProperties, properties.slice(propertyIndex));
                }
                else {
                    allInited = false;
                }
                // Stop iterating at an array value
                return false;
            }
            else {
                if (!property.isInited(target)) {
                    allInited = false;
                    // Exit immediately since chain is not inited
                    return false;
                }
                else if (!targetArray || targetIndex === 0) {
                    initedProperties.push(property);
                }
            }
        }, this, null, obj, fromIndex, fromProp);
        return allInited && (!enforceCompleteness || initedProperties.length === expectedProps);
    };
    PropertyChain.prototype.toString = function () {
        if (this.isStatic) {
            return this.path;
        }
        else {
            var path = this._properties.map(function (e) { return e.name; }).join(".");
            return "this<" + this.containingType + ">." + path;
        }
    };
    return PropertyChain;
}());
function PropertyChain$isPropertyChain(obj) {
    return obj instanceof PropertyChain;
}
function PropertyChain$_getEventDispatchers(chain) {
    return chain._eventDispatchers;
}
function PropertyChain$create(rootType, pathTokens /*, forceLoadTypes: boolean, success: Function, fail: Function */) {
    /// <summary>
    /// Attempts to synchronously or asynchronously create a property chain for the specified 
    /// root type and path.  Also handles caching of property chains at the type level.
    /// </summary>
    var type = rootType;
    var properties = [];
    var filters = [];
    var filterTypes = [];
    // initialize optional callback arguments
    var forceLoadTypes = arguments.length >= 3 && arguments[2] && arguments[2].constructor === Boolean ? arguments[2] : false;
    var success = arguments.length >= 4 && arguments[3] && arguments[3] instanceof Function ? arguments[3] : null;
    var fail = arguments.length >= 5 && arguments[4] && arguments[4] instanceof Function ?
        arguments[4] : function (error) { if (success) {
        throw new Error(error);
    } };
    // process each step in the path either synchronously or asynchronously depending on arguments
    var processStep = function PropertyChain$processStep() {
        // get the next step
        var step = pathTokens.steps.shift();
        if (!step) {
            fail("Syntax error in property path: " + pathTokens.expression);
            // return null to indicate that the path is not valid
            return null;
        }
        // get the property for the step 
        var prop = type.getProperty(step.property);
        if (!prop) {
            fail("Path '" + pathTokens.expression + "' references an unknown property: \"" + type.fullName + "." + step.property + "\".");
            // return null if the property does not exist
            return null;
        }
        // ensure the property is not static because property chains are not valid for static properties
        if (prop.isStatic) {
            fail("Path '" + pathTokens.expression + "' references a static property: \"" + type.fullName + "." + step.property + "\".");
            // return null to indicate that the path references a static property
            return null;
        }
        // store the property for the step
        properties.push(prop);
        // handle optional type filters
        if (step.cast) {
            // determine the filter type
            type = Model$getJsType(step.cast, true).meta;
            if (!type) {
                fail("Path '" + pathTokens.expression + "' references an invalid type: \"" + step.cast + "\".");
                return null;
            }
            var ctor = type.ctor;
            filterTypes[properties.length] = ctor;
            filters[properties.length] = function (target) {
                return target instanceof ctor;
            };
        }
        else {
            type = prop.propertyType.meta;
        }
        // process the next step if not at the end of the path
        if (pathTokens.steps.length > 0) {
            return Model$whenTypeAvailable(type, forceLoadTypes, processStep);
        }
        // otherwise, create and return the new property chain
        else {
            // processing the path is complete, verify that chain is not zero-length
            if (properties.length === 0) {
                fail("IPropertyChain cannot be zero-length.");
                return null;
            }
            // ensure filter types on the last step are loaded
            var filterTypeSignal = new Signal("filterType");
            var filterType = filterTypes[properties.length - 1];
            if (filterType) {
                Model$whenTypeAvailable(filterType.meta, forceLoadTypes, filterTypeSignal.pending(null, null, true));
            }
            var ret;
            filterTypeSignal.waitForAll(function () {
                // create and cache the new property chain
                var chain = new PropertyChain(rootType, properties, filters);
                /*
                // TODO: Implement property chain caching?
                if (!rootType._chains) {
                    rootType._chains = {};
                }
                rootType._chains[pathTokens.expression] = chain;
                */
                // if asynchronous processing was allowed, invoke the success callback
                if (success) {
                    success(chain);
                }
                // return the new property chain
                ret = chain;
            }, null, true);
            return ret;
        }
    };
    // begin processing steps in the path
    return Model$whenTypeAvailable(type, forceLoadTypes, processStep);
}
function getPropertyChainPathFromIndex(chain, startIndex) {
    var steps = [];
    var props = chain.toPropertyArray();
    if (props[startIndex].isStatic) {
        steps.push(props[startIndex].containingType.fullName);
    }
    var previousStepType;
    props.slice(startIndex).forEach(function (p, i) {
        if (i !== 0) {
            if (p.containingType !== previousStepType && p.containingType.isSubclassOf(previousStepType)) {
                steps[steps.length - 1] = steps[steps.length - 1] + "<" + p.containingType.fullName + ">";
            }
        }
        steps.push(p.name);
        previousStepType = p.propertyType.meta;
    });
    return steps.join(".");
}
function onPropertyChainStepAccessed(chain, priorProp, sender, args) {
    // scan all known objects of this type and raise event for any instance connected
    // to the one that sent the event.
    chain.rootType.known().forEach(function (known) {
        if (chain.testConnection(known, sender, priorProp)) {
            // Copy the original arguments so that we don't affect other code
            var newArgs = {
                property: args.property,
                value: args.value,
            };
            // Reset property to be the chain, but store the original property as "triggeredBy"
            newArgs.originalSender = sender;
            newArgs.triggeredBy = newArgs.property;
            newArgs.property = chain;
            // Call the handler, passing through the arguments
            PropertyChain$_getEventDispatchers(chain).accessedEvent.dispatch(known, newArgs);
        }
    });
}
function updatePropertyAccessSubscriptions(chain, props, subscriptions) {
    var chainEventSubscriptions = getEventSubscriptions(PropertyChain$_getEventDispatchers(chain).accessedEvent);
    var chainEventSubscriptionsExist = chainEventSubscriptions && chainEventSubscriptions.length > 0;
    var subscribedToPropertyChanges = subscriptions !== null && subscriptions.length > 0;
    if (!chainEventSubscriptionsExist && subscribedToPropertyChanges) {
        // If there are no more subscribers then unsubscribe from property-level events
        props.forEach(function (prop, index) { return subscriptions[index].unsubscribe(); });
        subscriptions.length = 0;
    }
    if (chainEventSubscriptionsExist && !subscribedToPropertyChanges) {
        // If there are subscribers and we have not subscribed to property-level events, then do so
        subscriptions.length = 0;
        props.forEach(function (prop, index) {
            var priorProp = (index === 0) ? undefined : props[index - 1];
            var handler = function (sender, args) { return onPropertyChainStepAccessed(chain, priorProp, sender, args); };
            var unsubscribe = Property$_getEventDispatchers(prop).accessedEvent.subscribe(handler);
            subscriptions.push({ handler: handler, unsubscribe: unsubscribe });
        }, chain);
    }
}
function PropertyChain$_addAccessedHandler(chain, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    var propertyAccessFilters = Functor$create(null, true);
    if (obj) {
        propertyAccessFilters.add(function (sender) { return sender === obj; });
    }
    // TODO: Implement partial access tolerance if implementing lazy loading...
    propertyAccessFilters.add(function (sender) { return chain.isInited(sender, true); });
    updatePropertyAccessSubscriptions(chain, chain._properties, chain._propertyAccessSubscriptions);
    return PropertyChain$_getEventDispatchers(chain).accessedEvent.subscribe(function (sender, args) {
        var filterResults = propertyAccessFilters(sender);
        if (!filterResults.some(function (b) { return !b; })) {
            handler(sender, args);
        }
    });
}
function onPropertyChainStepChanged(chain, priorProp, sender, args) {
    // scan all known objects of this type and raise event for any instance connected
    // to the one that sent the event.
    chain.rootType.known().forEach(function (known) {
        if (chain.testConnection(known, sender, priorProp)) {
            // Copy the original arguments so that we don't affect other code
            var newArgs = {
                property: args.property,
                oldValue: args.oldValue,
                newValue: args.newValue,
            };
            // Reset property to be the chain, but store the original property as "triggeredBy"
            newArgs.originalSender = sender;
            newArgs.triggeredBy = newArgs.property;
            newArgs.property = chain;
            // Call the handler, passing through the arguments
            PropertyChain$_getEventDispatchers(chain).changedEvent.dispatch(known, newArgs);
        }
    });
}
function updatePropertyChangeSubscriptions(chain, props, subscriptions) {
    if (props === void 0) { props = null; }
    var chainEventSubscriptions = getEventSubscriptions(PropertyChain$_getEventDispatchers(chain).changedEvent);
    var chainEventSubscriptionsExist = chainEventSubscriptions && chainEventSubscriptions.length > 0;
    var subscribedToPropertyChanges = subscriptions !== null && subscriptions.length > 0;
    if (!chainEventSubscriptionsExist && subscribedToPropertyChanges) {
        // If there are no more subscribers then unsubscribe from property-level events
        props.forEach(function (prop, index) { return subscriptions[index].unsubscribe(); });
        subscriptions.length = 0;
    }
    if (chainEventSubscriptionsExist && !subscribedToPropertyChanges) {
        // If there are subscribers and we have not subscribed to property-level events, then do so
        subscriptions.length = 0;
        props.forEach(function (prop, index) {
            var priorProp = (index === 0) ? undefined : props[index - 1];
            var handler = function (sender, args) { return onPropertyChainStepChanged(chain, priorProp, sender, args); };
            var unsubscribe = prop.changedEvent.subscribe(handler);
            subscriptions.push({ handler: handler, unsubscribe: unsubscribe });
        }, chain);
    }
}
// starts listening for change events along the property chain on any known instances. Use obj argument to
// optionally filter the events to a specific object
function PropertyChain$_addChangedHandler(chain, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    var propertyChangeFilters = Functor$create(null, true);
    if (obj) {
        propertyChangeFilters.add(function (sender) { return sender === obj; });
    }
    /*
    // TODO: Implement partial access tolerance if implementing lazy loading...
    // Ensure that the chain is inited from the root if toleratePartial is false
    if (toleratePartial) {
        propertyEventFilters.add(function (sender, args) {
            var allCanBeAccessed = true;
            chain.forEach(sender, function (target, targetIndex, targetArray, property, propertyIndex, properties) {
                if (!property.isInited(target)) {
                    var propertyGetWouldCauseError = false;
                    if (LazyLoader.isRegistered(target)) {
                        propertyGetWouldCauseError = true;
                    } else if (property.isList) {
                        var list = target[property._fieldName];
                        if (list && LazyLoader.isRegistered(list)) {
                            propertyGetWouldCauseError = true;
                        }
                    }

                    if (propertyGetWouldCauseError) {
                        allCanBeAccessed = false;

                        // Exit immediately
                        return false;
                    }
                }
            });
            return allCanBeAccessed;
        });
    } else {
        ...
    }
    */
    propertyChangeFilters.add(function (sender) { return chain.isInited(sender, true); });
    updatePropertyChangeSubscriptions(chain, chain._properties, chain._propertyChangeSubscriptions);
    return PropertyChain$_getEventDispatchers(chain).changedEvent.subscribe(function (sender, args) {
        var filterResults = propertyChangeFilters(sender);
        if (!filterResults.some(function (b) { return !b; })) {
            handler(sender, args);
        }
    });
}

var EntityEventDispatchersImplementation = /** @class */ (function () {
    function EntityEventDispatchersImplementation() {
        this.accessedEvent = new dist_1$1();
        this.changedEvent = new dist_1$1();
    }
    return EntityEventDispatchersImplementation;
}());
var Entity = /** @class */ (function () {
    function Entity() {
        Object.defineProperty(this, "_eventDispatchers", { value: new EntityEventDispatchersImplementation() });
    }
    Object.defineProperty(Entity.prototype, "accessedEvent", {
        get: function () {
            return this._eventDispatchers.accessedEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Entity.prototype, "changedEvent", {
        get: function () {
            return this._eventDispatchers.changedEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Entity.prototype.init = function (property, value) {
        var properties;
        // Convert property/value pair to a property dictionary
        if (typeof property == "string") {
            properties = {};
            properties[property] = value;
        }
        else {
            properties = property;
        }
        // Initialize the specified properties
        for (var name in properties) {
            if (properties.hasOwnProperty(name)) {
                var prop = this.meta.type.getProperty(name);
                if (!prop)
                    throw new Error("Could not find property \"" + name + "\" on type \"" + this.meta.type.fullName + "\".");
                // Set the property
                prop.value(this, value);
            }
        }
    };
    Entity.prototype.set = function (property, value) {
        var properties;
        // Convert property/value pair to a property dictionary
        if (typeof property == "string") {
            properties = {};
            properties[property] = value;
        }
        else {
            properties = property;
        }
        // Set the specified properties
        for (var name in properties) {
            if (properties.hasOwnProperty(name)) {
                var prop = this.meta.type.getProperty(name);
                if (!prop)
                    throw new Error("Could not find property \"" + name + "\" on type \"" + this.meta.type.fullName + "\".");
                prop.value(this, value);
            }
        }
    };
    Entity.prototype.get = function (property) {
        return this.meta.type.getProperty(property).value(this);
    };
    Entity.prototype.toString = function (format) {
        return Entity$toIdString(this);
    };
    return Entity;
}());
// Gets the typed string id suitable for roundtripping via fromIdString
function Entity$toIdString(obj) {
    return obj.meta.type.fullName + "|" + obj.meta.id;
}
function Entity$_getEventDispatchers(prop) {
    return prop._eventDispatchers;
}

var RuleInvocationType;
(function (RuleInvocationType) {
    /** Occurs when an existing instance is initialized.*/
    RuleInvocationType[RuleInvocationType["InitExisting"] = 2] = "InitExisting";
    /** Occurs when a new instance is initialized. */
    RuleInvocationType[RuleInvocationType["InitNew"] = 4] = "InitNew";
    /** Occurs when a property value is retrieved. */
    RuleInvocationType[RuleInvocationType["PropertyGet"] = 8] = "PropertyGet";
    /** Occurs when a property value is changed. */
    RuleInvocationType[RuleInvocationType["PropertyChanged"] = 16] = "PropertyChanged";
})(RuleInvocationType || (RuleInvocationType = {}));

var EventScope$current = null;
// TODO: Make `nonExitingScopeNestingCount` an editable configuration value
// Controls the maximum number of times that a child event scope can transfer events
// to its parent while the parent scope is exiting. A large number indicates that
// rules are not reaching steady-state. Technically something other than rules could
// cause this scenario, but in practice they are the primary use-case for event scope. 
var nonExitingScopeNestingCount = 100;
var EventScopeEventDispatchers = /** @class */ (function () {
    function EventScopeEventDispatchers() {
        this.exitEvent = new dist_1$1();
        this.abortEvent = new dist_1$1();
    }
    return EventScopeEventDispatchers;
}());
var EventScope = /** @class */ (function () {
    function EventScope() {
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
    Object.defineProperty(EventScope.prototype, "isActive", {
        get: function () {
            return this._isActive;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EventScope.prototype, "exitEvent", {
        get: function () {
            return this._eventDispatchers.exitEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EventScope.prototype, "abortEvent", {
        get: function () {
            return this._eventDispatchers.abortEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    EventScope.prototype.abort = function (maxNestingExceeded) {
        if (maxNestingExceeded === void 0) { maxNestingExceeded = false; }
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
    };
    EventScope.prototype.exit = function () {
        var _this = this;
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
                }
                else {
                    // if (typeof ...config.nonExitingScopeNestingCount === "number") { ...
                    var maxNesting = nonExitingScopeNestingCount - 1;
                    if (this.parent.hasOwnProperty("_exitEventVersion") && this.parent._exitEventVersion >= maxNesting) {
                        this.abort(true);
                        // TODO: Warn... "Event scope 'exit' subscribers were discarded due to non-exiting."
                        return;
                    }
                    // Move subscribers to the parent scope
                    exitSubscriptions.forEach(function (sub) {
                        if (!sub.isOnce || !sub.isExecuted) {
                            _this.parent._eventDispatchers.exitEvent.subscribe(sub.handler);
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
    };
    return EventScope;
}());
function EventScope$onExit(callback, thisPtr) {
    if (thisPtr === void 0) { thisPtr = null; }
    if (EventScope$current === null) {
        // Immediately invoke the callback
        if (thisPtr) {
            callback.call(thisPtr);
        }
        else {
            callback();
        }
    }
    else if (!EventScope$current.isActive) {
        throw new Error("The current event scope cannot be inactive.");
    }
    else {
        // Subscribe to the exit event
        EventScope$current._eventDispatchers.exitEvent.subscribe(callback.bind(thisPtr));
    }
}
function EventScope$onAbort(callback, thisPtr) {
    if (thisPtr === void 0) { thisPtr = null; }
    if (EventScope$current !== null) {
        if (!EventScope$current.isActive) {
            throw new Error("The current event scope cannot be inactive.");
        }
        // Subscribe to the abort event
        EventScope$current._eventDispatchers.abortEvent.subscribe(callback.bind(thisPtr));
    }
}
function EventScope$perform(callback, thisPtr) {
    if (thisPtr === void 0) { thisPtr = null; }
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

var PathTokens = /** @class */ (function () {
    function PathTokens(expression) {
        this.expression = expression;
        // replace "." in type casts so that they do not interfere with splitting path
        expression = expression.replace(/<[^>]*>/ig, function (e) { return e.replace(/\./ig, function () { return "$_$"; }); });
        if (expression.length > 0) {
            this.steps = expression.split(".").map(function (step) {
                // Regex pattern matches all letters and digits that are valid for javascript identifiers, including  "_"
                var parsed = step.match(/^([_0-9a-zA-Z\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02b8\u02bb-\u02c1\u02d0-\u02d1\u02e0-\u02e4\u02ee\u0370-\u0373\u0376-\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0523\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0621-\u064a\u0660-\u0669\u066e-\u066f\u0671-\u06d3\u06d5\u06e5-\u06e6\u06ee-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07c0-\u07ea\u07f4-\u07f5\u07fa\u0904-\u0939\u093d\u0950\u0958-\u0961\u0966-\u096f\u0971-\u0972\u097b-\u097f\u0985-\u098c\u098f-\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc-\u09dd\u09df-\u09e1\u09e6-\u09f1\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a59-\u0a5c\u0a5e\u0a66-\u0a6f\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2-\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0-\u0ae1\u0ae6-\u0aef\u0b05-\u0b0c\u0b0f-\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3d\u0b5c-\u0b5d\u0b5f-\u0b61\u0b66-\u0b6f\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0be6-\u0bef\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58-\u0c59\u0c60-\u0c61\u0c66-\u0c6f\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0-\u0ce1\u0ce6-\u0cef\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d28\u0d2a-\u0d39\u0d3d\u0d60-\u0d61\u0d66-\u0d6f\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32-\u0e33\u0e40-\u0e46\u0e50-\u0e59\u0e81-\u0e82\u0e84\u0e87-\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa-\u0eab\u0ead-\u0eb0\u0eb2-\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0ed0-\u0ed9\u0edc-\u0edd\u0f00\u0f20-\u0f29\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8b\u1000-\u102a\u103f-\u1049\u1050-\u1055\u105a-\u105d\u1061\u1065-\u1066\u106e-\u1070\u1075-\u1081\u108e\u1090-\u1099\u10a0-\u10c5\u10d0-\u10fa\u10fc\u1100-\u1159\u115f-\u11a2\u11a8-\u11f9\u1200-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u1676\u1681-\u169a\u16a0-\u16ea\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u17e0-\u17e9\u1810-\u1819\u1820-\u1877\u1880-\u18a8\u18aa\u1900-\u191c\u1946-\u196d\u1970-\u1974\u1980-\u19a9\u19c1-\u19c7\u19d0-\u19d9\u1a00-\u1a16\u1b05-\u1b33\u1b45-\u1b4b\u1b50-\u1b59\u1b83-\u1ba0\u1bae-\u1bb9\u1c00-\u1c23\u1c40-\u1c49\u1c4d-\u1c7d\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u2094\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2183-\u2184\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2c6f\u2c71-\u2c7d\u2c80-\u2ce4\u2d00-\u2d25\u2d30-\u2d65\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3006\u3031-\u3035\u303b-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31b7\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fc3\ua000-\ua48c\ua500-\ua60c\ua610-\ua62b\ua640-\ua65f\ua662-\ua66e\ua680-\ua697\ua722-\ua788\ua78b-\ua78c\ua7fb-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8d0-\ua8d9\ua900-\ua925\ua930-\ua946\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa50-\uaa59\uac00-\ud7a3\uf900-\ufa2d\ufa30-\ufa6a\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]+)(<([_$0-9a-zA-Z\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02b8\u02bb-\u02c1\u02d0-\u02d1\u02e0-\u02e4\u02ee\u0370-\u0373\u0376-\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0523\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0621-\u064a\u0660-\u0669\u066e-\u066f\u0671-\u06d3\u06d5\u06e5-\u06e6\u06ee-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07c0-\u07ea\u07f4-\u07f5\u07fa\u0904-\u0939\u093d\u0950\u0958-\u0961\u0966-\u096f\u0971-\u0972\u097b-\u097f\u0985-\u098c\u098f-\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc-\u09dd\u09df-\u09e1\u09e6-\u09f1\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a59-\u0a5c\u0a5e\u0a66-\u0a6f\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2-\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0-\u0ae1\u0ae6-\u0aef\u0b05-\u0b0c\u0b0f-\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3d\u0b5c-\u0b5d\u0b5f-\u0b61\u0b66-\u0b6f\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0be6-\u0bef\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58-\u0c59\u0c60-\u0c61\u0c66-\u0c6f\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0-\u0ce1\u0ce6-\u0cef\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d28\u0d2a-\u0d39\u0d3d\u0d60-\u0d61\u0d66-\u0d6f\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32-\u0e33\u0e40-\u0e46\u0e50-\u0e59\u0e81-\u0e82\u0e84\u0e87-\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa-\u0eab\u0ead-\u0eb0\u0eb2-\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0ed0-\u0ed9\u0edc-\u0edd\u0f00\u0f20-\u0f29\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8b\u1000-\u102a\u103f-\u1049\u1050-\u1055\u105a-\u105d\u1061\u1065-\u1066\u106e-\u1070\u1075-\u1081\u108e\u1090-\u1099\u10a0-\u10c5\u10d0-\u10fa\u10fc\u1100-\u1159\u115f-\u11a2\u11a8-\u11f9\u1200-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u1676\u1681-\u169a\u16a0-\u16ea\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u17e0-\u17e9\u1810-\u1819\u1820-\u1877\u1880-\u18a8\u18aa\u1900-\u191c\u1946-\u196d\u1970-\u1974\u1980-\u19a9\u19c1-\u19c7\u19d0-\u19d9\u1a00-\u1a16\u1b05-\u1b33\u1b45-\u1b4b\u1b50-\u1b59\u1b83-\u1ba0\u1bae-\u1bb9\u1c00-\u1c23\u1c40-\u1c49\u1c4d-\u1c7d\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u2094\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2183-\u2184\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2c6f\u2c71-\u2c7d\u2c80-\u2ce4\u2d00-\u2d25\u2d30-\u2d65\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3006\u3031-\u3035\u303b-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31b7\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fc3\ua000-\ua48c\ua500-\ua60c\ua610-\ua62b\ua640-\ua65f\ua662-\ua66e\ua680-\ua697\ua722-\ua788\ua78b-\ua78c\ua7fb-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8d0-\ua8d9\ua900-\ua925\ua930-\ua946\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa50-\uaa59\uac00-\ud7a3\uf900-\ufa2d\ufa30-\ufa6a\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc$]+)>)?$/i);
                if (!parsed) {
                    return null;
                }
                var token = { property: null, cast: null };
                token.property = parsed[1];
                if (parsed[3]) {
                    // restore "." in type case expression
                    token.cast = parsed[3].replace(/\$_\$/ig, function () { return "."; });
                }
                return token;
            });
        }
        else {
            this.steps = [];
        }
    }
    PathTokens.prototype.buildExpression = function () {
        var path = "";
        this.steps.forEach(function (step) {
            path += (path ? "." : "") + step.property + (step.cast ? "<" + step.cast + ">" : "");
        });
        return path;
    };
    PathTokens.prototype.toString = function () {
        return this.expression;
    };
    return PathTokens;
}());
function PathTokens$normalizePaths(paths) {
    var result = [];
    if (paths) {
        paths.forEach(function (p) {
            // coerce property and property chains into string paths
            var path = Property$isProperty(p) ? p.name : PropertyChain$isPropertyChain(p) ? p.path : p;
            var stack = [];
            var parent;
            var start = 0;
            var len = path.length;
            for (var i = 0; i < len; ++i) {
                var c = path.charAt(i);
                if (c === '{' || c === ',' || c === '}') {
                    var seg = path.substring(start, i).trim();
                    start = i + 1;
                    if (c === '{') {
                        if (parent) {
                            stack.push(parent);
                            parent += "." + seg;
                        }
                        else {
                            parent = seg;
                        }
                    }
                    else { // ',' or '}'
                        if (seg.length > 0) {
                            result.push(new PathTokens(parent ? parent + "." + seg : seg));
                        }
                        if (c === '}') {
                            parent = (stack.length === 0) ? undefined : stack.pop();
                        }
                    }
                }
            }
            if (stack.length > 0) {
                throw new Error("Unclosed '{' in path: " + p);
            }
            if (start === 0) {
                result.push(new PathTokens(path.trim()));
            }
        });
    }
    return result;
}

// TODO: Make `nonExitingScopeNestingCount` an editable configuration value
// Controls the maximum number of times that a child event scope can transfer events
// to its parent while the parent scope is exiting. A large number indicates that
// rules are not reaching steady-state. Technically something other than rules could
// cause this scenario, but in practice they are the primary use-case for event scope. 
var nonExitingScopeNestingCount$1 = 100;
var Rule$customRuleIndex = 0;
var Rule = /** @class */ (function () {
    /**
     * Creates a rule that executes a delegate when specified model events occur.
     * @param rootType The model type the rule is for.
     * @param options The options for the rule.
     */
    function Rule(rootType, name, options, skipRegistration) {
        if (skipRegistration === void 0) { skipRegistration = false; }
        this.invocationTypes = 0;
        this.predicates = [];
        this.returnValues = [];
        // Track the root type
        this.rootType = rootType;
        this.name = name || (options ? options.name : null) || (rootType.fullName + ".Custom." + (++Rule$customRuleIndex));
        // Configure the rule based on the specified options
        if (options) {
            var thisOptions = extractRuleOptions(options);
            if (thisOptions.onInit)
                this.onInit();
            if (thisOptions.onInitNew)
                this.onInitNew();
            if (thisOptions.onInitExisting)
                this.onInitExisting();
            if (thisOptions.onChangeOf)
                this.onChangeOf(thisOptions.onChangeOf);
            if (thisOptions.returns)
                this.returns(thisOptions.returns);
            if (thisOptions.execute instanceof Function)
                this.executeFn = thisOptions.execute;
        }
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(this);
        }
    }
    Rule.prototype.execute = function (entity) {
        if (this.executeFn) {
            this.executeFn(entity);
        }
    };
    // Indicates that the rule should run only for new instances when initialized
    Rule.prototype.onInitNew = function () {
        // ensure the rule has not already been registered
        if (this._registered)
            throw new Error("Rules cannot be configured once they have been registered: " + this.name);
        // configure the rule to run on init new
        this.invocationTypes |= RuleInvocationType.InitNew;
        return this;
    };
    // indicates that the rule should run only for existing instances when initialized
    Rule.prototype.onInitExisting = function () {
        // ensure the rule has not already been registered
        if (this._registered)
            throw new Error("Rules cannot be configured once they have been registered: " + this.name);
        // configure the rule to run on init existingh
        this.invocationTypes |= RuleInvocationType.InitExisting;
        return this;
    };
    // indicates that the rule should run for both new and existing instances when initialized
    Rule.prototype.onInit = function () {
        // ensure the rule has not already been registered
        if (this._registered)
            throw new Error("Rules cannot be configured once they have been registered: " + this.name);
        // configure the rule to run on both init new and init existing
        this.invocationTypes |= RuleInvocationType.InitNew | RuleInvocationType.InitExisting;
        return this;
    };
    Rule.prototype.onChangeOf = function (predicates) {
        // ensure the rule has not already been registered
        if (this._registered)
            throw new Error("Rules cannot be configured once they have been registered: " + this.name);
        // allow change of predicates to be specified as a parameter array without []'s
        if (predicates && predicates.constructor === String) {
            predicates = Array.prototype.slice.call(arguments);
        }
        // add to the set of existing change predicates
        this.predicates = this.predicates.length > 0 ? this.predicates.concat(predicates) : predicates;
        // also configure the rule to run on property change unless it has already been configured to run on property get
        if ((this.invocationTypes & RuleInvocationType.PropertyGet) === 0)
            this.invocationTypes |= RuleInvocationType.PropertyChanged;
        return this;
    };
    Rule.prototype.returns = function (properties) {
        // Ensure the rule has not already been registered
        if (this._registered)
            throw new Error("Rules cannot be configured once they have been registered: " + this.name);
        // Allow return properties to be specified as a parameter array without []'s
        if (properties && properties.constructor === String)
            properties = Array.prototype.slice.call(arguments);
        if (!properties)
            throw new Error("Rule must specify at least one property for returns.");
        // Add to the set of existing return value properties
        this.returnValues = this.returnValues.length > 0 ? this.returnValues.concat(properties) : properties;
        // Configure the rule to run on property get and not on property change
        this.invocationTypes |= RuleInvocationType.PropertyGet;
        this.invocationTypes &= ~RuleInvocationType.PropertyChanged;
        return this;
    };
    // registers the rule based on the configured invocation types, predicates, and return values
    Rule.prototype.register = function () {
        if (this._registered) {
            throw new Error("Rules cannot be registered more than once: " + this.name);
        }
        // TODO: track the rule with the root type?
        // this.rootType.rules.push(rule);
        // Indicate that the rule should now be considered registered and cannot be reconfigured
        Object.defineProperty(this, '_registered', { enumerable: false, value: true, writable: false });
        prepareRuleForRegistration(this, registerRule);
    };
    return Rule;
}());
function Rule$create(rootType, optionsOrFunction) {
    var options;
    if (optionsOrFunction) {
        // The options are the function to execute
        if (optionsOrFunction instanceof Function) {
            options = { execute: optionsOrFunction };
        }
        else {
            options = optionsOrFunction;
        }
    }
    return new Rule(rootType, options.name, options);
}
function pendingInvocation(target, rule, value) {
    if (value === void 0) { value = null; }
    var pendingInvocation;
    if (Object.prototype.hasOwnProperty.call(target, "_pendingInvocation")) {
        pendingInvocation = target._pendingInvocation;
    }
    else {
        Object.defineProperty(target, "_pendingInvocation", { enumerable: false, value: (pendingInvocation = []), writable: true });
    }
    var indexOfRule = pendingInvocation.indexOf(rule);
    if (arguments.length > 2) {
        if (value && indexOfRule < 0) {
            pendingInvocation.push(rule);
        }
        else if (!value && indexOfRule >= 0) {
            pendingInvocation.splice(indexOfRule, 1);
        }
    }
    else {
        return indexOfRule >= 0;
    }
}
function canExecuteRule(rule, obj, args) {
    // ensure the rule target is a valid rule root type
    return obj instanceof rule.rootType.ctor;
}
function executeRule(rule, obj, args) {
    // Ensure that the rule can be executed.
    if (!canExecuteRule(rule, obj, args)) {
        // TODO: Warn that rule can't be executed?
        return;
    }
    EventScope$perform(function () {
        {
            if (EventScope$current.parent) {
                var parentEventScope = EventScope$current.parent;
                if (parentEventScope._exitEventVersion) {
                    // Determine the maximum number nested calls to EventScope$perform
                    // before considering a rule to be a "runaway" rule. 
                    var maxNesting;
                    {
                        maxNesting = nonExitingScopeNestingCount$1 - 1;
                    }
                    if (parentEventScope._exitEventVersion > maxNesting) {
                        // TODO: logWarning("Aborting rule '" + rule.name + "'.");
                        return;
                    }
                }
            }
        }
        rule.execute.call(rule, obj, args);
    });
}
function prepareRuleForRegistration(rule, callback) {
    // resolve return values, which should all be loaded since the root type is now definitely loaded
    if (rule.returnValues) {
        rule.returnValues.forEach(function (returnValue, i) {
            if (!Property$isProperty(returnValue)) {
                rule.returnValues[i] = rule.rootType.getProperty(returnValue);
            }
        });
    }
    // resolve all predicates, because the rule cannot run until the dependent types have all been loaded
    if (rule.predicates) {
        var signal = null;
        var _loop_1 = function (i) {
            var predicate = rule.predicates[i];
            if (typeof predicate === "string") {
                // Parse string inputs, which may be paths containing nesting {} hierarchial syntax
                // create a signal if this is the first string-based input
                if (!signal) {
                    signal = new Signal("prepare rule predicates");
                }
                var predicateIndex_1 = i;
                // normalize the paths to accommodate {} hierarchial syntax
                PathTokens$normalizePaths([predicate]).forEach(function (path) {
                    Model$getPropertyOrPropertyChain(path, rule.rootType, false, signal.pending(function (propertyChain) {
                        rule.predicates[predicateIndex_1] = propertyChain;
                    }, this, true), this);
                }, this_1);
            }
            else if (!Property$isProperty(predicate) || PropertyChain$isPropertyChain(predicate)) {
                // TODO: Remove invalid predicates?
                rule.predicates.splice(i--, 1);
            }
            out_i_1 = i;
        };
        var this_1 = this, out_i_1;
        // setup loading of each property path that the calculation is based on
        for (var i = 0; i < rule.predicates.length; i++) {
            _loop_1(i);
            i = out_i_1;
        }
        if (signal) {
            // Wait until all property information is available to initialize the rule
            signal.waitForAll(callback, this, true, [rule]);
        }
        else {
            // Otherwise, just immediately proceed with rule registration
            callback(rule);
        }
    }
}
function registerRule(rule) {
    // register for init new
    if (rule.invocationTypes & RuleInvocationType.InitNew)
        rule.rootType.initNewEvent.subscribe(function (sender, args) { return executeRule(rule, args.entity, args); });
    // register for init existing
    if (rule.invocationTypes & RuleInvocationType.InitExisting) {
        rule.rootType.initExistingEvent.subscribe(function (sender, args) { return executeRule(rule, args.entity, args); });
    }
    // register for property change
    if (rule.invocationTypes & RuleInvocationType.PropertyChanged) {
        rule.predicates.forEach(function (predicate) {
            Property$addChanged(predicate, function (sender, args) {
                if (canExecuteRule(rule, sender, args) && !pendingInvocation(sender.meta, rule)) {
                    pendingInvocation(sender.meta, rule, true);
                    EventScope$onExit(function () {
                        pendingInvocation(sender.meta, rule, false);
                        executeRule(rule, sender, args);
                    });
                    EventScope$onAbort(function () {
                        pendingInvocation(sender.meta, rule, false);
                    });
                }
            }, null, // no object filter
            // false, // subscribe for all time, not once
            true // tolerate nulls since rule execution logic will handle guard conditions
            );
        });
    }
    // register for property get
    if (rule.invocationTypes & RuleInvocationType.PropertyGet && rule.returnValues) {
        // register for property get events for each return value to calculate the property when accessed
        rule.returnValues.forEach(function (returnValue) {
            Property$addAccessed(returnValue, function (sender, args) {
                // run the rule to initialize the property if it is pending initialization
                if (canExecuteRule(rule, sender, args) && Property$pendingInit(sender.meta, returnValue)) {
                    Property$pendingInit(sender.meta, returnValue, false);
                    executeRule(rule, sender, args);
                }
            });
        });
        // register for property change events for each predicate to invalidate the property value when inputs change
        rule.predicates.forEach(function (predicate) {
            Property$addChanged(predicate, function (sender, args) {
                if (rule.returnValues.some(function (returnValue) { return hasPropertyChangedSubscribers(returnValue, sender); })) {
                    // Immediately execute the rule if there are explicit event subscriptions for the property
                    if (canExecuteRule(rule, sender, args) && !pendingInvocation(sender.meta, rule)) {
                        pendingInvocation(sender.meta, rule, true);
                        EventScope$onExit(function () {
                            pendingInvocation(sender.meta, rule, false);
                            executeRule(rule, sender, args);
                        });
                        EventScope$onAbort(function () {
                            pendingInvocation(sender.meta, rule, false);
                        });
                    }
                }
                else {
                    // Otherwise, just mark the property as pending initialization and raise property change for UI subscribers
                    rule.returnValues.forEach(function (returnValue) {
                        Property$pendingInit(sender.meta, returnValue, true);
                    });
                    // Defer change notification until the scope of work has completed
                    EventScope$onExit(function () {
                        rule.returnValues.forEach(function (returnValue) {
                            // TODO: Implement observable?
                            Entity$_getEventDispatchers(sender).changedEvent.dispatch(returnValue, { entity: sender, property: returnValue });
                        });
                    });
                }
            }, null, // no object filter
            // false, // subscribe for all time, not once
            true // tolerate nulls since rule execution logic will handle guard conditions
            );
        });
    }
    // allow rule subclasses to perform final initialization when registered
    if (rule.onRegister instanceof Function) {
        rule.onRegister();
    }
}
// registers a rule with a specific property
function registerPropertyRule(rule) {
    var propRules = Property$getRules(rule.property);
    propRules.push(rule);
    // Raise events if registered.
    var dispatchers = Property$_getEventDispatchers(rule.property);
    var subscriptions = getEventSubscriptions(dispatchers.ruleRegisteredEvent);
    if (subscriptions && subscriptions.length > 0) {
        dispatchers.ruleRegisteredEvent.dispatch(rule, { property: rule.property, rule: rule });
    }
}
function extractRuleOptions(obj) {
    if (!obj) {
        return;
    }
    var options = {};
    var keys = Object.keys(obj);
    keys.filter(function (key) {
        var value = obj[key];
        if (key === 'onInit') {
            if (typeof value === "boolean") {
                options.onInit = value;
                return true;
            }
        }
        else if (key === 'onInitNew') {
            if (typeof value === "boolean") {
                options.onInitNew = value;
                return true;
            }
        }
        else if (key === 'onInitExisting') {
            if (typeof value === "boolean") {
                options.onInitExisting = value;
                return true;
            }
        }
        else if (key === 'onChangeOf') {
            if (Array.isArray(value)) {
                var invalidOnChangeOf_1 = null;
                options.onChangeOf = value.filter(function (p) {
                    if (typeof p === "string" || PropertyChain$isPropertyChain(p) || Property$isProperty(p)) {
                        return true;
                    }
                    else {
                        // TODO: Warn about invalid 'onChangeOf' item?
                        if (!invalidOnChangeOf_1) {
                            invalidOnChangeOf_1 = [];
                        }
                        invalidOnChangeOf_1.push(p);
                        return false;
                    }
                });
                if (invalidOnChangeOf_1) {
                    obj.onChangeOf = invalidOnChangeOf_1;
                    return false;
                }
                else {
                    return true;
                }
            }
            else if (typeof value === "string") {
                options.onChangeOf = [value];
                return true;
            }
            else if (PropertyChain$isPropertyChain(value)) {
                options.onChangeOf = [value];
                return true;
            }
            else if (Property$isProperty(value)) {
                options.onChangeOf = [value];
                return true;
            }
        }
        else if (key === 'returns') {
            if (Array.isArray(value)) {
                var invalidReturns_1 = null;
                options.returns = value.filter(function (p) {
                    if (typeof p === "string" || PropertyChain$isPropertyChain(p) || Property$isProperty(p)) {
                        return true;
                    }
                    else {
                        // TODO: Warn about invalid 'returns' item?
                        if (!invalidReturns_1) {
                            invalidReturns_1 = [];
                        }
                        return false;
                    }
                });
                if (invalidReturns_1) {
                    obj.returns = invalidReturns_1;
                    return false;
                }
                else {
                    return true;
                }
            }
            else if (typeof value === "string") {
                options.returns = [value];
                return true;
            }
            else if (Property$isProperty(value)) {
                options.returns = [value];
                return true;
            }
        }
        else if (key === 'execute') {
            if (value instanceof Function) {
                options.execute = value;
                return true;
            }
        }
        else {
            // TODO: Warn about unsupported rule options?
            return;
        }
        // TODO: Warn about invalid rule option value?
        return;
    }).forEach(function (key) {
        delete obj[key];
    });
    return options;
}

var calculationErrorDefault;
var CalculatedPropertyRule = /** @class */ (function (_super) {
    __extends(CalculatedPropertyRule, _super);
    function CalculatedPropertyRule(rootType, name, options, skipRegistration) {
        if (skipRegistration === void 0) { skipRegistration = false; }
        var _this = this;
        var property;
        var defaultIfError = calculationErrorDefault;
        var calculateFn;
        if (!name) {
            name = options.name;
        }
        if (options) {
            var thisOptions = extractCalculatedPropertyRuleOptions(options);
            if (thisOptions.property) {
                property = Property$isProperty(thisOptions.property) ? thisOptions.property : rootType.getProperty(thisOptions.property);
                // indicate that the rule is responsible for returning the value of the calculated property
                options.returns = [thisOptions.property];
            }
            if (!name) {
                // Generate a reasonable default rule name if not specified
                name = options.name = (rootType.fullName + "." + (typeof property === "string" ? property : property.name) + ".Calculated");
            }
            defaultIfError = thisOptions.defaultIfError;
            calculateFn = thisOptions.calculate;
        }
        // Call the base rule constructor 
        _this = _super.call(this, rootType, name, options, true) || this;
        // Public read-only properties
        Object.defineProperty(_this, "property", { enumerable: true, value: property });
        // Public settable properties
        _this.defaultIfError = defaultIfError;
        // Backing fields for properties
        if (calculateFn)
            Object.defineProperty(_this, "_calculateFn", { enumerable: false, value: calculateFn, writable: true });
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(_this);
        }
        return _this;
    }
    CalculatedPropertyRule.prototype.execute = function (obj) {
        var calculateFn;
        // Convert string functions into compiled functions on first execution
        if (this._calculateFn.constructor === String) {
            // TODO: Calculation expression support
            var calculateExpr = this._calculateFn;
            var calculateCompiledFn = new Function("return " + calculateExpr + ";");
            calculateFn = this._calculateFn = calculateCompiledFn;
        }
        else {
            calculateFn = this._calculateFn;
        }
        // Calculate the new property value
        var newValue;
        if (this.defaultIfError === undefined) {
            newValue = calculateFn.call(obj);
        }
        else {
            try {
                newValue = calculateFn.apply(obj);
            }
            catch (e) {
                newValue = this.defaultIfError;
            }
        }
        // Exit immediately if the calculated result was undefined
        if (newValue === undefined) {
            return;
        }
        // modify list properties to match the calculated value instead of overwriting the property
        if (this.property.isList) {
            // re-calculate the list values
            var newList = newValue;
            // compare the new list to the old one to see if changes were made
            var curList = this.property.value(obj);
            if (newList.length === curList.length) {
                var noChanges = true;
                for (var i = 0; i < newList.length; ++i) {
                    if (newList[i] !== curList[i]) {
                        noChanges = false;
                        break;
                    }
                }
                if (noChanges) {
                    return;
                }
            }
            // update the current list so observers will receive the change events
            // curList.beginUpdate();
            // update(curList, newList);
            // curList.endUpdate();
            throw new Error("Calculated list properties are not yet implemented.");
        }
        else {
            // Otherwise, just set the property to the new value
            this.property.value(obj, newValue, { calculated: true });
        }
    };
    CalculatedPropertyRule.prototype.toString = function () {
        return "calculation of " + this.property.name;
    };
    // perform addition initialization of the rule when it is registered
    CalculatedPropertyRule.prototype.onRegister = function () {
        // register the rule with the target property
        registerPropertyRule(this);
        this.property.isCalculated = true;
    };
    return CalculatedPropertyRule;
}(Rule));
function CalcualatedPropertyRule$create(rootType, property, optionsOrFunction) {
    var options;
    if (optionsOrFunction) {
        // The options are the function to execute
        if (optionsOrFunction instanceof Function) {
            options = { calculate: optionsOrFunction };
        }
        else {
            options = optionsOrFunction;
        }
    }
    options.property = property;
    return new CalculatedPropertyRule(rootType, options.name, options);
}
function extractCalculatedPropertyRuleOptions(obj) {
    if (!obj) {
        return;
    }
    var options = {};
    var keys = Object.keys(obj);
    var extractedKeys = keys.filter(function (key) {
        var value = obj[key];
        if (key === 'property') {
            if (Property$isProperty(value)) {
                options.property = value;
                return true;
            }
        }
        else if (key === 'calculate' || key === 'fn') {
            if (value instanceof Function) {
                options.calculate = value;
                return true;
            }
            else if (typeof value === "string") {
                options.calculate = value;
                return true;
            }
        }
        else if (key === 'defaultIfError') {
            options.defaultIfError = value;
            return true;
        }
        else {
            // TODO: Warn about unsupported rule options?
            return;
        }
        // TODO: Warn about invalid rule option value?
        return;
    }).forEach(function (key) {
        delete obj[key];
    });
    return options;
}

var fieldNamePrefix = createSecret('Property.fieldNamePrefix', 3, false, true, "_fN");
var Property = /** @class */ (function () {
    function Property(containingType, name, jstype, label, helptext, format, isList, isStatic, isPersisted, isCalculated, defaultValue, origin) {
        if (defaultValue === void 0) { defaultValue = undefined; }
        if (origin === void 0) { origin = containingType.originForNewProperties; }
        // Public read-only properties
        Object.defineProperty(this, "containingType", { enumerable: true, value: containingType });
        Object.defineProperty(this, "name", { enumerable: true, value: name });
        Object.defineProperty(this, "propertyType", { enumerable: true, value: jstype });
        Object.defineProperty(this, "isList", { enumerable: true, value: isList === true });
        Object.defineProperty(this, "isStatic", { enumerable: true, value: isStatic === true });
        // Public settable properties
        this.helptext = helptext;
        this.isPersisted = isPersisted;
        this.isCalculated = isCalculated;
        // Backing fields for properties
        if (label)
            Object.defineProperty(this, "_label", { enumerable: false, value: label, writable: true });
        if (format)
            Object.defineProperty(this, "_format", { enumerable: false, value: format, writable: true });
        if (origin)
            Object.defineProperty(this, "_origin", { enumerable: false, value: containingType.originForNewProperties, writable: true });
        if (defaultValue)
            Object.defineProperty(this, "_defaultValue", { enumerable: false, value: defaultValue, writable: true });
        Object.defineProperty(this, "_propertyAccessSubscriptions", { value: [] });
        Object.defineProperty(this, "_propertyChangeSubscriptions", { value: [] });
        Object.defineProperty(this, "_eventDispatchers", { value: new PropertyEventDispatchersImplementation() });
        Object.defineProperty(this, "getter", { value: Property$_makeGetter(this, Property$_getter) });
        Object.defineProperty(this, "setter", { value: Property$_makeSetter(this, Property$_setter) });
        if (this.origin === "client" && this.isPersisted) ;
    }
    Object.defineProperty(Property.prototype, "fieldName", {
        get: function () {
            return fieldNamePrefix + "_" + this.name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Property.prototype, "changedEvent", {
        get: function () {
            return this._eventDispatchers.changedEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Property.prototype, "accessedEvent", {
        get: function () {
            return this._eventDispatchers.accessedEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Property.prototype.equals = function (prop) {
        if (prop === null || prop === undefined) {
            return;
        }
        if (PropertyChain$isPropertyChain(prop)) {
            return prop.equals(this);
        }
        if (prop instanceof Property) {
            return this === prop;
        }
    };
    Property.prototype.toString = function () {
        if (this.isStatic) {
            return this.getPath();
        }
        else {
            return "this<" + this.containingType + ">." + this.name;
        }
    };
    Object.defineProperty(Property.prototype, "label", {
        get: function () {
            return this._label || toTitleCase(this.name.replace(/([^A-Z]+)([A-Z])/g, "$1 $2"));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Property.prototype, "format", {
        get: function () {
            // TODO: Compile format from specifier if needed
            return this._format;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Property.prototype, "origin", {
        get: function () {
            return this._origin ? this._origin : this.containingType.origin;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Property.prototype, "defaultValue", {
        get: function () {
            if (Object.prototype.hasOwnProperty.call(this, '_defaultValue')) {
                // clone array and date defaults since they are mutable javascript types
                return this._defaultValue instanceof Array ? this._defaultValue.slice() :
                    this._defaultValue instanceof Date ? new Date(+this._defaultValue) :
                        // TODO: Implement TimeSpan class/type?
                        // this._defaultValue instanceof TimeSpan ? new TimeSpan(this._defaultValue.totalMilliseconds) :
                        this._defaultValue instanceof Function ? this._defaultValue() :
                            this._defaultValue;
            }
            else {
                return getDefaultValue(this.isList, this.propertyType);
            }
        },
        enumerable: true,
        configurable: true
    });
    Property.prototype.getPath = function () {
        return this.isStatic ? (this.containingType.fullName + "." + this.name) : this.name;
    };
    Property.prototype.canSetValue = function (obj, val) {
        // NOTE: only allow values of the correct data type to be set in the model
        if (val === undefined) {
            // TODO: Warn about setting value to undefined?
            // logWarning("You should not set property values to undefined, use null instead: property = ." + this._name + ".");
            // console.warn(`You should not set property values to undefined, use null instead: property = ${this.name}.`);
            return true;
        }
        if (val === null) {
            return true;
        }
        // for entities check base types as well
        if (val.constructor && val.constructor.meta) {
            for (var valType = val.constructor.meta; valType; valType = valType.baseType) {
                if (valType.ctor === this.propertyType) {
                    return true;
                }
            }
            return false;
        }
        //Data types
        else {
            var valObjectType = val.constructor;
            //"Normalize" data type in case it came from another frame as well as ensure that the types are the same
            switch (getTypeName(val)) {
                case "string":
                    valObjectType = String;
                    break;
                case "number":
                    valObjectType = Number;
                    break;
                case "boolean":
                    valObjectType = Boolean;
                    break;
                case "date":
                    valObjectType = Date;
                    break;
                case "array":
                    valObjectType = Array;
                    break;
            }
            // value property type check
            return valObjectType === this.propertyType ||
                // entity array type check
                (valObjectType === Array && this.isList && val.every(function (child) {
                    if (child.constructor && child.constructor.meta) {
                        for (var childType = child.constructor.meta; childType; childType = childType.baseType) {
                            if (childType._jstype === this._jstype) {
                                return true;
                            }
                        }
                        return false;
                    }
                }, this));
        }
    };
    Property.prototype.value = function (obj, val, additionalArgs) {
        if (obj === void 0) { obj = null; }
        if (val === void 0) { val = null; }
        if (additionalArgs === void 0) { additionalArgs = null; }
        var target = (this.isStatic ? this.containingType.ctor : obj);
        if (target === undefined || target === null) {
            throw new Error("Cannot " + (arguments.length > 1 ? "set" : "get") + " value for " + (this.isStatic ? "" : "non-") + "static property \"" + this.getPath() + "\" on type \"" + this.containingType.fullName + "\": target is null or undefined.");
        }
        if (arguments.length > 1) {
            Property$_setter(this, obj, val, additionalArgs);
        }
        else {
            return Property$_getter(this, obj);
        }
    };
    // rootedPath(type: Type) {
    // 	if (this.isDefinedBy(type)) {
    // 		return this.isStatic ? this.containingType.fullName + "." + this.name : this.name;
    // 	}
    // }
    Property.prototype.isInited = function (obj) {
        var target = (this.isStatic ? this.containingType.ctor : obj);
        if (!target.hasOwnProperty(this.fieldName)) {
            // If the backing field has not been created, then property is not initialized
            return false;
        }
        /*
        // TODO: Implement list lazy loading?
        if (this.isList) {
            var value = target[this.fieldName];
            if (value === undefined || !LazyLoader.isLoaded(value)) {
                // If the list is not-loaded, then the property is not initialized
                return false;
            }
        }
        */
        return true;
    };
    Property.prototype.calculated = function (options) {
        var rootType = this.containingType;
        if (options.rootType) {
            rootType = options.rootType;
            delete options.rootType;
        }
        options.property = this;
        CalcualatedPropertyRule$create(rootType, this, options);
    };
    return Property;
}());
var PropertyEventDispatchersImplementation = /** @class */ (function () {
    function PropertyEventDispatchersImplementation() {
        this.changedEvent = new dist_1$1();
        this.accessedEvent = new dist_1$1();
        this.ruleRegisteredEvent = new dist_1$1();
    }
    return PropertyEventDispatchersImplementation;
}());
function Property$isProperty(obj) {
    return obj instanceof Property;
}
function Property$_generateShortcuts(property, target, recurse, overwrite) {
    if (recurse === void 0) { recurse = true; }
    if (overwrite === void 0) { overwrite = null; }
    var shortcutName = "$" + property.name;
    if (!(Object.prototype.hasOwnProperty.call(target, shortcutName)) || overwrite) {
        target[shortcutName] = property;
    }
    if (recurse) {
        if (overwrite == null) {
            overwrite = false;
        }
        property.containingType.derivedTypes.forEach(function (t) {
            Property$_generateShortcuts(property, t, true, overwrite);
        });
    }
}
function Property$_generateStaticProperty(property) {
    Object.defineProperty(property.containingType.ctor, property.name, {
        configurable: false,
        enumerable: true,
        get: property.getter,
        set: property.setter
    });
}
function Property$_generatePrototypeProperty(property) {
    Object.defineProperty(property.containingType.ctor.prototype, property.name, {
        configurable: false,
        enumerable: true,
        get: property.getter,
        set: property.setter
    });
}
function Property$_generateOwnProperty(property, obj) {
    Object.defineProperty(obj, property.name, {
        configurable: false,
        enumerable: true,
        get: property.getter,
        set: property.setter
    });
}
function Property$_getEventDispatchers(prop) {
    return prop._eventDispatchers;
}
function Property$getRules(property) {
    var prop = property;
    var propRules;
    if (prop._rules) {
        propRules = prop._rules;
    }
    else {
        propRules = [];
        Object.defineProperty(prop, "_rules", { enumerable: false, value: propRules, writable: false });
    }
    return propRules;
}
function Property$pendingInit(target, prop, value) {
    if (value === void 0) { value = null; }
    var pendingInit;
    if (Object.prototype.hasOwnProperty.call(target, "_pendingInit")) {
        pendingInit = target._pendingInit;
    }
    else {
        Object.defineProperty(target, "_pendingInit", { enumerable: false, value: (pendingInit = {}), writable: true });
    }
    if (arguments.length > 2) {
        if (value === false) {
            delete pendingInit[prop.name];
        }
        else {
            pendingInit[prop.name] = value;
        }
    }
    else {
        var storage = void 0;
        if (Type$isType(target)) {
            storage = target.ctor;
        }
        else if (target instanceof ObjectMeta) {
            storage = target.entity;
        }
        var currentValue = storage[prop.fieldName];
        return currentValue === undefined || pendingInit[prop.name] === true;
    }
}
function Property$_subListEvents(obj, property, list) {
    list.changed.subscribe(function (sender, args) {
        if ((args.added && args.added.length > 0) || (args.removed && args.removed.length > 0)) {
            // NOTE: property change should be broadcast before rules are run so that if 
            // any rule causes a roundtrip to the server these changes will be available
            // TODO: Implement notifyListChanged?
            // property.containingType.model.notifyListChanged(target, property, changes);
            // NOTE: oldValue is not currently implemented for lists
            var eventArgs = { property: property, newValue: list, oldValue: undefined };
            eventArgs['changes'] = [{ newItems: args.added, oldItems: args.removed }];
            eventArgs['collectionChanged'] = true;
            Property$_getEventDispatchers(property).changedEvent.dispatch(obj, eventArgs);
            // TODO: Implement observer?
            Entity$_getEventDispatchers(obj).changedEvent.dispatch(property, { entity: obj, property: property });
        }
    });
}
function Property$_getInitialValue(property) {
    var val = property.defaultValue;
    if (Array.isArray(val)) {
        val = ObservableList.ensureObservable(val);
        // Override the default toString on arrays so that we get a comma-delimited list
        // TODO: Implement toString on observable list?
        // val.toString = Property$_arrayToString.bind(val);
    }
    return val;
}
function Property$_ensureInited(property, obj) {
    var target = (property.isStatic ? property.containingType.ctor : obj);
    // Determine if the property has been initialized with a value
    // and initialize the property if necessary
    if (!obj.hasOwnProperty(property.fieldName)) {
        // Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
        if (!property.isCalculated) {
            Property$pendingInit(target.meta, property, false);
            var val = Property$_getInitialValue(property);
            Object.defineProperty(target, property.fieldName, { value: val, writable: true });
            if (Array.isArray(val)) {
                Property$_subListEvents(obj, property, val);
            }
            // TODO: Implement observable?
            Entity$_getEventDispatchers(obj).changedEvent.dispatch(property, { entity: obj, property: property });
        }
        // Mark the property as pending initialization
        Property$pendingInit(target.meta, property, true);
    }
}
function Property$_getter(property, obj) {
    // Ensure that the property has an initial (possibly default) value
    Property$_ensureInited(property, obj);
    // Raise access events
    Property$_getEventDispatchers(property).accessedEvent.dispatch(obj, { property: property, value: obj[property.fieldName] });
    Entity$_getEventDispatchers(obj).accessedEvent.dispatch(property, { entity: obj, property: property });
    // Return the property value
    return obj[property.fieldName];
}
function Property$_setter(property, obj, val, additionalArgs, skipTypeCheck) {
    if (additionalArgs === void 0) { additionalArgs = null; }
    if (skipTypeCheck === void 0) { skipTypeCheck = false; }
    // Ensure that the property has an initial (possibly default) value
    Property$_ensureInited(property, obj);
    var old = obj[property.fieldName];
    if (Property$_shouldSetValue(property, obj, old, val, skipTypeCheck)) {
        Property$_setValue(property, obj, old, val, additionalArgs);
    }
}
function Property$_shouldSetValue(property, obj, old, val, skipTypeCheck) {
    if (skipTypeCheck === void 0) { skipTypeCheck = false; }
    if (!property.canSetValue(obj, val)) {
        throw new Error("Cannot set " + property.name + "=" + (val === undefined ? "<undefined>" : val) + " for instance " + obj.meta.type.fullName + "|" + obj.meta.id + ": a value of type " + (property.propertyType && property.propertyType.meta ? property.propertyType.meta.fullName : parseFunctionName(property.propertyType)) + " was expected.");
    }
    // Update lists as batch remove/add operations
    if (property.isList) {
        throw new Error("Property set on lists is not permitted.");
    }
    else {
        // compare values so that this check is accurate for primitives
        var oldValue = (old === undefined || old === null) ? old : old.valueOf();
        var newValue = (val === undefined || val === null) ? val : val.valueOf();
        // Do nothing if the new value is the same as the old value. Account for NaN numbers, which are
        // not equivalent (even to themselves). Although isNaN returns true for non-Number values, we won't
        // get this far for Number properties unless the value is actually of type Number (a number or NaN).
        return (oldValue !== newValue && !(property.propertyType === Number && isNaN(oldValue) && isNaN(newValue)));
    }
}
function Property$_setValue(property, obj, old, val, additionalArgs) {
    if (additionalArgs === void 0) { additionalArgs = null; }
    // Update lists as batch remove/add operations
    if (property.isList) {
        // TODO: Implement observable array update
        // old.beginUpdate();
        // update(old, val);
        // old.endUpdate();
        throw new Error("Property set on lists is not implemented.");
    }
    else {
        // Set or create the backing field value
        if (obj.hasOwnProperty(property.fieldName)) {
            obj[property.fieldName] = val;
        }
        else {
            Object.defineProperty(obj, property.fieldName, { value: val, writable: true });
        }
        Property$pendingInit(obj.meta, property, false);
        // Do not raise change if the property has not been initialized. 
        if (old !== undefined) {
            var eventArgs = { property: property, newValue: val, oldValue: old };
            Property$_getEventDispatchers(property).changedEvent.dispatch(obj, additionalArgs ? merge(eventArgs, additionalArgs) : eventArgs);
            Entity$_getEventDispatchers(obj).changedEvent.dispatch(property, { entity: obj, property: property });
        }
    }
}
function Property$_makeGetter(property, getter) {
    return function (additionalArgs) {
        if (additionalArgs === void 0) { additionalArgs = null; }
        // ensure the property is initialized
        var result = getter(property, this, additionalArgs);
        /*
        // TODO: Implement lazy loading pattern?
        // ensure the property is initialized
        if (result === undefined || (property.isList && LazyLoader.isRegistered(result))) {
            throw new Error(
                `Property ${property.containingType.fullName}.${} is not initialized.  Make sure instances are loaded before accessing property values.  ${}|${}`);
                ,
                property.name,
                this.meta.type.fullName(),
                this.meta.id
            ));
        }
        */
        return result;
    };
}
function Property$_makeSetter(prop, setter, skipTypeCheck) {
    // TODO: Is setter "__notifies" needed?
    // setter.__notifies = true;
    if (skipTypeCheck === void 0) { skipTypeCheck = false; }
    return function (val, additionalArgs) {
        if (additionalArgs === void 0) { additionalArgs = null; }
        setter(prop, this, val, additionalArgs, skipTypeCheck);
    };
}
function Property$_addAccessedHandler(prop, handler, obj) {
    if (obj === void 0) { obj = null; }
    var property = prop;
    var unsubscribe;
    var sender = null;
    if (obj) {
        var innerHandler_1 = handler;
        handler = function (sender, args) {
            if (sender === obj) {
                innerHandler_1(sender, args);
            }
        };
        sender = obj;
    }
    unsubscribe = property._eventDispatchers.accessedEvent.subscribe(handler);
    property._propertyAccessSubscriptions.push({ handler: handler, sender: sender, unsubscribe: unsubscribe });
    return unsubscribe;
}
function Property$addAccessed(prop, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    if (toleratePartial === void 0) { toleratePartial = false; }
    if (prop instanceof Property) {
        return Property$_addAccessedHandler(prop, handler, obj);
    }
    else if (PropertyChain$isPropertyChain(prop)) {
        return PropertyChain$_addAccessedHandler(prop, handler, obj, toleratePartial);
    }
    else {
        throw new Error("Invalid property passed to `Property$addAccessed(prop)`.");
    }
}
function Property$_addChangedHandler(prop, handler, obj) {
    if (obj === void 0) { obj = null; }
    var property = prop;
    var unsubscribe;
    var sender = null;
    if (obj) {
        var innerHandler_2 = handler;
        handler = function (sender, args) {
            if (sender === obj) {
                innerHandler_2(sender, args);
            }
        };
        sender = obj;
    }
    unsubscribe = property._eventDispatchers.changedEvent.subscribe(handler);
    prop._propertyChangeSubscriptions.push({ handler: handler, sender: sender, unsubscribe: unsubscribe });
    return unsubscribe;
}
// starts listening for change events along the property chain on any known instances. Use obj argument to
// optionally filter the events to a specific object
function Property$addChanged(prop, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    if (toleratePartial === void 0) { toleratePartial = false; }
    if (prop instanceof Property) {
        return Property$_addChangedHandler(prop, handler, obj);
    }
    else if (PropertyChain$isPropertyChain(prop)) {
        return PropertyChain$_addChangedHandler(prop, handler, obj, toleratePartial);
    }
    else {
        throw new Error("Invalid property passed to `Property$addChanged(prop)`.");
    }
}
function hasPropertyChangedSubscribers(prop, obj) {
    var property = prop;
    var subscriptions = property._propertyChangeSubscriptions;
    return subscriptions.length > 0 && subscriptions.some(function (s) { return s.sender === obj; });
}

var newIdPrefix = "+c";
var TypeEventDispatchers = /** @class */ (function () {
    function TypeEventDispatchers() {
        this.initNewEvent = new dist_1$1();
        this.initExistingEvent = new dist_1$1();
        this.destroyEvent = new dist_1$1();
    }
    return TypeEventDispatchers;
}());
var Type = /** @class */ (function () {
    function Type(model, fullName, baseType, origin) {
        if (baseType === void 0) { baseType = null; }
        if (origin === void 0) { origin = "client"; }
        // Public read-only properties
        Object.defineProperty(this, "model", { enumerable: true, value: model });
        Object.defineProperty(this, "fullName", { enumerable: true, value: fullName });
        Object.defineProperty(this, "ctor", { enumerable: true, value: Type$_generateConstructor(this, fullName, baseType) });
        Object.defineProperty(this, "baseType", { enumerable: true, value: baseType });
        // Public settable properties
        this.origin = origin;
        this.originForNewProperties = this.origin;
        // Backing fields for properties
        Object.defineProperty(this, "_lastId", { enumerable: false, value: 0, writable: true });
        Object.defineProperty(this, "_pool", { enumerable: false, value: {}, writable: false });
        Object.defineProperty(this, "_legacyPool", { enumerable: false, value: {}, writable: false });
        Object.defineProperty(this, "_properties", { enumerable: false, value: {}, writable: false });
        Object.defineProperty(this, '_derivedTypes', { enumerable: false, value: [], writable: false });
        Object.defineProperty(this, "_eventDispatchers", { value: new TypeEventDispatchers() });
        // Object.defineProperty(this, "rules", { value: [] });
        // TODO: Is self-reference to type needed?
        // Add self-reference to decrease the likelihood of errors
        // due to an absence of the necessary type vs. entity.
        // this.type = this;
    }
    Object.defineProperty(Type.prototype, "destroyEvent", {
        get: function () {
            return this._eventDispatchers.destroyEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Type.prototype, "initNewEvent", {
        get: function () {
            return this._eventDispatchers.initNewEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Type.prototype, "initExistingEvent", {
        get: function () {
            return this._eventDispatchers.initExistingEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    // static get newIdPrefix() {
    // 	return newIdPrefix.substring(1);
    // }
    // static set newIdPrefix(value) {
    // 	if (typeof (value) !== "string") throw new TypeError("Property `Type.newIdPrefix` must be a string, found <" + (typeof value) + ">");
    // 	if (value.length === 0) throw new Error("Property `Type.newIdPrefix` cannot be empty string");
    // 	newIdPrefix = "+" + value;
    // }
    Type.prototype.newId = function () {
        // Get the next id for this type's heirarchy.
        for (var lastId, type = this; type; type = type.baseType) {
            lastId = Math.max(lastId || 0, type._lastId);
        }
        var nextId = lastId + 1;
        // Update the last id for each type in the heirarchy.
        for (var type = this; type; type = type.baseType) {
            type._lastId = nextId;
        }
        // Return the new id.
        return newIdPrefix + nextId;
    };
    Type.prototype.register = function (obj, id, suppressModelEvent) {
        if (suppressModelEvent === void 0) { suppressModelEvent = false; }
        // register is called with single argument from default constructor
        if (arguments.length === 2) {
            Type$_validateId(this, id);
        }
        var isNew;
        if (!id) {
            id = this.newId();
            isNew = true;
        }
        Object.defineProperty(obj, "meta", { value: new ObjectMeta(this, obj, id, isNew), configurable: false, enumerable: false, writable: false });
        var key = id.toLowerCase();
        for (var t = this; t; t = t.baseType) {
            if (t._pool.hasOwnProperty(key)) {
                throw new Error("Object \"" + this.fullName + "|" + id + "\" has already been registered.");
            }
            t._pool[key] = obj;
            if (t._known) {
                t._known.add(obj);
            }
        }
        if (this.model.settings.createOwnProperties === true) {
            for (var prop in this._properties) {
                if (Object.prototype.hasOwnProperty.call(this._properties, prop)) {
                    var property = this._properties[prop];
                    if (!property.isStatic) {
                        Property$_generateOwnProperty(property, obj);
                    }
                }
            }
        }
        if (!suppressModelEvent) {
            Model$_getEventDispatchers(this.model).entityRegisteredEvent.dispatch(this.model, { entity: obj });
        }
    };
    Type.prototype.changeObjectId = function (oldId, newId) {
        Type$_validateId(this, oldId);
        Type$_validateId(this, newId);
        var oldKey = oldId.toLowerCase();
        var newKey = newId.toLowerCase();
        var obj = this._pool[oldKey];
        if (obj) {
            obj.meta.legacyId = oldId;
            for (var t = this; t; t = t.baseType) {
                t._pool[newKey] = obj;
                delete t._pool[oldKey];
                t._legacyPool[oldKey] = obj;
            }
            obj.meta.id = newId;
            return obj;
        }
    };
    Type.prototype.unregister = function (obj) {
        for (var t = this; t; t = t.baseType) {
            delete t._pool[obj.meta.id.toLowerCase()];
            if (obj.meta.legacyId) {
                delete t._legacyPool[obj.meta.legacyId.toLowerCase()];
            }
            if (t._known) {
                t._known.remove(obj);
            }
        }
        Model$_getEventDispatchers(this.model).entityUnregisteredEvent.dispatch(this.model, { entity: obj });
    };
    Type.prototype.get = function (id, exactTypeOnly) {
        if (exactTypeOnly === void 0) { exactTypeOnly = false; }
        if (!id) {
            throw new Error("Method \"" + this.fullName + ".meta.get()\" was called without a valid id argument.");
        }
        var key = id.toLowerCase();
        var obj = this._pool[key] || this._legacyPool[key];
        // If exactTypeOnly is specified, don't return sub-types.
        if (obj && exactTypeOnly === true && obj.meta.type !== this) {
            throw new Error("The entity with id='" + id + "' is expected to be of type '" + this.fullName + "' but found type '" + obj.meta.type.fullName + "'.");
        }
        return obj;
    };
    // Gets an array of all objects of this type that have been registered.
    // The returned array is observable and collection changed events will be raised
    // when new objects are registered or unregistered.
    // The array is in no particular order.
    Type.prototype.known = function () {
        var known = this._known;
        if (!known) {
            var list = [];
            for (var id in this._pool) {
                if (Object.prototype.hasOwnProperty.call(this._pool, id)) {
                    list.push(this._pool[id]);
                }
            }
            known = this._known = ObservableList.ensureObservable(list);
        }
        return known;
    };
    Type.prototype.addProperty = function (name, jstype, isList, isStatic, options) {
        // TODO: Compile format specifier to format object
        // let format: Format = null;
        // if (options.format) {
        // 	if (typeof(options.format) === "string") {
        // 		format = getFormat(jstype, options.format);
        // 	} else if (format.constructor === Format) {
        // 		format = options.format;
        // 	} else {
        // 		// TODO: Warn about format option that is neither Format or string
        // 	}
        // }
        if (options === void 0) { options = {}; }
        var property = new Property(this, name, jstype, options.label, options.helptext, options.format, isList, isStatic, options.isPersisted, options.isCalculated, options.defaultValue);
        this._properties[name] = property;
        // TODO: Implement static and instance property storage?
        // (isStatic ? this._staticProperties : this._instanceProperties)[name] = property;
        Property$_generateShortcuts(property, property.containingType.ctor);
        if (property.isStatic) {
            Property$_generateStaticProperty(property);
        }
        else if (this.model.settings.createOwnProperties === true) {
            for (var id in this._pool) {
                if (Object.prototype.hasOwnProperty.call(this._pool, id)) {
                    Property$_generateOwnProperty(property, this._pool[id]);
                }
            }
        }
        else {
            Property$_generatePrototypeProperty(property);
        }
        Model$_getEventDispatchers(this.model).propertyAddedEvent.dispatch(this.model, { property: property });
        return property;
    };
    Type.prototype.getProperty = function (name) {
        var prop;
        for (var t = this; t && !prop; t = t.baseType) {
            prop = t._properties[name];
            if (prop) {
                return prop;
            }
        }
        return null;
    };
    Object.defineProperty(Type.prototype, "properties", {
        get: function () {
            var propertiesArray = [];
            for (var type = this; type != null; type = type.baseType) {
                for (var propertyName in type._properties) {
                    if (type._properties.hasOwnProperty(propertyName)) {
                        propertiesArray.push(type._properties[propertyName]);
                    }
                }
            }
            return propertiesArray;
        },
        enumerable: true,
        configurable: true
    });
    Type.prototype.addRule = function (def) {
        var rule = Rule$create(this, def);
        // TODO: Track rules on the type?
        return rule;
    };
    Object.defineProperty(Type.prototype, "derivedTypes", {
        get: function () {
            return this._derivedTypes;
        },
        enumerable: true,
        configurable: true
    });
    Type.prototype.hasModelProperty = function (prop) {
        return prop.containingType === this || this.isSubclassOf(prop.containingType);
    };
    Type.prototype.isSubclassOf = function (type) {
        var result = false;
        navigateAttribute(this, 'baseType', function (baseType) {
            if (baseType === type) {
                result = true;
                return false;
            }
        });
        return result;
    };
    Type.prototype.toString = function () {
        return this.fullName;
    };
    return Type;
}());
function Type$_getEventDispatchers(type) {
    return type._eventDispatchers;
}
function Type$create(model, fullName, baseType, origin) {
    if (baseType === void 0) { baseType = null; }
    if (origin === void 0) { origin = "client"; }
    return new Type(model, fullName, baseType ? baseType : null, origin);
}
function Type$isType(obj) {
    return obj instanceof Type;
}
function Type$_validateId(type, id) {
    if (id === null || id === undefined) {
        throw new Error("Id cannot be " + (id === null ? "null" : "undefined") + " (entity = " + type.fullName + ").");
    }
    else if (getTypeName(id) !== "string") {
        throw new Error("Id must be a string:  encountered id " + id + " of type \"" + parseFunctionName(id.constructor) + "\" (entity = " + type.fullName + ").");
    }
    else if (id === "") {
        throw new Error("Id cannot be a blank string (entity = " + type.fullName + ").");
    }
}
var disableConstruction = false;
function Type$_generateConstructor(type, fullName, baseType) {
    if (baseType === void 0) { baseType = null; }
    // Create namespaces as needed
    var nameTokens = fullName.split("."), token = nameTokens.shift(), namespaceObj = Model$_allTypesRoot, globalObj = window;
    while (nameTokens.length > 0) {
        namespaceObj = ensureNamespace(token, namespaceObj);
        globalObj = ensureNamespace(token, globalObj);
        token = nameTokens.shift();
    }
    // The final name to use is the last token
    var finalName = token;
    var ctorFactory = new Function("construct", "return function " + finalName + " () { construct.apply(this, arguments); }");
    function construct() {
        if (!disableConstruction) {
            if (arguments.length > 0 && arguments[0] != null && arguments[0].constructor === String) {
                var id = arguments[0];
                var props = arguments[1];
                // TODO: Is this needed?
                var suppressModelEvent = arguments[2];
                // When a constructor is called we do not want to silently
                // return an instance of a sub type, so fetch using exact type.
                var exactTypeOnly = true;
                // TODO: Indicate that an object is currently being constructed?
                var obj = type.get(id, exactTypeOnly);
                // If the instance already exists, then initialize properties and return it.
                if (obj) {
                    if (props) {
                        obj.init(props);
                    }
                    return obj;
                }
                // Register the newly constructed existing instance.
                type.register(this, id, suppressModelEvent);
                // Initialize properties if provided.
                if (props) {
                    this.init(props);
                }
                // Raise the initExisting event on this type and all base types
                for (var t = type; t; t = t.baseType) {
                    t._eventDispatchers.initExistingEvent.dispatch(t, { entity: this });
                }
            }
            else {
                var props = arguments[0];
                // TODO: Is this needed?
                var suppressModelEvent = arguments[2];
                // Register the newly constructed new instance. It will
                // be assigned a sequential client-generated id.
                type.register(this, null, suppressModelEvent);
                // Set properties passed into constructor.
                if (props) {
                    this.set(props);
                }
                // Raise the initNew event on this type and all base types
                for (var t = type; t; t = t.baseType) {
                    Type$_getEventDispatchers(t).initNewEvent.dispatch(t, { entity: this });
                }
            }
        }
    }
    var ctor = ctorFactory(construct);
    // If the namespace already contains a type with this name, prepend a '$' to the name
    if (!namespaceObj[finalName]) {
        namespaceObj[finalName] = ctor;
    }
    else {
        namespaceObj['$' + finalName] = ctor;
    }
    // If the global object already contains a type with this name, append a '$' to the name
    if (!globalObj[finalName]) {
        globalObj[finalName] = ctor;
    }
    else {
        globalObj['$' + finalName] = ctor;
    }
    // Setup inheritance
    var baseCtor = null;
    if (baseCtor) {
        baseCtor = baseType.ctor;
        // TODO: Implement `inheritBaseTypePropShortcuts`
        // inherit all shortcut properties that have aleady been defined
        // inheritBaseTypePropShortcuts(ctor, baseType);
    }
    else {
        baseCtor = Entity;
    }
    disableConstruction = true;
    ctor.prototype = new baseCtor();
    disableConstruction = false;
    ctor.prototype.constructor = ctor;
    // Add the 'meta' helper
    Object.defineProperty(ctor, "meta", { enumerable: false, value: type, configurable: false, writable: false });
    return ctor;
}

var intrinsicJsTypes = ["Object", "String", "Number", "Boolean", "Date", "TimeSpan", "Array"];
var ModelSettingsImplementation = /** @class */ (function () {
    function ModelSettingsImplementation(createOwnProperties) {
        Object.defineProperty(this, "createOwnProperties", { configurable: false, enumerable: true, value: createOwnProperties, writable: false });
    }
    return ModelSettingsImplementation;
}());
var ModelSettingsDefaults = {
    // There is a slight speed cost to creating own properties,
    // which may be noticeable with very large object counts.
    createOwnProperties: false,
};
var ModelEventDispatchers = /** @class */ (function () {
    function ModelEventDispatchers() {
        // TODO: Don't construct events by default, only when subscribed (optimization)
        // TODO: Extend `EventDispatcher` with `any()` function to check for subscribers (optimization)
        this.typeAddedEvent = new dist_1$1();
        this.entityRegisteredEvent = new dist_1$1();
        this.entityUnregisteredEvent = new dist_1$1();
        this.propertyAddedEvent = new dist_1$1();
    }
    return ModelEventDispatchers;
}());
var Model$_allTypesRoot = {};
var Model = /** @class */ (function () {
    function Model(createOwnProperties) {
        if (createOwnProperties === void 0) { createOwnProperties = undefined; }
        Object.defineProperty(this, "settings", { configurable: false, enumerable: true, value: Model$_createSettingsObject(createOwnProperties), writable: false });
        Object.defineProperty(this, "_types", { value: {} });
        Object.defineProperty(this, "_eventDispatchers", { value: new ModelEventDispatchers() });
    }
    Object.defineProperty(Model.prototype, "typeAddedEvent", {
        get: function () {
            return this._eventDispatchers.typeAddedEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "entityRegisteredEvent", {
        get: function () {
            return this._eventDispatchers.entityRegisteredEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "entityUnregisteredEvent", {
        get: function () {
            return this._eventDispatchers.entityUnregisteredEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "propertyAddedEvent", {
        get: function () {
            return this._eventDispatchers.propertyAddedEvent.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Model.prototype.dispose = function () {
        // TODO: Implement model disposal
        // for (var key in this._types) {
        // 	delete window[key];
        // }
    };
    Object.defineProperty(Model.prototype, "types", {
        get: function () {
            var typesArray = [];
            for (var typeName in this._types) {
                if (this._types.hasOwnProperty(typeName)) {
                    typesArray.push(this._types[typeName]);
                }
            }
            return typesArray;
        },
        enumerable: true,
        configurable: true
    });
    Model.prototype.addType = function (name, baseType, origin) {
        if (baseType === void 0) { baseType = null; }
        if (origin === void 0) { origin = "client"; }
        var type = Type$create(this, name, baseType, origin);
        this._types[name] = type;
        this._eventDispatchers.typeAddedEvent.dispatch(this, { type: type });
        return type;
    };
    Model.prototype.registerRule = function (rule) {
        if (!this._ruleQueue) {
            this._ruleQueue.push(rule);
        }
        else {
            rule.register();
        }
    };
    Model.prototype.registerRules = function () {
        var i, rules = this._ruleQueue;
        delete this._ruleQueue;
        for (i = 0; i < rules.length; i += 1) {
            rules[i].register();
        }
    };
    return Model;
}());
function Model$_createSettingsObject(createOwnProperties) {
    if (createOwnProperties === void 0) { createOwnProperties = ModelSettingsDefaults.createOwnProperties; }
    return new ModelSettingsImplementation(createOwnProperties);
}
function Model$_getEventDispatchers(model) {
    return model._eventDispatchers;
}
function Model$whenTypeAvailable(type, forceLoad, callback) {
    // Immediately invoke the callback if no type was specified
    if (!type) {
        // TODO: Warn about no type provided to `Model$whenTypeAvailable()`?
        return callback();
    }
    /*
    // TODO: Implement check for lazy loading?
    if (!LazyLoader.isLoaded(type)) {

        // force type loading if requested
        if (forceLoad) {
            LazyLoader.load(type, null, false, callback);
        }

        // otherwise, only continue processing when and if dependent types are loaded
        else {
            $extend(type._fullName, callback);
        }
    }
    */
    return callback();
}
/**
 * Retrieves the JavaScript constructor function corresponding to the given full type name.
 * @param fullName The full name of the type, including the namespace
 * @param allowUndefined If true, return undefined if the type is not defined
 */
function Model$getJsType(fullName, allowUndefined) {
    if (allowUndefined === void 0) { allowUndefined = false; }
    var steps = fullName.split(".");
    if (steps.length === 1 && intrinsicJsTypes.indexOf(fullName) > -1) {
        return Model$_allTypesRoot[fullName];
    }
    else {
        var obj = void 0;
        var ns = Model$_allTypesRoot;
        for (var i = 0; ns !== undefined && i < steps.length - 1; i++) {
            var step = steps[i];
            ns = ns[step];
        }
        if (ns !== undefined) {
            obj = ns[steps.length - 1];
        }
        if (obj === undefined) {
            if (allowUndefined) {
                return;
            }
            else {
                throw new Error("The type \"" + fullName + "\" could not be found.  Failed on step \"" + step + "\".");
            }
        }
        return obj;
    }
}
function Model$getPropertyOrPropertyChain(pathOrTokens, thisType, forceLoadTypes, callback, thisPtr) {
    if (thisType === void 0) { thisType = null; }
    if (forceLoadTypes === void 0) { forceLoadTypes = false; }
    if (thisPtr === void 0) { thisPtr = null; }
    var type, loadProperty, singlePropertyName, path = null, tokens = null;
    // forceLoadTypes = arguments.length >= 3 && arguments[2] && arguments[2].constructor === Boolean ? arguments[2] : false,
    // callback: ((chain: Property | PropertyChain) => void) = arguments[3],
    // thisPtr = arguments[4],
    // Allow the path argument to be either a string or PathTokens instance.
    if (pathOrTokens.constructor === PathTokens) {
        tokens = pathOrTokens;
        path = tokens.expression;
    }
    else if (typeof pathOrTokens === "string") {
        path = pathOrTokens;
    }
    else {
        throw new Error("Invalid valud for argument `pathOrTokens`.");
    }
    // Return cached property chains as soon as possible (in other words,
    // do as little as possible prior to returning the cached chain).
    if (thisType && thisType._chains && thisType._chains[path]) {
        if (callback) {
            callback.call(thisPtr || this, thisType._chains[path]);
            return null;
        }
        else {
            return thisType._chains[path];
        }
    }
    // The path argument was a string, so use it to create a PathTokens object.
    // Delay doing this as an optimization for cached property chains.
    if (!tokens) {
        tokens = new PathTokens(path);
    }
    // get the instance type, if specified
    type = thisType instanceof Function ? thisType.meta : thisType;
    // determine if a typecast was specified for the path to identify a specific subclass to use as the root type
    if (tokens.steps[0].property === "this" && tokens.steps[0].cast) {
        //Try and resolve cast to an actual type in the model
        type = Model$getJsType(tokens.steps[0].cast, false).meta;
        tokens.steps.shift();
    }
    // create a function to lazily load a property 
    loadProperty = function (containingType, propertyName, propertyCallback) {
        Model$whenTypeAvailable(containingType, forceLoadTypes, function () {
            propertyCallback.call(thisPtr || this, containingType.getProperty(propertyName));
        });
    };
    // Optimize for a single property expression, as it is neither static nor a chain.
    if (tokens.steps.length === 1) {
        singlePropertyName = tokens.steps[0].property;
        if (callback) {
            loadProperty(type, singlePropertyName, callback);
        }
        else {
            return type.property(singlePropertyName);
        }
    }
    // otherwise, first see if the path represents a property chain, and if not, a global property
    else {
        // predetermine the global type name and property name before seeing if the path is an instance path
        var globalTypeName = tokens.steps
            .slice(0, tokens.steps.length - 1)
            .map(function (item) { return item.property; })
            .join(".");
        var globalPropertyName = tokens.steps[tokens.steps.length - 1].property;
        // Copy of the Model.property arguments for async re-entry.
        var outerArgs = Array.prototype.slice.call(arguments);
        // create a function to see if the path is a global property if instance processing fails
        var processGlobal = function (instanceParseError) {
            // Retrieve the javascript type by name.
            type = Model$getJsType(globalTypeName, true);
            // Handle non-existant or non-loaded type.
            if (!type) {
                // // TODO: Implement lazy loading of types?
                // if (callback) {
                // 	// Retry when type is loaded
                // 	$extend(globalTypeName, Model$getPropertyOrPropertyChain.prepare(Model, outerArgs));
                // 	return null;
                // } else {
                throw new Error(instanceParseError ? instanceParseError : ("Error getting type \"" + globalTypeName + "\"."));
            }
            // Get the corresponding meta type.
            type = type.meta;
            // return the static property
            if (callback) {
                loadProperty(type, globalPropertyName, callback);
            }
            else {
                return type.getProperty(globalPropertyName);
            }
        };
        if (callback) {
            PropertyChain$create.call(null, type, tokens, forceLoadTypes, thisPtr ? callback.bind(thisPtr) : callback, processGlobal);
        }
        else {
            return PropertyChain$create.call(null, type, tokens, forceLoadTypes) || processGlobal(null);
        }
    }
}

var Format = /** @class */ (function () {
    function Format(options) {
        if (!options.hasOwnProperty("specifier") || typeof (options.specifier) !== "string") {
            throw new Error("Format specifier string must be provided.");
        }
        this.specifier = options.specifier;
        this.convertFn = options.convert;
        this.convertBackFn = options.convertBack;
        this.description = options.description;
        this.nullString = options.nullString || "";
        this.undefinedString = options.undefinedString || "";
        this.formatEval = options.formatEval;
    }
    Format.prototype.convert = function (val) {
        if (val === undefined) {
            return this.undefinedString;
        }
        if (val === null) {
            return this.nullString;
        }
        // TODO: Implement FormatError
        // if (val instanceof FormatError) {
        // 	return val.get_invalidValue();
        // }
        if (!this.convertFn) {
            return val;
        }
        return this.convertFn(val);
    };
    Format.prototype.convertBack = function (val) {
        if (val === null || val == this.nullString) {
            return null;
        }
        if (val === undefined || val == this.undefinedString) {
            return;
        }
        if (val.constructor == String) {
            val = val.trim();
            if (val.length === 0) {
                return null;
            }
        }
        if (!this.convertBackFn) {
            return val;
        }
        /*
        try {
        */
        return this.convertBackFn(val);
        /*
        } catch (err) {
            // TODO: Implement FormatError
            // if (err instanceof FormatError) {
            // 	return err;
            // }

            return new FormatError(this._description ?
                Resource.get("format-with-description").replace('{description}', this._description) :
                Resource.get("format-without-description"),
                val);
        }
        */
    };
    Format.prototype.toString = function () {
        return this.specifier;
    };
    return Format;
}());

// import { EventDispatcherIEvent, IEventHandler } from "ste-events";
var Model$1 = Model;
var Type$1 = Type;
var Property$1 = Property;
var PropertyChain$1 = PropertyChain;
var Entity$1 = Entity;
var ObjectMeta$1 = ObjectMeta;
var Format$1 = Format;
var Rule$1 = Rule;
var CalculatedPropertyRule$1 = CalculatedPropertyRule;

exports.Model = Model$1;
exports.Type = Type$1;
exports.Property = Property$1;
exports.PropertyChain = PropertyChain$1;
exports.Entity = Entity$1;
exports.ObjectMeta = ObjectMeta$1;
exports.Format = Format$1;
exports.Rule = Rule$1;
exports.CalculatedPropertyRule = CalculatedPropertyRule$1;
