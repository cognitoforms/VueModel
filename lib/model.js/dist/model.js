/*!
 * Model.js v0.0.12
 * (c) 2018 Cognito LLC
 * Released under the MIT License.
 */
var Model = (function () {
	'use strict';

	var Entity = /** @class */ (function () {
	    function Entity() {
	    }
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
	                var prop = this.meta.type.property(name);
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
	                var prop = this.meta.type.property(name);
	                if (!prop)
	                    throw new Error("Could not find property \"" + name + "\" on type \"" + this.meta.type.fullName + "\".");
	                prop.value(this, value);
	            }
	        }
	    };
	    Entity.prototype.get = function (property) {
	        return this.meta.type.property(property).value(this);
	    };
	    Entity.prototype.toString = function (format) {
	        return Entity.toIdString(this);
	    };
	    // Gets the typed string id suitable for roundtripping via fromIdString
	    Entity.toIdString = function (obj) {
	        return obj.meta.type.fullName + "|" + obj.meta.id;
	    };
	    // Gets or loads the entity with the specified typed string id
	    Entity.fromIdString = function (idString) {
	        // Typed identifiers take the form "type|id".
	        var type = idString.substring(0, idString.indexOf("|"));
	        var id = idString.substring(type.length + 1);
	        // Use the left-hand portion of the id string as the object's type.
	        var jstype = Model.getJsType(type);
	        // Retrieve the object with the given id.
	        return jstype.meta.get(id, 
	        // Typed identifiers may or may not be the exact type of the instance.
	        // An id string may be constructed with only knowledge of the base type.
	        false);
	    };
	    return Entity;
	}());

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

	var fieldNamePrefix = createSecret('Property.fieldNamePrefix', 3, false, true, "_fN");
	var PropertyEventDispatchers = /** @class */ (function () {
	    function PropertyEventDispatchers() {
	        this.changed = new dist_1$1();
	        this.accessed = new dist_1$1();
	    }
	    return PropertyEventDispatchers;
	}());
	var Property = /** @class */ (function () {
	    function Property(containingType, name, jstype, label, helptext, format, isList, isStatic, isPersisted, isCalculated, defaultValue, origin) {
	        if (defaultValue === void 0) { defaultValue = undefined; }
	        if (origin === void 0) { origin = containingType.originForNewProperties; }
	        // Public read-only properties
	        Object.defineProperty(this, "containingType", { enumerable: true, value: containingType });
	        Object.defineProperty(this, "name", { enumerable: true, value: name });
	        Object.defineProperty(this, "jstype", { enumerable: true, value: jstype });
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
	        Object.defineProperty(this, "_eventDispatchers", { value: new PropertyEventDispatchers() });
	        Object.defineProperty(this, "_getter", { value: Property$_makeGetter(this, Property$_getter) });
	        Object.defineProperty(this, "_setter", { value: Property$_makeSetter(this, Property$_setter) });
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
	            return this._eventDispatchers.changed.asEvent();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Property.prototype, "accessedEvent", {
	        get: function () {
	            return this._eventDispatchers.accessed.asEvent();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Property.prototype.equals = function (prop /* | PropertyChain */) {
	        if (prop !== undefined && prop !== null) {
	            if (prop instanceof Property) {
	                return this === prop;
	            }
	            // TODO: Implement property chain
	            // else if (prop instanceof PropertyChain) {
	            // 	var props = prop.all();
	            // 	return props.length === 1 && this.equals(props[0]);
	            // }
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
	    Property.prototype.isDefinedBy = function (type) {
	        return this.containingType === type || type.isSubclassOf(this.containingType);
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
	                return getDefaultValue(this.isList, this.jstype);
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
	                if (valType.jstype === this.jstype) {
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
	            return valObjectType === this.jstype ||
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
	        var target = (this.isStatic ? this.containingType.jstype : obj);
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
	    Property.prototype.rootedPath = function (type) {
	        if (this.isDefinedBy(type)) {
	            return this.isStatic ? this.containingType.fullName + "." + this.name : this.name;
	        }
	    };
	    return Property;
	}());
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
	    Object.defineProperty(property.containingType.jstype, property.name, {
	        configurable: false,
	        enumerable: true,
	        get: property._getter,
	        set: property._setter
	    });
	}
	function Property$_generatePrototypeProperty(property) {
	    Object.defineProperty(property.containingType.jstype.prototype, property.name, {
	        configurable: false,
	        enumerable: true,
	        get: property._getter,
	        set: property._setter
	    });
	}
	function Property$_generateOwnProperty(property, obj) {
	    Object.defineProperty(obj, property.name, {
	        configurable: false,
	        enumerable: true,
	        get: property._getter,
	        set: property._setter
	    });
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
	            property._eventDispatchers.changed.dispatch(obj, eventArgs);
	            // TODO: Implement observer?
	            // Observer.raisePropertyChanged(target, property._name);
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
	    // Determine if the property has been initialized with a value
	    // and initialize the property if necessary
	    if (!obj.hasOwnProperty(property.fieldName)) {
	        // Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
	        if (!property.isCalculated) {
	            var target = (property.isStatic ? property.containingType.jstype : obj);
	            // TODO: Implement pendingInit
	            // target.meta.pendingInit(property, false);
	            var val = Property$_getInitialValue(property);
	            Object.defineProperty(target, property.fieldName, { value: val, writable: true });
	            if (Array.isArray(val)) {
	                Property$_subListEvents(obj, property, val);
	            }
	            // TODO: Implement observable?
	            // Observer.raisePropertyChanged(target, property._name);
	        }
	        // TODO: Implement pendingInit
	        // Mark the property as pending initialization
	        // obj.meta.pendingInit(property, true);
	    }
	}
	function Property$_getter(property, obj) {
	    // Ensure that the property has an initial (possibly default) value
	    Property$_ensureInited(property, obj);
	    var eventArgs = { property: property, value: obj[property.fieldName] };
	    // Raise get events
	    property._eventDispatchers.accessed.dispatch(obj, eventArgs);
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
	        throw new Error("Cannot set " + property.name + "=" + (val === undefined ? "<undefined>" : val) + " for instance " + obj.meta.type.fullName + "|" + obj.meta.id + ": a value of type " + (property.jstype && property.jstype.meta ? property.jstype.meta.fullName : parseFunctionName(property.jstype)) + " was expected.");
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
	        return (oldValue !== newValue && !(property.jstype === Number && isNaN(oldValue) && isNaN(newValue)));
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
	        // Set the backing field value
	        obj[property.fieldName] = val;
	        // TODO: Implement pendingInit
	        // obj.meta.pendingInit(property, false);
	        // Do not raise change if the property has not been initialized. 
	        if (old !== undefined) {
	            var eventArgs = { property: property, newValue: val, oldValue: old };
	            if (additionalArgs) {
	                for (var arg in additionalArgs) {
	                    if (additionalArgs.hasOwnProperty(arg)) {
	                        eventArgs[arg] = additionalArgs[arg];
	                    }
	                }
	            }
	            property._eventDispatchers.changed.dispatch(obj, eventArgs);
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
	            t._eventDispatchers.destroy.dispatch(t, { entity: this.entity });
	        }
	    };
	    return ObjectMeta;
	}());

	var newIdPrefix = "+c";
	var TypeEventDispatchers = /** @class */ (function () {
	    function TypeEventDispatchers() {
	        this.initNew = new dist_1$1();
	        this.initExisting = new dist_1$1();
	        this.destroy = new dist_1$1();
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
	        Object.defineProperty(this, "jstype", { enumerable: true, value: Type$_generateClass(this, fullName, baseType) });
	        Object.defineProperty(this, "baseType", { enumerable: true, value: baseType });
	        // Public settable properties
	        this.origin = origin;
	        this.originForNewProperties = this.origin;
	        // Backing fields for properties
	        Object.defineProperty(this, "_counter", { enumerable: false, value: 0, writable: true });
	        Object.defineProperty(this, "_pool", { enumerable: false, value: {}, writable: false });
	        Object.defineProperty(this, "_legacyPool", { enumerable: false, value: {}, writable: false });
	        Object.defineProperty(this, "_properties", { enumerable: false, value: {}, writable: false });
	        Object.defineProperty(this, '_derivedTypes', { enumerable: false, value: [], writable: false });
	        Object.defineProperty(this, "_eventDispatchers", { value: new TypeEventDispatchers() });
	        // TODO: Implement rules
	        // Object.defineProperty(this, "rules", { value: [] });
	        // Register the type with the model
	        model._types[fullName] = this;
	        // TODO: Is self-reference to type needed?
	        // Add self-reference to decrease the likelihood of errors
	        // due to an absence of the necessary type vs. entity.
	        // this.type = this;
	    }
	    Object.defineProperty(Type.prototype, "destroyEvent", {
	        get: function () {
	            return this._eventDispatchers.destroy.asEvent();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Type.prototype, "initNewEvent", {
	        get: function () {
	            return this._eventDispatchers.initNew.asEvent();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Type.prototype, "initExistingEvent", {
	        get: function () {
	            return this._eventDispatchers.initExisting.asEvent();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Type, "newIdPrefix", {
	        get: function () {
	            return newIdPrefix.substring(1);
	        },
	        set: function (value) {
	            if (typeof (value) !== "string")
	                throw new TypeError("Property `Type.newIdPrefix` must be a string, found <" + (typeof value) + ">");
	            if (value.length === 0)
	                throw new Error("Property `Type.newIdPrefix` cannot be empty string");
	            newIdPrefix = "+" + value;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Type.prototype.newId = function () {
	        // Get the next id for this type's heirarchy.
	        for (var nextId, type = this; type; type = type.baseType) {
	            nextId = Math.max(nextId || 0, type._counter);
	        }
	        // Update the counter for each type in the heirarchy.
	        for (var type = this; type; type = type.baseType) {
	            type._counter = nextId + 1;
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
	        if (this.model._settings.createOwnProperties === true) {
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
	            this.model._eventDispatchers.entityRegistered.dispatch(this.model, { entity: obj });
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
	        this.model._eventDispatchers.entityUnregistered.dispatch(this.model, { entity: obj });
	    };
	    Type.prototype.get = function (id, exactTypeOnly) {
	        if (exactTypeOnly === void 0) { exactTypeOnly = false; }
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
	        Property$_generateShortcuts(property, property.containingType.jstype);
	        if (property.isStatic) {
	            Property$_generateStaticProperty(property);
	        }
	        else if (this.model._settings.createOwnProperties === true) {
	            for (var id in this._pool) {
	                if (Object.prototype.hasOwnProperty.call(this._pool, id)) {
	                    Property$_generateOwnProperty(property, this._pool[id]);
	                }
	            }
	        }
	        else {
	            Property$_generatePrototypeProperty(property);
	        }
	        this.model._eventDispatchers.propertyAdded.dispatch(this.model, { property: property });
	        return property;
	    };
	    Type.prototype.property = function (name) {
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
	    Object.defineProperty(Type.prototype, "derivedTypes", {
	        get: function () {
	            return this._derivedTypes;
	        },
	        enumerable: true,
	        configurable: true
	    });
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
	function Type$_generateClass(type, fullName, baseType) {
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
	    var jstypeFactory = new Function("construct", "return function " + finalName + " () { construct.apply(this, arguments); }");
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
	                    t._eventDispatchers.initExisting.dispatch(t, { entity: this });
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
	                    t._eventDispatchers.initNew.dispatch(t, { entity: this });
	                }
	            }
	        }
	    }
	    var jstype = jstypeFactory(construct);
	    var ctor = jstype;
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
	    var baseJsType = null;
	    if (baseJsType) {
	        baseJsType = baseType.jstype;
	        // TODO: Implement `inheritBaseTypePropShortcuts`
	        // inherit all shortcut properties that have aleady been defined
	        // inheritBaseTypePropShortcuts(jstype, baseType);
	    }
	    else {
	        baseJsType = Entity;
	    }
	    disableConstruction = true;
	    jstype.prototype = new baseJsType();
	    disableConstruction = false;
	    jstype.prototype.constructor = jstype;
	    // Add the 'meta' helper
	    Object.defineProperty(jstype, "meta", { enumerable: false, value: type, configurable: false, writable: false });
	    return jstype;
	}

	var intrinsicJsTypes = ["Object", "String", "Number", "Boolean", "Date", "TimeSpan", "Array"];
	var ModelSettingsDefaults = {
	    // There is a slight speed cost to creating own properties,
	    // which may be noticeable with very large object counts.
	    createOwnProperties: false,
	};
	var ModelEventDispatchers = /** @class */ (function () {
	    function ModelEventDispatchers() {
	        // TODO: Don't construct events by default, only when subscribed (optimization)
	        // TODO: Extend `EventDispatcher` with `any()` function to check for subscribers (optimization)
	        this.typeAdded = new dist_1$1();
	        this.entityRegistered = new dist_1$1();
	        this.entityUnregistered = new dist_1$1();
	        this.propertyAdded = new dist_1$1();
	    }
	    return ModelEventDispatchers;
	}());
	var Model$_allTypesRoot = {};
	var Model = /** @class */ (function () {
	    function Model(createOwnProperties) {
	        if (createOwnProperties === void 0) { createOwnProperties = undefined; }
	        Object.defineProperty(this, "_types", { value: {} });
	        Object.defineProperty(this, "_settings", { value: Model$_createSettingsObject(createOwnProperties) });
	        Object.defineProperty(this, "_eventDispatchers", { value: new ModelEventDispatchers() });
	    }
	    Object.defineProperty(Model.prototype, "typeAddedEvent", {
	        get: function () {
	            return this._eventDispatchers.typeAdded.asEvent();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Model.prototype, "entityRegisteredEvent", {
	        get: function () {
	            return this._eventDispatchers.entityRegistered.asEvent();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Model.prototype, "entityUnregisteredEvent", {
	        get: function () {
	            return this._eventDispatchers.entityUnregistered.asEvent();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Model.prototype, "propertyAddedEvent", {
	        get: function () {
	            return this._eventDispatchers.propertyAdded.asEvent();
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
	        var type = new Type(this, name, baseType, origin);
	        this._types[name] = type;
	        this._eventDispatchers.typeAdded.dispatch(this, { type: type });
	        return type;
	    };
	    /**
	     * Retrieves the JavaScript constructor function corresponding to the given full type name.
	     * @param name The name of the type
	     */
	    Model.getJsType = function (name, allowUndefined) {
	        if (allowUndefined === void 0) { allowUndefined = false; }
	        var obj = Model$_allTypesRoot;
	        var steps = name.split(".");
	        if (steps.length === 1 && intrinsicJsTypes.indexOf(name) > -1) {
	            return obj[name];
	        }
	        else {
	            for (var i = 0; i < steps.length; i++) {
	                var step = steps[i];
	                obj = obj[step];
	                if (obj === undefined) {
	                    if (allowUndefined) {
	                        return;
	                    }
	                    else {
	                        throw new Error("The type \"" + name + "\" could not be found.  Failed on step \"" + step + "\".");
	                    }
	                }
	            }
	            return obj;
	        }
	    };
	    return Model;
	}());
	function Model$_createSettingsObject(createOwnProperties) {
	    if (createOwnProperties === void 0) { createOwnProperties = ModelSettingsDefaults.createOwnProperties; }
	    var settings = {
	        createOwnProperties: createOwnProperties
	    };
	    return settings;
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

	var api = Model;
	// TODO: provide plugin model?
	api.Model = Model;
	api.Type = Type;
	api.Property = Property;
	api.Entity = Entity;
	api.Format = Format;

	return api;

}());
