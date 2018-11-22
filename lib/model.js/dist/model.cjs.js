/*!
 * Model.js v0.0.23
 * (c) 2018 Cognito LLC
 * Released under the MIT License.
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function Functor$create(returns) {
    if (returns === void 0) { returns = false; }
    var funcs = [];
    // TODO: Detect functor invocation resulting in continually adding subscribers
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
                if (returns) {
                    returnsArray.push(returnValue);
                }
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

function getGlobalObject() {
    if (typeof window === "object" && Object.prototype.toString.call(window) === "[object Window]") {
        return window;
    }
    else if (typeof global === "object") {
        return global;
    }
    else {
        return null;
    }
}
function ensureNamespace(name, parentNamespace) {
    var result, nsTokens, target = parentNamespace;
    if (typeof target === "string") {
        nsTokens = target.split(".");
        target = getGlobalObject();
        nsTokens.forEach(function (token) {
            target = target[token];
            if (target === undefined) {
                throw new Error("Parent namespace \"" + parentNamespace + "\" could not be found.");
            }
        });
    }
    else if (target === undefined || target === null) {
        target = getGlobalObject();
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
function isObject(obj) {
    return getTypeName(obj) === "object" || (obj && obj instanceof Object);
}
// If a getter method matching the given property name is found on the target it is invoked and returns the 
// value, unless the the value is undefined, in which case null is returned instead.  This is done so that 
// calling code can interpret a return value of undefined to mean that the property it requested does not exist.
function getValue(target, property) {
    var value;
    // the see if there is an explicit getter function for the property
    var getter = target["get_" + property];
    if (getter) {
        value = getter.call(target);
        if (value === undefined) {
            value = null;
        }
    }
    // otherwise search for the property
    else {
        if ((isObject(target) && property in target) ||
            Object.prototype.hasOwnProperty.call(target, property) ||
            (target.constructor === String && /^[0-9]+$/.test(property) && parseInt(property, 10) < target.length)) {
            value = target[property];
            if (value === undefined) {
                value = null;
            }
        }
        else if (/\./.test(property)) ;
    }
    return value;
}
function evalPath(obj, path, nullValue, undefinedValue) {
    if (nullValue === void 0) { nullValue = null; }
    if (undefinedValue === void 0) { undefinedValue = undefined; }
    var value = obj;
    var steps = path.split(".");
    for (var i = 0; i < steps.length; ++i) {
        var name = steps[i];
        var source = value;
        value = getValue(source, name);
        if (value === null) {
            return nullValue;
        }
        if (value === undefined) {
            return undefinedValue;
        }
    }
    return value;
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
function randomInt(min, max) {
    if (min === void 0) { min = 0; }
    if (max === void 0) { max = 9; }
    var rand = Math.random();
    return rand === 1 ? max : Math.floor(rand * (max - min + 1)) + min;
}
function randomText(len, includeLetters, includeDigits) {
    if (includeLetters === void 0) { includeLetters = true; }
    if (includeDigits === void 0) { includeDigits = true; }
    if (!includeLetters && !includeDigits) {
        return;
    }
    var result = "";
    for (var i = 0; i < len; i++) {
        var min = includeLetters ? 0 : 26;
        var max = includeDigits ? 35 : 25;
        var rand = randomInt(min, max);
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
function getEventSubscriptions(event) {
    var func = event._func;
    if (func) {
        var funcs = func._funcs;
        if (funcs.length > 0) {
            var subs = funcs.map(function (f) { return { handler: f.fn, isExecuted: f.applied, isOnce: f.once }; });
            return subs;
        }
        else {
            return null;
        }
    }
}
function mixin(ctor, methods) {
    for (var key in methods) {
        if (hasOwnProperty(methods, key) && methods[key] instanceof Function) {
            ctor.prototype[key] = methods[key];
        }
    }
}

var EventObject = /** @class */ (function () {
    function EventObject() {
    }
    EventObject.prototype.stopPropagation = function () {
        // TODO: Implement 'stopPropagation()'?
        throw new Error("Method 'stopPropagation' is not implemented.");
    };
    return EventObject;
}());
function createEventObject(args) {
    var eventObject = new EventObject();
    for (var prop in args) {
        if (hasOwnProperty(args, prop)) {
            eventObject[prop] = args[prop];
        }
    }
    return eventObject;
}
var EventSubWrapper = /** @class */ (function () {
    function EventSubWrapper(event) {
        Object.defineProperty(this, "_event", { value: event });
    }
    EventSubWrapper.prototype.subscribe = function (handler) {
        this._event.subscribe(handler);
    };
    EventSubWrapper.prototype.subscribeOne = function (handler) {
        this._event.subscribeOne(handler);
    };
    EventSubWrapper.prototype.unsubscribe = function (handler) {
        this._event.unsubscribe(handler);
    };
    EventSubWrapper.prototype.hasSubscribers = function (handler) {
        return this._event.hasSubscribers(handler);
    };
    EventSubWrapper.prototype.clear = function () {
        this._event.clear();
    };
    return EventSubWrapper;
}());
var Event = /** @class */ (function () {
    function Event() {
    }
    Event.prototype.asEventSubscriber = function () {
        if (!this._subscriber) {
            Object.defineProperty(this, "_subscriber", { value: new EventSubWrapper(this) });
        }
        return this._subscriber;
    };
    Event.prototype.publish = function (thisObject, args) {
        if (!this._func) {
            // No subscribers
            return;
        }
        var eventObject = createEventObject(args);
        this._func.call(thisObject, eventObject);
    };
    Event.prototype.subscribe = function (handler) {
        if (!this._func) {
            Object.defineProperty(this, "_func", { value: Functor$create() });
        }
        this._func.add(handler);
    };
    Event.prototype.subscribeOne = function (handler) {
        if (!this._func) {
            Object.defineProperty(this, "_func", { value: Functor$create() });
        }
        this._func.add(handler, null, true);
    };
    Event.prototype.hasSubscribers = function (handler) {
        if (!this._func) {
            return false;
        }
        var functorItems = (this._func._funcs);
        return functorItems.some(function (i) { return i.fn === handler; });
    };
    Event.prototype.unsubscribe = function (handler) {
        if (!this._func) {
            // No subscribers
            return;
        }
        this._func.remove(handler);
    };
    Event.prototype.clear = function () {
        if (!this._func) {
            // No subscribers
            return;
        }
        this._func.clear();
    };
    return Event;
}());

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

var Resource = {
    "allowed-values": "{property} is not in the list of allowed values.",
    "compare-after": "{property} must be after {compareSource}.",
    "compare-before": "{property} must be before {compareSource}.",
    "compare-equal": "{property} must be the same as {compareSource}.",
    "compare-greater-than": "{property} must be greater than {compareSource}.",
    "compare-greater-than-or-equal": "{property} must be greater than or equal to {compareSource}.",
    "compare-less-than": "{property} must be less than {compareSource}.",
    "compare-less-than-or-equal": "{property} must be less than or equal to {compareSource}.",
    "compare-not-equal": "{property} must be different from {compareSource}.",
    "compare-on-or-after": "{property} must be on or after {compareSource}.",
    "compare-on-or-before": "{property} must be on or before {compareSource}.",
    "listlength-at-least": "Please specify at least {min} {property}.",
    "listlength-at-most": "Please specify no more than {max} {property}.",
    "listlength-between": "Please specify between {min} and {max} {property}.",
    "range-at-least": "{property} must be at least {min}.",
    "range-at-most": "{property} must be at most {max}.",
    "range-between": "{property} must be between {min} and {max}.",
    "range-on-or-after": "{property} must be on or after {min}.",
    "range-on-or-before": "{property} must be on or before {max}.",
    "required": "{property} is required.",
    "required-if-after": "{property} is required when {compareSource} is after {compareValue}.",
    "required-if-before": "{property} is required when {compareSource} is before {compareValue}.",
    "required-if-equal": "{property} is required when {compareSource} is {compareValue}.",
    "required-if-exists": "{property} is required when {compareSource} is specified.",
    "required-if-greater-than": "{property} is required when {compareSource} is greater than {compareValue}.",
    "required-if-greater-than-or-equal": "{property} is required when {compareSource} is greater than or equal to {compareValue}.",
    "required-if-less-than": "{property} is required when {compareSource} is less than {compareValue}.",
    "required-if-less-than-or-equal": "{property} is required when {compareSource} is less than or equal to {compareValue}.",
    "required-if-not-equal": "{property} is required when {compareSource} is not {compareValue}.",
    "required-if-not-exists": "{property} is required when {compareSource} is not specified.",
    "required-if-on-or-after": "{property} is required when {compareSource} is on or after {compareValue}.",
    "required-if-on-or-before": "{property} is required when {compareSource} is on or before {compareValue}.",
    "string-format": "{property} must be formatted as {formatDescription}.",
    "string-length-at-least": "{property} must be at least {min} characters.",
    "string-length-at-most": "{property} must be at most {max} characters.",
    "string-length-between": "{property} must be between {min} and {max} characters.",
    "format-with-description": "{property} must be formatted as {description}.",
    "format-without-description": "{property} is not properly formatted.",
    "format-currency": "$#,###.##",
    "format-percentage": "#.##%",
    "format-integer": "#,###",
    "format-decimal": "#,###.##",
    // gets the resource with the specified name
    get: function Resource$get(name) {
        return this[name];
    }
};

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
        Object.defineProperty(this, "_propertyChainAccessSubscriptions", { value: [] });
        Object.defineProperty(this, "_propertyChangeSubscriptions", { value: [] });
        Object.defineProperty(this, "_propertyChainChangeSubscriptions", { value: [] });
        Object.defineProperty(this, "_events", { value: new PropertyChainEvents() });
    }
    Object.defineProperty(PropertyChain.prototype, "changed", {
        get: function () {
            return this._events.changedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PropertyChain.prototype, "accessed", {
        get: function () {
            return this._events.accessedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    PropertyChain.prototype.equals = function (prop) {
        if (prop === null || prop === undefined) {
            return;
        }
        if (prop instanceof Property) {
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
    PropertyChain.prototype.getLastTarget = function (obj, exitEarly) {
        if (exitEarly === void 0) { exitEarly = false; }
        for (var p = 0; p < this._properties.length - 1; p++) {
            var prop = this._properties[p];
            // exit early on null or undefined
            if (obj === undefined || obj === null) {
                if (exitEarly) {
                    return obj;
                }
                else {
                    throw new Error("Property chain is not complete.");
                }
            }
            obj = prop.value(obj);
        }
        return obj;
    };
    PropertyChain.prototype.append = function (prop) {
        // TODO: Validate that the property or property chain is valid to append?
        var newProps = this._properties.slice();
        var newFilters = this._propertyFilters ? this._propertyFilters.slice() : new Array(this._properties.length);
        if (prop instanceof Property) {
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
        if (prop instanceof Property) {
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
                return this._properties[i].isStatic ? this._properties[i].containingType + "." + path : path;
            }
        }
    };
    Object.defineProperty(PropertyChain.prototype, "propertyType", {
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
    Object.defineProperty(PropertyChain.prototype, "label", {
        // get isStatic(): boolean {
        // 	return this.lastProperty.isStatic;
        // }
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
    // get name() {
    // 	return this.lastProperty.name;
    // }
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
    PropertyChain.prototype.getPath = function () {
        return this.path;
    };
    PropertyChain.prototype.toString = function () {
        var path = this._properties.map(function (e) { return e.name; }).join(".");
        return "this<" + this.rootType + ">." + path;
    };
    return PropertyChain;
}());
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
            fail("Path '" + pathTokens.expression + "' references unknown property \"" + step.property + "\" on type \"" + type + "\".");
            // return null if the property does not exist
            return null;
        }
        // ensure the property is not static because property chains are not valid for static properties
        if (prop.isStatic) {
            fail("Path '" + pathTokens.expression + "' references static property \"" + step.property + "\" on type \"" + type + "\".");
            // return null to indicate that the path references a static property
            return null;
        }
        // store the property for the step
        properties.push(prop);
        // handle optional type filters
        if (step.cast) {
            // determine the filter type
            type = Model$getJsType(step.cast, rootType.model._allTypesRoot, true).meta;
            if (!type) {
                fail("Path '" + pathTokens.expression + "' references an invalid type: \"" + step.cast + "\".");
                return null;
            }
            var jstype = type.jstype;
            filterTypes[properties.length] = jstype;
            filters[properties.length] = function (target) {
                return target instanceof jstype;
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
var PropertyChainEvents = /** @class */ (function () {
    function PropertyChainEvents() {
        this.changedEvent = new Event();
        this.accessedEvent = new Event();
    }
    return PropertyChainEvents;
}());
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
function onPropertyChainStepAccessed(chain, priorProp, entity, args) {
    // scan all known objects of this type and raise event for any instance connected
    // to the one that sent the event.
    chain.rootType.known().forEach(function (known) {
        if (chain.testConnection(known, args.property, priorProp)) {
            // Copy the original arguments so that we don't affect other code
            var newArgs = {
                property: args.property,
                value: args.value,
            };
            // Reset property to be the chain, but store the original property as "triggeredBy"
            newArgs.originalEntity = args.entity;
            newArgs.originalProperty = newArgs.property;
            newArgs.property = chain;
            // Call the handler, passing through the arguments
            chain._events.accessedEvent.publish(known, newArgs);
        }
    });
}
function updatePropertyAccessSubscriptions(chain, props, subscriptions) {
    var chainEventSubscriptions = getEventSubscriptions(chain._events.accessedEvent);
    var chainEventSubscriptionsExist = chainEventSubscriptions && chainEventSubscriptions.length > 0;
    var subscribedToPropertyChanges = subscriptions !== null && subscriptions.length > 0;
    if (!chainEventSubscriptionsExist && subscribedToPropertyChanges) {
        // If there are no more subscribers then unsubscribe from property-level events
        props.forEach(function (prop, index) { return prop.accessed.unsubscribe(subscriptions[index].handler); });
        subscriptions.length = 0;
    }
    if (chainEventSubscriptionsExist && !subscribedToPropertyChanges) {
        // If there are subscribers and we have not subscribed to property-level events, then do so
        subscriptions.length = 0;
        props.forEach(function (prop, index) {
            var priorProp = (index === 0) ? undefined : props[index - 1];
            var handler = function (args) { onPropertyChainStepAccessed(chain, priorProp, this, args); };
            prop._events.accessedEvent.subscribe(handler);
            subscriptions.push({ registeredHandler: handler, handler: handler });
        }, chain);
    }
}
function PropertyChain$_addAccessedHandler(chain, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    var propertyAccessFilters = Functor$create(true);
    var context = null;
    var filteredHandler = null;
    if (obj) {
        propertyAccessFilters.add(function (entity) { return entity === obj; });
        context = obj;
    }
    // TODO: Implement partial access tolerance if implementing lazy loading...
    propertyAccessFilters.add(function (entity) { return chain.isInited(entity, true); });
    updatePropertyAccessSubscriptions(chain, chain._properties, chain._propertyAccessSubscriptions);
    filteredHandler = function (args) {
        var filterResults = propertyAccessFilters(args.entity);
        if (!filterResults.some(function (b) { return !b; })) {
            handler.call(this, args);
        }
    };
    chain._events.accessedEvent.subscribe(filteredHandler);
    chain._propertyChainAccessSubscriptions.push({ registeredHandler: filteredHandler, handler: handler, context: context });
}
function PropertyChain$_removeAccessedHandler(chain, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    chain._propertyAccessSubscriptions.forEach(function (sub) {
        if (handler === sub.handler && ((!obj && !sub.context) || (obj && obj === sub.context))) {
            chain._events.accessedEvent.unsubscribe(sub.registeredHandler);
        }
    });
}
function onPropertyChainStepChanged(chain, priorProp, entity, args) {
    // scan all known objects of this type and raise event for any instance connected
    // to the one that sent the event.
    chain.rootType.known().forEach(function (known) {
        if (chain.testConnection(known, args.property, priorProp)) {
            // Copy the original arguments so that we don't affect other code
            var newArgs = {
                property: args.property,
                oldValue: args.oldValue,
                newValue: args.newValue,
            };
            // Reset property to be the chain, but store the original property as "triggeredBy"
            newArgs.originalEntity = args.entity;
            newArgs.originalProperty = args.property;
            newArgs.property = chain;
            // Call the handler, passing through the arguments
            chain._events.changedEvent.publish(known, newArgs);
        }
    });
}
function updatePropertyChangeSubscriptions(chain, props, subscriptions) {
    if (props === void 0) { props = null; }
    var chainEventSubscriptions = getEventSubscriptions(chain._events.changedEvent);
    var chainEventSubscriptionsExist = chainEventSubscriptions && chainEventSubscriptions.length > 0;
    var subscribedToPropertyChanges = subscriptions !== null && subscriptions.length > 0;
    if (!chainEventSubscriptionsExist && subscribedToPropertyChanges) {
        // If there are no more subscribers then unsubscribe from property-level events
        props.forEach(function (prop, index) { return prop.changed.unsubscribe(subscriptions[index].registeredHandler); });
        subscriptions.length = 0;
    }
    if (chainEventSubscriptionsExist && !subscribedToPropertyChanges) {
        // If there are subscribers and we have not subscribed to property-level events, then do so
        subscriptions.length = 0;
        props.forEach(function (prop, index) {
            var priorProp = (index === 0) ? undefined : props[index - 1];
            var handler = function (args) { onPropertyChainStepChanged(chain, priorProp, this, args); };
            prop.changed.subscribe(handler);
            subscriptions.push({ registeredHandler: handler, handler: handler });
        }, chain);
    }
}
// starts listening for change events along the property chain on any known instances. Use obj argument to
// optionally filter the events to a specific object
function PropertyChain$_addChangedHandler(chain, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    var propertyChangeFilters = Functor$create(true);
    var context;
    var filteredHandler = null;
    if (obj) {
        propertyChangeFilters.add(function (entity) { return entity === obj; });
        context = obj;
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
    propertyChangeFilters.add(function (entity) { return chain.isInited(entity, true); });
    updatePropertyChangeSubscriptions(chain, chain._properties, chain._propertyChangeSubscriptions);
    filteredHandler = function (args) {
        var filterResults = propertyChangeFilters(args.entity);
        if (!filterResults.some(function (b) { return !b; })) {
            handler.call(this, args);
        }
    };
    chain._events.changedEvent.subscribe(filteredHandler);
    chain._propertyChainChangeSubscriptions.push({ registeredHandler: filteredHandler, handler: handler, context: context });
}
function PropertyChain$_removeChangedHandler(chain, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    chain._propertyChangeSubscriptions.forEach(function (sub) {
        if (handler === sub.handler && ((!obj && !sub.context) || (obj && obj === sub.context))) {
            chain._events.changedEvent.unsubscribe(sub.registeredHandler);
        }
    });
}

var ObservableArray = /** @class */ (function () {
    function ObservableArray() {
    }
    /**
     * Returns a value indicating whether the given array is observable
     * @param array The array to check for observability
     */
    ObservableArray.isObservableArray = function (array) {
        return hasOwnProperty(array, "__ob__") && array.__ob__.constructor === ArrayObserver;
    };
    /**
     * Makes the given array observable, if not already
     * @param array The array to make observable
     */
    ObservableArray.ensureObservable = function (array) {
        if (this.isObservableArray)
            // Check to see if the array is already an observable list
            if (ObservableArray.isObservableArray(array)) {
                return array;
            }
        if (hasOwnProperty(array, '__ob__')) {
            // TODO: Warn about invalid '__ob__' property?
            return;
        }
        Object.defineProperty(array, "__ob__", {
            configurable: false,
            enumerable: false,
            value: new ArrayObserver(array),
            writable: false
        });
        Object.defineProperty(array, 'changed', {
            configurable: false,
            enumerable: true,
            get: function () {
                return this.__ob__.changedEvent.asEventSubscriber();
            }
        });
        array["batchUpdate"] = ObservableArray$batchUpdate;
        ObservableArray$_overrideNativeMethods.call(array);
        return array;
    };
    /**
     * Creates a new observable array
     * @param items The initial array items
     */
    ObservableArray.create = function (items) {
        if (items === void 0) { items = null; }
        var array = new (ObservableArrayImplementation.bind.apply(ObservableArrayImplementation, [void 0].concat(items)))();
        ObservableArray.ensureObservable(array);
        return array;
    };
    return ObservableArray;
}());
var ArrayChangeType;
(function (ArrayChangeType) {
    ArrayChangeType[ArrayChangeType["remove"] = 0] = "remove";
    ArrayChangeType[ArrayChangeType["add"] = 1] = "add";
    ArrayChangeType[ArrayChangeType["replace"] = 2] = "replace";
    ArrayChangeType[ArrayChangeType["reorder"] = 4] = "reorder";
})(ArrayChangeType || (ArrayChangeType = {}));
var ObservableArrayImplementation = /** @class */ (function (_super) {
    __extends(ObservableArrayImplementation, _super);
    /**
     * Creates a new observable array
     * @param items The array of initial items
     */
    function ObservableArrayImplementation() {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        var _this = _super.apply(this, items) || this;
        Object.defineProperty(_this, "__ob__", {
            configurable: false,
            enumerable: false,
            value: new ArrayObserver(_this),
            writable: false
        });
        Object.defineProperty(_this, 'changed', {
            get: function () {
                return this.__ob__.changedEvent.asEventSubscriber();
            }
        });
        if (_this.constructor !== ObservableArrayImplementation) {
            _this["batchUpdate"] = (function (fn) { ObservableArray$batchUpdate.call(this, fn); });
            ObservableArray$_overrideNativeMethods.call(_this);
        }
        return _this;
    }
    Object.defineProperty(ObservableArrayImplementation.prototype, "changed", {
        /** Expose the changed event */
        get: function () {
            return this.__ob__.changedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Begin queueing changes to the array, make changes in the given callback function, then stop queueing and raise events
     */
    ObservableArrayImplementation.prototype.batchUpdate = function (fn) {
        ObservableArray$batchUpdate.call(this, fn);
    };
    /**
     * The copyWithin() method shallow copies part of an array to another location in the same array and returns it, without modifying its size.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin
     * @param target Zero based index at which to copy the sequence to. If negative, target will be counted from the end. If target is at or greater than arr.length, nothing will be copied. If target is positioned after start, the copied sequence will be trimmed to fit arr.length.
     * @param start Zero based index at which to start copying elements from. If negative, start will be counted from the end. If start is omitted, copyWithin will copy from the start (defaults to 0).
     * @param end Zero based index at which to end copying elements from. copyWithin copies up to but not including end. If negative, end will be counted from the end. If end is omitted, copyWithin will copy until the end (default to arr.length).
     * @returns The modified array.
     */
    ObservableArrayImplementation.prototype.copyWithin = function (target, start, end) {
        return ObservableArray$copyWithin.apply(this, arguments);
    };
    /**
     * The fill() method fills all the elements of an array from a start index to an end index with a static value. The end index is not included.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
     * @param value Value to fill an array.
     * @param start Start index, defaults to 0.
     * @param end End index, defaults to this.length.
     * @returns The modified array.
     */
    ObservableArrayImplementation.prototype.fill = function (value, start, end) {
        return ObservableArray$fill.apply(this, arguments);
    };
    /**
     * The pop() method removes the last element from an array and returns that element. This method changes the length of the array.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
     * @returns The removed element from the array; undefined if the array is empty.
     */
    ObservableArrayImplementation.prototype.pop = function () {
        return ObservableArray$pop.apply(this, arguments);
    };
    /**
     * The push() method adds one or more elements to the end of an array and returns the new length of the array.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
     * @param items The elements to add to the end of the array.
     * @returns The new length property of the object upon which the method was called.
     */
    ObservableArrayImplementation.prototype.push = function () {
        var elements = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elements[_i] = arguments[_i];
        }
        return ObservableArray$push.apply(this, arguments);
    };
    /**
     * The reverse() method reverses an array in place. The first array element becomes the last, and the last array element becomes the first.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse
     * @returns The reversed array.
     */
    ObservableArrayImplementation.prototype.reverse = function () {
        return ObservableArray$reverse.apply(this, arguments);
    };
    /**
     * The shift() method removes the first element from an array and returns that removed element. This method changes the length of the array.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
     * @returns The removed element from the array; undefined if the array is empty.
     */
    ObservableArrayImplementation.prototype.shift = function () {
        return ObservableArray$shift.apply(this, arguments);
    };
    /**
     * The sort() method sorts the elements of an array in place and returns the array. Javascript sort algorithm on V8 is now stable. The default sort order is according to string Unicode code points.
     * The time and space complexity of the sort cannot be guaranteed as it is implementation dependent.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
     * @param compareFunction Specifies a function that defines the sort order. If omitted, the array is sorted according to each character's Unicode code point value, according to the string conversion of each element.
     * @returns The sorted array. Note that the array is sorted in place, and no copy is made.
     */
    ObservableArrayImplementation.prototype.sort = function (compareFunction) {
        return ObservableArray$sort.apply(this, arguments);
    };
    /**
     * The splice() method changes the contents of an array by removing existing elements and/or adding new elements.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
     * @param start  Index at which to start changing the array (with origin 0). If greater than the length of the array, actual starting index will be set to the length of the array. If negative, will begin that many elements from the end of the array (with origin -1) and will be set to 0 if absolute value is greater than the length of the array.
     * @param deleteCount An integer indicating the number of old array elements to remove. If deleteCount is omitted, or if its value is larger than array.length - start (that is, if it is greater than the number of elements left in the array, starting at start), then all of the elements from start through the end of the array will be deleted. If deleteCount is 0 or negative, no elements are removed. In this case, you should specify at least one new element (see below).
     * @param items The elements to add to the array, beginning at the start index. If you don't specify any elements, splice() will only remove elements from the array.
     * @returns An array containing the deleted elements. If only one element is removed, an array of one element is returned. If no elements are removed, an empty array is returned.
     */
    ObservableArrayImplementation.prototype.splice = function (start, deleteCount) {
        var items = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            items[_i - 2] = arguments[_i];
        }
        return ObservableArray$splice.apply(this, arguments);
    };
    /**
     * The unshift() method adds one or more elements to the beginning of an array and returns the new length of the array.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
     * @param items The elements to add to the front of the array.
     * @returns The new length property of the object upon which the method was called.
     */
    ObservableArrayImplementation.prototype.unshift = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        return ObservableArray$unshift.apply(this, arguments);
    };
    return ObservableArrayImplementation;
}(Array));
/**
 * Override's native Array methods that manipulate the array
 * @param array The array to extend
 */
function ObservableArray$_overrideNativeMethods() {
    this["copyWithin"] = ObservableArray$copyWithin;
    this["fill"] = ObservableArray$fill;
    this["pop"] = ObservableArray$pop;
    this["push"] = ObservableArray$push;
    this["reverse"] = ObservableArray$reverse;
    this["shift"] = ObservableArray$shift;
    this["sort"] = ObservableArray$sort;
    this["splice"] = ObservableArray$splice;
    this["unshift"] = ObservableArray$unshift;
}
/**
 * Begin queueing changes to the array, make changes in the given callback function, then stop queueing and raise events
 */
function ObservableArray$batchUpdate(fn) {
    this.__ob__.startQueueingChanges();
    try {
        fn(this);
        this.__ob__.stopQueueingChanges(true);
    }
    finally {
        if (this.__ob__._isQueuingChanges) {
            this.__ob__.stopQueueingChanges(false);
        }
    }
}
/**
 * The copyWithin() method shallow copies part of an array to another location in the same array and returns it, without modifying its size.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin
 * @param array The observable array
 * @param target Zero based index at which to copy the sequence to. If negative, target will be counted from the end. If target is at or greater than arr.length, nothing will be copied. If target is positioned after start, the copied sequence will be trimmed to fit arr.length.
 * @param start Zero based index at which to start copying elements from. If negative, start will be counted from the end. If start is omitted, copyWithin will copy from the start (defaults to 0).
 * @param end Zero based index at which to end copying elements from. copyWithin copies up to but not including end. If negative, end will be counted from the end. If end is omitted, copyWithin will copy until the end (default to arr.length).
 */
function ObservableArray$copyWithin(target, start, end) {
    Array.prototype.copyWithin.apply(this, arguments);
    // TODO: Warn about non-observable manipulation of observable array?
    this.__ob__.raiseEvents({ type: ArrayChangeType.replace, startIndex: start, endIndex: end });
    return this;
}
/**
 * The fill() method fills all the elements of an array from a start index to an end index with a static value. The end index is not included.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
 * @param array The observable array
 * @param value Value to fill an array.
 * @param start Start index, defaults to 0.
 * @param end End index, defaults to this.length.
 */
function ObservableArray$fill(value, start, end) {
    Array.prototype.fill.apply(this, arguments);
    // TODO: Warn about non-observable manipulation of observable array?
    this.__ob__.raiseEvents({ type: ArrayChangeType.replace, startIndex: start, endIndex: end });
    return this;
}
/**
 * The pop() method removes the last element from an array and returns that element. This method changes the length of the array.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
 * @param array The observable array
 * @returns The removed element from the array; undefined if the array is empty.
 */
function ObservableArray$pop() {
    var originalLength = this.length;
    var removed = Array.prototype.pop.apply(this, arguments);
    if (this.length !== originalLength) {
        var removedIndex = originalLength - 1;
        this.__ob__.raiseEvents({ type: ArrayChangeType.remove, startIndex: removedIndex, endIndex: removedIndex, items: [removed] });
    }
    return removed;
}
/**
 * The push() method adds one or more elements to the end of an array and returns the new length of the array.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
 * @param array The observable array
 * @param items The elements to add to the end of the array.
 * @returns The new length property of the object upon which the method was called.
 */
function ObservableArray$push() {
    var items = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        items[_i] = arguments[_i];
    }
    var addedIndex = this.length;
    var addedCount = Array.prototype.push.apply(this, arguments);
    if (addedCount > 0) {
        this.__ob__.raiseEvents({ type: ArrayChangeType.add, startIndex: addedIndex, endIndex: addedIndex + addedCount, items: items });
    }
    return addedCount;
}
/**
 * The reverse() method reverses an array in place. The first array element becomes the last, and the last array element becomes the first.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse
 * @param array The observable array
 * @returns The reversed array.
 */
function ObservableArray$reverse() {
    Array.prototype.reverse.apply(this, arguments);
    // TODO: Warn about non-observable manipulation of observable array?
    this.__ob__.raiseEvents({ type: ArrayChangeType.reorder, startIndex: 0, endIndex: this.length - 1 });
    return this;
}
/**
 * The shift() method removes the first element from an array and returns that removed element. This method changes the length of the array.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
 * @param array The observable array
 * @returns The removed element from the array; undefined if the array is empty.
 */
function ObservableArray$shift() {
    var originalLength = this.length;
    var removed = Array.prototype.shift.apply(this, arguments);
    if (this.length !== originalLength) {
        this.__ob__.raiseEvents({ type: ArrayChangeType.remove, startIndex: 0, endIndex: 0, items: [removed] });
    }
    return removed;
}
/**
 * The sort() method sorts the elements of an array in place and returns the array. Javascript sort algorithm on V8 is now stable. The default sort order is according to string Unicode code points.
 * The time and space complexity of the sort cannot be guaranteed as it is implementation dependent.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
 * @param array The observable array
 * @param compareFunction Specifies a function that defines the sort order. If omitted, the array is sorted according to each character's Unicode code point value, according to the string conversion of each element.
 * @returns The sorted array. Note that the array is sorted in place, and no copy is made.
 */
function ObservableArray$sort(compareFunction) {
    var result = Array.prototype.sort.apply(this, arguments);
    // TODO: Warn about non-observable manipulation of observable array?
    this.__ob__.raiseEvents({ type: ArrayChangeType.reorder, startIndex: 0, endIndex: this.length - 1 });
    return this;
}
/**
 * The splice() method changes the contents of an array by removing existing elements and/or adding new elements.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
 * @param array The observable array
 * @param start  Index at which to start changing the array (with origin 0). If greater than the length of the array, actual starting index will be set to the length of the array. If negative, will begin that many elements from the end of the array (with origin -1) and will be set to 0 if absolute value is greater than the length of the array.
 * @param deleteCount An integer indicating the number of old array elements to remove. If deleteCount is omitted, or if its value is larger than array.length - start (that is, if it is greater than the number of elements left in the array, starting at start), then all of the elements from start through the end of the array will be deleted. If deleteCount is 0 or negative, no elements are removed. In this case, you should specify at least one new element (see below).
 * @param items The elements to add to the array, beginning at the start index. If you don't specify any elements, splice() will only remove elements from the array.
 * @returns An array containing the deleted elements. If only one element is removed, an array of one element is returned. If no elements are removed, an empty array is returned.
 */
function ObservableArray$splice(start, deleteCount) {
    var items = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        items[_i - 2] = arguments[_i];
    }
    var removed = Array.prototype.splice.apply(this, arguments);
    if (removed.length > 0 || items.length > 0) {
        var changeEvents = [];
        if (removed.length > 0) {
            changeEvents.push({ type: ArrayChangeType.remove, startIndex: start, endIndex: start + removed.length - 1, items: removed });
        }
        if (items.length > 0) {
            changeEvents.push({ type: ArrayChangeType.add, startIndex: start, endIndex: start + items.length - 1, items: items });
        }
        this.__ob__.raiseEvents(changeEvents);
    }
    return removed;
}
/**
 * The unshift() method adds one or more elements to the beginning of an array and returns the new length of the array.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
 * @param array The observable array
 * @param items The elements to add to the front of the array.
 * @returns The new length property of the object upon which the method was called.
 */
function ObservableArray$unshift() {
    var items = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        items[_i] = arguments[_i];
    }
    var originalLength = this.length;
    var newLength = Array.prototype.unshift.apply(this, arguments);
    if (newLength !== originalLength) {
        this.__ob__.raiseEvents({ type: ArrayChangeType.add, startIndex: 0, endIndex: items.length - 1, items: items });
    }
    return newLength;
}
var ArrayObserver = /** @class */ (function () {
    function ArrayObserver(array) {
        this.array = array;
        this.changedEvent = new Event();
        this._isQueuingChanges = false;
    }
    ArrayObserver.prototype.raiseEvents = function (changes) {
        if (this._isQueuingChanges) {
            if (!this._queuedChanges) {
                this._queuedChanges = [];
            }
            if (Array.isArray(changes)) {
                Array.prototype.push.apply(this._queuedChanges, changes);
            }
            else {
                this._queuedChanges.push(changes);
            }
        }
        else if (Array.isArray(changes)) {
            this.changedEvent.publish(this.array, { changes: changes });
        }
        else {
            this.changedEvent.publish(this.array, { changes: [changes] });
        }
    };
    ArrayObserver.prototype.startQueueingChanges = function () {
        this._isQueuingChanges = true;
        if (!this._queuedChanges) {
            this._queuedChanges = [];
        }
    };
    ArrayObserver.prototype.stopQueueingChanges = function (raiseEvents) {
        this._isQueuingChanges = false;
        if (raiseEvents) {
            this.raiseEvents(this._queuedChanges);
            delete this._queuedChanges;
        }
    };
    return ArrayObserver;
}());
function observableSplice(arr, events, index, removeCount, addItems) {
    var removedItems;
    var arr2 = arr;
    if (removeCount) {
        if (removeCount > 1 && arr2.removeRange) {
            removedItems = arr2.removeRange(index, removeCount);
        }
        else if (removeCount === 1 && arr2.remove) {
            removedItems = [arr2.removeAt(index)];
        }
        else {
            removedItems = arr.splice(index, removeCount);
        }
        if (events) {
            events.push({
                action: 'remove',
                oldStartingIndex: index,
                oldItems: removedItems,
                newStartingIndex: null,
                newItems: null
            });
        }
    }
    if (addItems.length > 0) {
        if (addItems.length > 1 && arr2.insertRange) {
            arr2.insertRange(index, addItems);
        }
        else if (addItems.length === 1 && arr2.insert) {
            arr2.insert(index, addItems[0]);
        }
        else {
            var addItemsArgs = addItems.slice();
            addItemsArgs.splice(0, 0, index, 0);
            arr.splice.apply(arr, addItemsArgs);
        }
        if (events) {
            events.push({
                action: 'add',
                oldStartingIndex: null,
                oldItems: null,
                newStartingIndex: index,
                newItems: addItems
            });
        }
    }
}
function updateArray(array, values /*, trackEvents */) {
    var trackEvents = arguments[2], events = trackEvents ? [] : null, pointer = 0, srcSeek = 0, tgtSeek = 0;
    while (srcSeek < array.length) {
        if (array[srcSeek] === values[tgtSeek]) {
            if (pointer === srcSeek && pointer === tgtSeek) {
                // items match, so advance
                pointer = srcSeek = tgtSeek = pointer + 1;
            }
            else {
                // remove range from source and add range from target
                observableSplice(array, events, pointer, srcSeek - pointer, values.slice(pointer, tgtSeek));
                // reset to index follow target seek location since arrays match up to that point
                pointer = srcSeek = tgtSeek = tgtSeek + 1;
            }
        }
        else if (tgtSeek >= values.length) {
            // reached the end of the target array, so advance the src pointer and test again
            tgtSeek = pointer;
            srcSeek += 1;
        }
        else {
            // advance to the next target item to test
            tgtSeek += 1;
        }
    }
    observableSplice(array, events, pointer, srcSeek - pointer, values.slice(pointer, Math.max(tgtSeek, values.length)));
    return events;
}

var Property = /** @class */ (function () {
    function Property(containingType, name, jstype, label, helptext, format, isList, isStatic, isPersisted, isCalculated, defaultValue, origin) {
        if (defaultValue === void 0) { defaultValue = undefined; }
        if (origin === void 0) { origin = "client"; }
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
            Object.defineProperty(this, "_origin", { enumerable: false, value: origin, writable: true });
        if (defaultValue)
            Object.defineProperty(this, "_defaultValue", { enumerable: false, value: defaultValue, writable: true });
        Object.defineProperty(this, "_events", { value: new PropertyEvents() });
        Object.defineProperty(this, "_propertyAccessSubscriptions", { value: [] });
        Object.defineProperty(this, "_propertyChangeSubscriptions", { value: [] });
        Object.defineProperty(this, "_rules", { value: [] });
        Object.defineProperty(this, "getter", { value: Property$_makeGetter(this, Property$_getter) });
        Object.defineProperty(this, "setter", { value: Property$_makeSetter(this, Property$_setter) });
        if (this.origin === "client" && this.isPersisted) ;
    }
    Object.defineProperty(Property.prototype, "fieldName", {
        get: function () {
            return this.containingType.model._fieldNamePrefix + "_" + this.name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Property.prototype, "changed", {
        get: function () {
            return this._events.changedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Property.prototype, "accessed", {
        get: function () {
            return this._events.accessedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Property.prototype, "ruleRegistered", {
        get: function () {
            return this._events.ruleRegisteredEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Property.prototype.getPath = function () {
        return this.isStatic ? (this.containingType + "." + this.name) : this.name;
    };
    Property.prototype.equals = function (prop) {
        if (prop === null || prop === undefined) {
            return;
        }
        if (prop instanceof PropertyChain) {
            return prop.equals(this);
        }
        if (prop instanceof Property) {
            return this === prop;
        }
    };
    Property.prototype.toString = function () {
        if (this.isStatic) {
            return this.containingType + "." + this.name;
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
            return this._origin;
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
                if (valType.jstype === this.propertyType) {
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
        var target = (this.isStatic ? this.containingType.jstype : obj);
        if (target === undefined || target === null) {
            throw new Error("Cannot " + (arguments.length > 1 ? "set" : "get") + " value for " + (this.isStatic ? "" : "non-") + "static property \"" + this.name + "\" on type \"" + this.containingType + "\": target is null or undefined.");
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
        var target = (this.isStatic ? this.containingType.jstype : obj);
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
    return Property;
}());
var PropertyEvents = /** @class */ (function () {
    function PropertyEvents() {
        this.changedEvent = new Event();
        this.accessedEvent = new Event();
        this.ruleRegisteredEvent = new Event();
    }
    return PropertyEvents;
}());
function Property$format(prop, val) {
    if (prop.format) {
        return prop.format.convert(val);
    }
}
// export function Property$equals(prop1: Property | IPropertyChain, prop2: Property | IPropertyChain): boolean {
// 	if (prop1 === null || prop1 === undefined || prop2 === null || prop2 === undefined) {
// 		return;
// 	}
// 	if (PropertyChain$isPropertyChain(prop1)) {
// 		return (prop1 as PropertyChain).equals(prop2);
// 	}
// 	if (PropertyChain$isPropertyChain(prop2)) {
// 		return (prop2 as PropertyChain).equals(prop1);
// 	}
// 	if (Property$isProperty(prop1) && Property$isProperty(prop2)) {
// 		return prop1 === prop2;
// 	}
// }
function Property$_generateShortcuts(property, target, overwrite) {
    if (overwrite === void 0) { overwrite = null; }
    var shortcutName = "$" + property.name;
    if (!(Object.prototype.hasOwnProperty.call(target, shortcutName)) || overwrite) {
        target[shortcutName] = property;
    }
}
function Property$_generateStaticProperty(property, target) {
    Object.defineProperty(target, property.name, {
        configurable: false,
        enumerable: true,
        get: property.getter,
        set: property.setter
    });
}
function Property$_generatePrototypeProperty(property, target) {
    Object.defineProperty(target, property.name, {
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
// TODO: Get rid of `Property$_generateOwnPropertyWithClosure`...
function Property$_generateOwnPropertyWithClosure(property, obj) {
    var val = null;
    var isInitialized = false;
    var _ensureInited = function () {
        if (!isInitialized) {
            // Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
            if (!property.isCalculated) {
                Property$pendingInit(obj, property, false);
                val = Property$_getInitialValue(property);
                if (Array.isArray(val)) {
                    Property$_subArrayEvents(obj, property, val);
                }
                // TODO: Account for static properties (obj is undefined)
                obj._events.changedEvent.publish(obj, { entity: obj, property: property });
            }
            // Mark the property as pending initialization
            Property$pendingInit(obj, property, true);
            isInitialized = true;
        }
    };
    Object.defineProperty(obj, property.name, {
        configurable: false,
        enumerable: true,
        get: function () {
            _ensureInited();
            // Raise get events
            property._events.accessedEvent.publish(obj, { entity: obj, property: property, value: val });
            return val;
        },
        set: function (newVal) {
            _ensureInited();
            if (Property$_shouldSetValue(property, obj, val, newVal)) {
                // Update lists as batch remove/add operations
                if (property.isList) {
                    var currentArray = val;
                    currentArray.batchUpdate(function (array) {
                        updateArray(array, newVal);
                    });
                }
                else {
                    var old = val;
                    val = newVal;
                    Property$pendingInit(obj, property, false);
                    // Do not raise change if the property has not been initialized. 
                    if (old !== undefined) {
                        property._events.changedEvent.publish(obj, { entity: obj, property: property, newValue: val, oldValue: old });
                    }
                }
            }
        }
    });
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
function Property$pendingInit(obj, prop, value) {
    if (value === void 0) { value = null; }
    var pendingInit;
    var target = (prop.isStatic ? prop.containingType.jstype : obj);
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
        var storageTarget = void 0;
        if (prop.isStatic) {
            storageTarget = prop.containingType.jstype;
        }
        else {
            storageTarget = obj;
        }
        var currentValue = storageTarget[prop.fieldName];
        return currentValue === undefined || pendingInit[prop.name] === true;
    }
}
function Property$_subArrayEvents(obj, property, array) {
    array.changed.subscribe(function (args) {
        // NOTE: property change should be broadcast before rules are run so that if 
        // any rule causes a roundtrip to the server these changes will be available
        // TODO: Implement notifyListChanged?
        // property.containingType.model.notifyListChanged(target, property, changes);
        // NOTE: oldValue is not currently implemented for lists
        var eventArgs = { entity: obj, property: property, newValue: array };
        eventArgs['changes'] = args.changes;
        eventArgs['collectionChanged'] = true;
        property._events.changedEvent.publish(obj, eventArgs);
        obj._events.changedEvent.publish(obj, { entity: obj, property: property });
    });
}
function Property$_getInitialValue(property) {
    var val = property.defaultValue;
    if (Array.isArray(val)) {
        val = ObservableArray.ensureObservable(val);
        // Override the default toString on arrays so that we get a comma-delimited list
        // TODO: Implement toString on observable list?
        // val.toString = Property$_arrayToString.bind(val);
    }
    return val;
}
function Property$_ensureInited(property, obj) {
    var target = (property.isStatic ? property.containingType.jstype : obj);
    // Determine if the property has been initialized with a value
    // and initialize the property if necessary
    if (!obj.hasOwnProperty(property.fieldName)) {
        // // Do not initialize calculated properties. Calculated properties should be initialized using a property get rule.  
        // if (!property.isCalculated) {
        Property$pendingInit(target, property, false);
        var val = Property$_getInitialValue(property);
        Object.defineProperty(target, property.fieldName, { value: val, writable: true });
        if (Array.isArray(val)) {
            Property$_subArrayEvents(obj, property, val);
        }
        // TODO: Implement observable?
        obj._events.changedEvent.publish(obj, { entity: obj, property: property });
        // Mark the property as pending initialization
        Property$pendingInit(target, property, true);
        // }
    }
}
function Property$_getter(property, obj) {
    // Ensure that the property has an initial (possibly default) value
    Property$_ensureInited(property, obj);
    // Raise access events
    property._events.accessedEvent.publish(obj, { entity: obj, property: property, value: obj[property.fieldName] });
    obj._events.accessedEvent.publish(obj, { entity: obj, property: property });
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
function Property$_setValue(property, obj, currentValue, newValue, additionalArgs) {
    if (additionalArgs === void 0) { additionalArgs = null; }
    // Update lists as batch remove/add operations
    if (property.isList) {
        var currentArray = currentValue;
        currentArray.batchUpdate(function (array) {
            updateArray(array, newValue);
        });
    }
    else {
        var oldValue = currentValue;
        // Set or create the backing field value
        if (obj.hasOwnProperty(property.fieldName)) {
            obj[property.fieldName] = newValue;
        }
        else {
            Object.defineProperty(obj, property.fieldName, { value: newValue, writable: true });
        }
        Property$pendingInit(obj, property, false);
        // Do not raise change if the property has not been initialized. 
        if (oldValue !== undefined) {
            var eventArgs = { entity: obj, property: property, newValue: newValue, oldValue: oldValue };
            property._events.changedEvent.publish(obj, additionalArgs ? merge(eventArgs, additionalArgs) : eventArgs);
            obj._events.changedEvent.publish(obj, { entity: obj, property: property });
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
    var context = null;
    var filteredHandler = null;
    if (obj) {
        filteredHandler = function (args) {
            if (args.entity === obj) {
                handler.call(this, args);
            }
        };
        context = obj;
    }
    prop._events.accessedEvent.subscribe(filteredHandler || handler);
    prop._propertyAccessSubscriptions.push({ registeredHandler: filteredHandler || handler, handler: handler, context: context });
}
function Property$_removeAccessedHandler(prop, handler, obj) {
    if (obj === void 0) { obj = null; }
    prop._propertyAccessSubscriptions.forEach(function (sub) {
        if (handler === sub.handler && ((!obj && !sub.context) || (obj && obj === sub.context))) {
            prop._events.accessedEvent.unsubscribe(sub.registeredHandler);
        }
    });
}
function Property$addAccessed(prop, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    if (toleratePartial === void 0) { toleratePartial = false; }
    if (prop instanceof Property) {
        Property$_addAccessedHandler(prop, handler, obj);
    }
    else if (prop instanceof PropertyChain) {
        PropertyChain$_addAccessedHandler(prop, handler, obj, toleratePartial);
    }
    else {
        throw new Error("Invalid property passed to `Property$addAccessed(prop)`.");
    }
}
function Property$removeAccessed(prop, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    if (toleratePartial === void 0) { toleratePartial = false; }
    if (prop instanceof Property) {
        Property$_removeAccessedHandler(prop, handler, obj);
    }
    else if (prop instanceof PropertyChain) {
        PropertyChain$_removeAccessedHandler(prop, handler, obj, toleratePartial);
    }
    else {
        throw new Error("Invalid property passed to `Property$removeAccessed(prop)`.");
    }
}
function Property$_addChangedHandler(prop, handler, obj) {
    if (obj === void 0) { obj = null; }
    var context = null;
    var filteredHandler = null;
    if (obj) {
        filteredHandler = function (args) {
            if (args.entity === obj) {
                handler.call(this, args);
            }
        };
        context = obj;
    }
    prop._events.changedEvent.subscribe(filteredHandler || handler);
    prop._propertyChangeSubscriptions.push({ registeredHandler: filteredHandler || handler, handler: handler, context: context });
}
function Property$_removeChangedHandler(prop, handler, obj) {
    if (obj === void 0) { obj = null; }
    prop._propertyChangeSubscriptions.forEach(function (sub) {
        if (handler === sub.handler && ((!obj && !sub.context) || (obj && obj === sub.context))) {
            prop._events.changedEvent.unsubscribe(sub.registeredHandler);
        }
    });
}
// starts listening for change events along the property chain on any known instances. Use obj argument to
// optionally filter the events to a specific object
function Property$addChanged(prop, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    if (toleratePartial === void 0) { toleratePartial = false; }
    if (prop instanceof Property) {
        Property$_addChangedHandler(prop, handler, obj);
    }
    else if (prop instanceof PropertyChain) {
        PropertyChain$_addChangedHandler(prop, handler, obj, toleratePartial);
    }
    else {
        throw new Error("Invalid property passed to `Property$addChanged(prop)`.");
    }
}
function Property$removeChanged(prop, handler, obj, toleratePartial) {
    if (obj === void 0) { obj = null; }
    if (toleratePartial === void 0) { toleratePartial = false; }
    if (prop instanceof Property) {
        Property$_removeChangedHandler(prop, handler, obj);
    }
    else if (prop instanceof PropertyChain) {
        PropertyChain$_removeChangedHandler(prop, handler, obj, toleratePartial);
    }
    else {
        throw new Error("Invalid property passed to `Property$addChanged(prop)`.");
    }
}
function hasPropertyChangedSubscribers(prop, obj) {
    var property = prop;
    var subscriptions = property._propertyChangeSubscriptions;
    return subscriptions.length > 0 && subscriptions.some(function (s) { return s.context === obj; });
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
            var path = p instanceof Property ? p.name : p instanceof PropertyChain ? p.path : p;
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

/** Represents the association of a condition to a specific target entity. */
var ConditionTarget = /** @class */ (function () {
    /**
    * Creates the association of a condition to a specific target entity.
    * @param condition The condition the target is for.
    * @param target The target entity the condition is associated with.
    * @param properties The set of properties on the target entity the condition is related to.
    */
    function ConditionTarget(condition, target, properties) {
        this.condition = condition;
        this.target = target;
        this.properties = properties;
        // Attach the condition target to the target entity.
        target.meta.setCondition(this);
    }
    return ConditionTarget;
}());

var Condition = /** @class */ (function () {
    /**
        * Creates a condition of a specific type associated with one or more entities in a model.
        * @param type The type of condition, which usually is an instance of a subclass like Error, Warning or Permission.
        * @param message The optional message to use for the condition, which will default to the condition type message if not specified.
        * @param target The root target entity the condition is associated with.
        * @param properties The set of property paths specifying which properties and entities the condition should be attached to.
        * @param origin The original source of the condition, either "client" or "server".
        */
    function Condition(type, message, target, properties, origin) {
        if (origin === void 0) { origin = null; }
        this.type = type;
        this.message = message || (type ? type.message : undefined);
        this.origin = origin;
        var targets = [];
        // create targets if a root was specified
        if (target) {
            // set the properties to an empty array if not specified and normalize the paths to expand {} syntax if used
            var paths = PathTokens$normalizePaths(properties || []);
            // create a single condition target if the specified properties are all on the root
            if (paths.every(function (p) { return p.steps.length === 1; }))
                targets.push(new ConditionTarget(this, target, paths.map(function (path) { return target.meta.type.getProperty(path.expression); })));
            // otherwise, process the property paths to create the necessary sources
            else {
                // process each property path to build up the condition sources
                for (var p = paths.length - 1; p >= 0; p--) {
                    var steps = paths[p].steps;
                    var instances = [target];
                    var leaf = steps.length - 1;
                    // iterate over each step along the path
                    for (var s_1 = 0; s_1 < steps.length; s_1++) {
                        var step = steps[s_1].property;
                        var childInstances = [];
                        // create condition targets for all instances for the current step along the path
                        for (var i = instances.length - 1; i >= 0; i--) {
                            var instance = instances[i];
                            // get the property for the current step and instance type and skip if the property cannot be found
                            var property = instance.meta.type.getProperty(step);
                            if (!property) {
                                continue;
                            }
                            // only create conditions on the last step, the leaf node
                            if (s_1 === leaf) {
                                // see if a target already exists for the current instance
                                var conditionTarget = null;
                                for (var t_1 = targets.length - 1; t_1 >= 0; t_1--) {
                                    if (targets[t_1].target === instance) {
                                        conditionTarget = targets[t_1];
                                        break;
                                    }
                                }
                                // create the condition target if it does not already exist
                                if (!conditionTarget) {
                                    conditionTarget = new ConditionTarget(this, instance, [property]);
                                    targets.push(conditionTarget);
                                }
                                // otherwise, just ensure it references the current step
                                else if (conditionTarget.properties.indexOf(property) < 0)
                                    conditionTarget.properties.push(property);
                            }
                            // get the value of the current step
                            var child = property.value(instance);
                            // add the children, if any, to the set of child instances to process for the next step
                            if (child instanceof Entity)
                                childInstances.push(child);
                            else if (child instanceof Array && child.length > 0 && child[0] instanceof Entity)
                                childInstances = childInstances.concat(child);
                        }
                        // assign the set of instances to process for the next step
                        instances = childInstances;
                    }
                }
            }
        }
        // store the condition targets
        Object.defineProperty(this, "targets", { value: targets });
        // raise events for the new condition
        if (type != FormatError$getConditionType()) {
            var conditionType = type;
            // raise events on condition targets
            for (var t = targets.length - 1; t >= 0; t--) {
                var conditionTarget = targets[t];
                var objectMeta = conditionTarget.target.meta;
                // instance events
                objectMeta._events.conditionsChangedEvent.publish(objectMeta, { conditionTarget: conditionTarget, add: true });
                // type events
                for (var objectType = conditionTarget.target.meta.type; objectType != null; objectType = objectType.baseType) {
                    objectType._events.conditionsChangedEvent.publish(objectType, { conditionTarget: conditionTarget, add: true });
                }
            }
            // Add the condition to the corresponding condition type
            conditionType.conditions.push(this);
            conditionType._events.conditionsChangedEvent.publish(this.type, { condition: this, add: true });
            // Add the condition to relevant condition type sets
            if (this.type.sets) {
                for (var s = this.type.sets.length - 1; s >= 0; s--) {
                    var set = this.type.sets[s];
                    set.conditions.push(this);
                    set._events.conditionsChangedEvent.publish(set, { condition: this, add: true });
                }
            }
        }
    }
    Condition.prototype.destroy = function () {
        /// <summary>Removes the condition targets from all target instances and raises condition change events.</summary>
        // raise events on condition type sets
        if (this.type.sets) {
            for (var s = this.type.sets.length - 1; s >= 0; s--) {
                var set = this.type.sets[s];
                var idx_1 = set.conditions.indexOf(this);
                if (idx_1 >= 0) {
                    set.conditions.splice(idx_1, 1);
                }
            }
        }
        // raise events on condition types
        var idx = this.type.conditions.indexOf(this);
        if (idx >= 0) {
            this.type.conditions.splice(idx, 1);
        }
        for (var t = this.targets.length - 1; t >= 0; t--) {
            var conditionTarget = this.targets[t];
            var objectMeta = conditionTarget.target.meta;
            objectMeta.clearCondition(conditionTarget.condition.type);
            // instance events
            objectMeta._events.conditionsChangedEvent.publish(conditionTarget.target.meta, { conditionTarget: conditionTarget, remove: true });
            // type events
            for (var objectType = conditionTarget.target.meta.type; objectType != null; objectType = objectType.baseType) {
                objectType._events.conditionsChangedEvent.publish(objectType, { conditionTarget: conditionTarget, add: false, remove: true });
            }
        }
        // remove references to all condition targets
        this.targets.splice(0);
    };
    Condition.prototype.toString = function () {
        return this.message;
    };
    return Condition;
}());

var allConditionTypes = {};
exports.ConditionType = /** @class */ (function () {
    /**
    * Creates a unique type of model condition.
    * @param code The unique condition type code.
    * @param category The category of the condition type, such as "Error", "Warning", or "Permission".
    * @param message The default message to use when the condition is present.
    * @param origin The origin of the condition, Origin.Client or Origin.Server.
    */
    function ConditionType(code, category, message, sets, origin) {
        // Ensure unique condition type codes
        if (allConditionTypes[code])
            throw new Error("A condition type with the code \"" + code + "\" has already been created.");
        this.code = code;
        this.category = category;
        this.message = message;
        // this.rules = [];
        this.conditions = ObservableArray.create();
        this.sets = sets || [];
        this.origin = origin;
        Object.defineProperty(this, "_events", { value: new ConditionTypeEvents() });
        // Register with the static dictionary of all condition types
        allConditionTypes[code] = this;
    }
    Object.defineProperty(ConditionType.prototype, "conditionsChanged", {
        get: function () {
            return this._events.conditionsChangedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    /**
    * Adds or removes a condition from the model for the specified target if necessary.
    * @param condition Whether or not the condition should be present
    * @param target The target instance
    * @param properties The properties to attach the condition to
    * @param message The condition message (or a function to generate the message)
    */
    ConditionType.prototype.when = function (condition, target, properties, message) {
        // get the current condition if it exists
        var conditionTarget = target.meta.getCondition(this);
        // add the condition on the target if it does not exist yet
        if (condition) {
            // if the message is a function, invoke to get the actual message
            message = message instanceof Function ? message(target) : message;
            // create a new condition if one does not exist
            if (!conditionTarget) {
                return new Condition(this, message, target, properties, "client");
            }
            // replace the condition if the message has changed
            else if (message && message != conditionTarget.condition.message) {
                // destroy the existing condition
                conditionTarget.condition.destroy();
                // create a new condition with the updated message
                return new Condition(this, message, target, properties, "client");
            }
            // otherwise, just return the existing condition
            else {
                return conditionTarget.condition;
            }
        }
        // Destroy the condition if it exists on the target and is no longer valid
        if (conditionTarget != null)
            conditionTarget.condition.destroy();
        // Return null to indicate that no condition was created
        return null;
    };
    /**
        * Gets all condition types that have been created.
        * @returns Array of all condition types.
        * */
    ConditionType.all = function () {
        var all = [];
        for (var type in allConditionTypes.keys) {
            all.push(allConditionTypes[type]);
        }
        return all;
    };
    /**
        * Returns the condition type with the given code, if it exists.
        * @param code The unique code of the condition type to find.
        */
    ConditionType.get = function (code) {
        return allConditionTypes[code];
    };
    return ConditionType;
}());
var ConditionTypeEvents = /** @class */ (function () {
    function ConditionTypeEvents() {
        this.conditionsChangedEvent = new Event();
    }
    return ConditionTypeEvents;
}());
var ErrorConditionType = /** @class */ (function (_super) {
    __extends(ErrorConditionType, _super);
    function ErrorConditionType(code, message, sets, origin) {
        if (origin === void 0) { origin = null; }
        return _super.call(this, code, "Error", message, sets, origin) || this;
    }
    return ErrorConditionType;
}(exports.ConditionType));
var WarningConditionType = /** @class */ (function (_super) {
    __extends(WarningConditionType, _super);
    function WarningConditionType(code, message, sets, origin) {
        if (origin === void 0) { origin = null; }
        return _super.call(this, code, "Warning", message, sets, origin) || this;
    }
    return WarningConditionType;
}(exports.ConditionType));
var PermissionConditionType = /** @class */ (function (_super) {
    __extends(PermissionConditionType, _super);
    function PermissionConditionType(code, message, sets, isAllowed, origin) {
        if (origin === void 0) { origin = null; }
        var _this = _super.call(this, code, "Warning", message, sets, origin) || this;
        _this.isAllowed = isAllowed;
        return _this;
    }
    return PermissionConditionType;
}(exports.ConditionType));
(function (ConditionType) {
    ConditionType.Error = ErrorConditionType;
    ConditionType.Warning = WarningConditionType;
    ConditionType.Permission = PermissionConditionType;
})(exports.ConditionType || (exports.ConditionType = {}));

var FormatError = /** @class */ (function () {
    function FormatError(message, invalidValue) {
        Object.defineProperty(this, "message", { value: message });
        Object.defineProperty(this, "invalidValue", { value: invalidValue });
    }
    FormatError.prototype.createCondition = function (target, prop) {
        return new Condition(FormatError$getConditionType(), this.message.replace("{property}", prop.label), target, [prop.name], "client");
    };
    FormatError.prototype.toString = function () {
        return this.invalidValue;
    };
    return FormatError;
}());
function FormatError$getConditionType() {
    if (!FormatError._conditionType) {
        FormatError._conditionType = new ErrorConditionType("FormatError", "The value is not properly formatted.", []);
    }
    return FormatError._conditionType;
}

var formatTemplateParser = /\[([_a-zA-Z\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02b8\u02bb-\u02c1\u02d0-\u02d1\u02e0-\u02e4\u02ee\u0370-\u0373\u0376-\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0523\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0621-\u064a\u0660-\u0669\u066e-\u066f\u0671-\u06d3\u06d5\u06e5-\u06e6\u06ee-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07c0-\u07ea\u07f4-\u07f5\u07fa\u0904-\u0939\u093d\u0950\u0958-\u0961\u0966-\u096f\u0971-\u0972\u097b-\u097f\u0985-\u098c\u098f-\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc-\u09dd\u09df-\u09e1\u09e6-\u09f1\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a59-\u0a5c\u0a5e\u0a66-\u0a6f\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2-\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0-\u0ae1\u0ae6-\u0aef\u0b05-\u0b0c\u0b0f-\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3d\u0b5c-\u0b5d\u0b5f-\u0b61\u0b66-\u0b6f\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0be6-\u0bef\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58-\u0c59\u0c60-\u0c61\u0c66-\u0c6f\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0-\u0ce1\u0ce6-\u0cef\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d28\u0d2a-\u0d39\u0d3d\u0d60-\u0d61\u0d66-\u0d6f\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32-\u0e33\u0e40-\u0e46\u0e50-\u0e59\u0e81-\u0e82\u0e84\u0e87-\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa-\u0eab\u0ead-\u0eb0\u0eb2-\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0ed0-\u0ed9\u0edc-\u0edd\u0f00\u0f20-\u0f29\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8b\u1000-\u102a\u103f-\u1049\u1050-\u1055\u105a-\u105d\u1061\u1065-\u1066\u106e-\u1070\u1075-\u1081\u108e\u1090-\u1099\u10a0-\u10c5\u10d0-\u10fa\u10fc\u1100-\u1159\u115f-\u11a2\u11a8-\u11f9\u1200-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u1676\u1681-\u169a\u16a0-\u16ea\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u17e0-\u17e9\u1810-\u1819\u1820-\u1877\u1880-\u18a8\u18aa\u1900-\u191c\u1946-\u196d\u1970-\u1974\u1980-\u19a9\u19c1-\u19c7\u19d0-\u19d9\u1a00-\u1a16\u1b05-\u1b33\u1b45-\u1b4b\u1b50-\u1b59\u1b83-\u1ba0\u1bae-\u1bb9\u1c00-\u1c23\u1c40-\u1c49\u1c4d-\u1c7d\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u2094\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2183-\u2184\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2c6f\u2c71-\u2c7d\u2c80-\u2ce4\u2d00-\u2d25\u2d30-\u2d65\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3006\u3031-\u3035\u303b-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31b7\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fc3\ua000-\ua48c\ua500-\ua60c\ua610-\ua62b\ua640-\ua65f\ua662-\ua66e\ua680-\ua697\ua722-\ua788\ua78b-\ua78c\ua7fb-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8d0-\ua8d9\ua900-\ua925\ua930-\ua946\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa50-\uaa59\uac00-\ud7a3\uf900-\ufa2d\ufa30-\ufa6a\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][_.0-9a-zA-Z\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02b8\u02bb-\u02c1\u02d0-\u02d1\u02e0-\u02e4\u02ee\u0370-\u0373\u0376-\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0523\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0621-\u064a\u0660-\u0669\u066e-\u066f\u0671-\u06d3\u06d5\u06e5-\u06e6\u06ee-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07c0-\u07ea\u07f4-\u07f5\u07fa\u0904-\u0939\u093d\u0950\u0958-\u0961\u0966-\u096f\u0971-\u0972\u097b-\u097f\u0985-\u098c\u098f-\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc-\u09dd\u09df-\u09e1\u09e6-\u09f1\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a59-\u0a5c\u0a5e\u0a66-\u0a6f\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2-\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0-\u0ae1\u0ae6-\u0aef\u0b05-\u0b0c\u0b0f-\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3d\u0b5c-\u0b5d\u0b5f-\u0b61\u0b66-\u0b6f\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0be6-\u0bef\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58-\u0c59\u0c60-\u0c61\u0c66-\u0c6f\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0-\u0ce1\u0ce6-\u0cef\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d28\u0d2a-\u0d39\u0d3d\u0d60-\u0d61\u0d66-\u0d6f\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32-\u0e33\u0e40-\u0e46\u0e50-\u0e59\u0e81-\u0e82\u0e84\u0e87-\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa-\u0eab\u0ead-\u0eb0\u0eb2-\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0ed0-\u0ed9\u0edc-\u0edd\u0f00\u0f20-\u0f29\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8b\u1000-\u102a\u103f-\u1049\u1050-\u1055\u105a-\u105d\u1061\u1065-\u1066\u106e-\u1070\u1075-\u1081\u108e\u1090-\u1099\u10a0-\u10c5\u10d0-\u10fa\u10fc\u1100-\u1159\u115f-\u11a2\u11a8-\u11f9\u1200-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u1676\u1681-\u169a\u16a0-\u16ea\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u17e0-\u17e9\u1810-\u1819\u1820-\u1877\u1880-\u18a8\u18aa\u1900-\u191c\u1946-\u196d\u1970-\u1974\u1980-\u19a9\u19c1-\u19c7\u19d0-\u19d9\u1a00-\u1a16\u1b05-\u1b33\u1b45-\u1b4b\u1b50-\u1b59\u1b83-\u1ba0\u1bae-\u1bb9\u1c00-\u1c23\u1c40-\u1c49\u1c4d-\u1c7d\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u2094\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2183-\u2184\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2c6f\u2c71-\u2c7d\u2c80-\u2ce4\u2d00-\u2d25\u2d30-\u2d65\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3006\u3031-\u3035\u303b-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31b7\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fc3\ua000-\ua48c\ua500-\ua60c\ua610-\ua62b\ua640-\ua65f\ua662-\ua66e\ua680-\ua697\ua722-\ua788\ua78b-\ua78c\ua7fb-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8d0-\ua8d9\ua900-\ua925\ua930-\ua946\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa50-\uaa59\uac00-\ud7a3\uf900-\ufa2d\ufa30-\ufa6a\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]*)(\:(.+?))?\]/ig;
var metaPathParser = /^(.*\.|)meta(\..*|)$/;
var Format = /** @class */ (function () {
    function Format(specifier, description, nullString, undefinedString) {
        if (description === void 0) { description = null; }
        if (nullString === void 0) { nullString = null; }
        if (undefinedString === void 0) { undefinedString = undefined; }
        if (arguments.length === 1 && typeof specifier === "object") {
            throw new Error("Do not construct formats directly, call `Format.fromTemplate()` or `Format.create()` instead.");
        }
        if (!specifier || typeof specifier !== "string") {
            throw new Error("Format specifier string must be provided.");
        }
        Object.defineProperty(this, "specifier", { configurable: false, enumerable: true, value: specifier, writable: false });
        this.description = description;
        this.nullString = nullString || "";
        this.undefinedString = undefinedString || "";
    }
    Format.prototype.convert = function (val) {
        if (val === undefined) {
            return this.undefinedString;
        }
        if (val === null) {
            return this.nullString;
        }
        if (val instanceof FormatError) {
            return val.invalidValue;
        }
        return this.convertToString(val);
    };
    Format.prototype.convertBack = function (text) {
        if (text === null || text == this.nullString) {
            return null;
        }
        if (text === undefined || text == this.undefinedString) {
            return;
        }
        if (typeof text === "string") {
            text = text.trim();
            if (text.length === 0) {
                return null;
            }
        }
        return this.convertFromString(text);
    };
    Format.prototype.toString = function () {
        return this.specifier;
    };
    Format.create = function (options) {
        return new CustomFormat(options);
    };
    Format.fromTemplate = function (type, template, formatEval) {
        if (formatEval === void 0) { formatEval = null; }
        return new ModelFormat(type, template, formatEval);
    };
    return Format;
}());
var CustomFormat = /** @class */ (function (_super) {
    __extends(CustomFormat, _super);
    function CustomFormat(options) {
        var _this = _super.call(this, options.specifier, options.description, options.nullString, options.undefinedString) || this;
        Object.defineProperty(_this, "_convert", { enumerable: false, value: options.convert, writable: true });
        Object.defineProperty(_this, "_convertBack", { enumerable: false, value: options.convertBack, writable: true });
        Object.defineProperty(_this, "_formatEval", { enumerable: false, value: options.formatEval, writable: true });
        Object.defineProperty(_this, "_paths", { enumerable: false, value: options.paths, writable: true });
        return _this;
    }
    CustomFormat.prototype.convertToString = function (val) {
        if (!this._convert) {
            return val;
        }
        return this._convert(val);
    };
    CustomFormat.prototype.convertFromString = function (text) {
        if (!this._convertBack) {
            return text;
        }
        try {
            return this._convertBack(text);
        }
        catch (err) {
            if (err instanceof FormatError) {
                return err;
            }
            var formatError = new FormatError(this.description ?
                Resource.get("format-with-description").replace('{description}', this.description) :
                Resource.get("format-without-description"), text);
            return formatError;
        }
    };
    CustomFormat.prototype.getPaths = function () {
        return this._paths;
    };
    return CustomFormat;
}(Format));
var ModelFormat = /** @class */ (function (_super) {
    __extends(ModelFormat, _super);
    function ModelFormat(type, specifier, formatEval) {
        if (formatEval === void 0) { formatEval = null; }
        var _this = _super.call(this, specifier) || this;
        Object.defineProperty(_this, "type", { configurable: false, enumerable: true, value: type, writable: false });
        Object.defineProperty(_this, "_compiled", { configurable: false, enumerable: false, value: false, writable: true });
        Object.defineProperty(_this, "_tokens", { configurable: false, enumerable: false, value: null, writable: true });
        Object.defineProperty(_this, "_template", { configurable: false, enumerable: false, value: null, writable: true });
        Object.defineProperty(_this, "_paths", { configurable: false, enumerable: false, value: null, writable: true });
        return _this;
    }
    ModelFormat.prototype._ensureCompiled = function () {
        if (!this._compiled) {
            if (!this._tokens) {
                this._paths = [];
                this._tokens = [];
                this._template = this.specifier;
                // Replace escaped \, [ or ] characters with placeholders
                var template = this._template.replace(/\\\\/g, '\u0000').replace(/\\\[/g, '\u0001').replace(/\\\]/g, '\u0002');
                var index = 0;
                formatTemplateParser.lastIndex = 0;
                var match = formatTemplateParser.exec(template);
                // Process each token match
                while (match) {
                    var path = match[1];
                    var propertyPath = path;
                    // See if the path represents a property path in the model
                    var propertyDefaultFormat = null;
                    try {
                        // Detect property path followed by ".meta..."
                        propertyPath = propertyPath.replace(metaPathParser, "$1");
                        var isMetaPath = propertyPath.length > 0 && propertyPath.length < path.length;
                        var allowFormat = !isMetaPath;
                        if (isMetaPath) {
                            propertyPath = propertyPath.substring(0, propertyPath.length - 1);
                        }
                        // If a property path remains, then attempt to find a default format and paths for the format
                        if (propertyPath) {
                            var property = Model$getPropertyOrPropertyChain(propertyPath, this.type, this.type.model._allTypesRoot);
                            if (property) {
                                // Only allow formats for a property path that is not followed by ".meta..."
                                if (allowFormat) {
                                    // Determine the default property format
                                    if (property instanceof Property) {
                                        propertyDefaultFormat = property.format;
                                    }
                                    else if (property instanceof PropertyChain) {
                                        var lastProperty = property.lastProperty;
                                        propertyDefaultFormat = lastProperty.format;
                                    }
                                    // If the path references one or more entity properties, include paths for the property format. Otherwise, just add the path.
                                    var lastIndex = formatTemplateParser.lastIndex;
                                    if (propertyDefaultFormat && propertyDefaultFormat instanceof Format && propertyDefaultFormat !== this && propertyDefaultFormat.getPaths().length > 0)
                                        Array.prototype.push.apply(this._paths, propertyDefaultFormat.getPaths().map(function (p) { return propertyPath + "." + p; }));
                                    else
                                        this._paths.push(propertyPath);
                                    formatTemplateParser.lastIndex = lastIndex;
                                }
                                // Formats are not allowed, so just add the path
                                else {
                                    this._paths.push(propertyPath);
                                }
                            }
                        }
                    }
                    catch (e) {
                        // 
                    }
                    // Create a token for the current match, including the prefix, path and format
                    this._tokens.push({
                        prefix: template.substring(index, formatTemplateParser.lastIndex - match[0].length).replace(/\u0000/g, '\\').replace(/\u0001/g, '[').replace(/\u0002/g, ']'),
                        path: path,
                        format: match[3] ? match[3].replace(/\u0000/g, '\\').replace(/\u0001/g, '[').replace(/\u0002/g, ']') : propertyDefaultFormat
                    });
                    // Track the last index and find the next match
                    index = formatTemplateParser.lastIndex;
                    match = formatTemplateParser.exec(template);
                }
                // Capture any trailing literal text as a token without a path
                if (index < template.length) {
                    this._tokens.push({
                        prefix: template.substring(index).replace(/\u0000/g, '\\').replace(/\u0001/g, '[').replace(/\u0002/g, ']')
                    });
                }
            }
            this._compiled = true;
        }
    };
    ModelFormat.prototype.getPaths = function () {
        this._ensureCompiled();
        return this._paths;
    };
    ModelFormat.prototype.convertToString = function (obj) {
        if (obj === null || obj === undefined) {
            return "";
        }
        // Ensure the format has been compiled
        this._ensureCompiled();
        var result = "";
        for (var index = 0; index < this._tokens.length; index++) {
            var token = this._tokens[index];
            if (token.prefix)
                result = result + token.prefix;
            if (token.path) {
                var value = evalPath(obj, token.path);
                if (value === undefined || value === null) {
                    value = "";
                }
                else if (token.format) {
                    var format = void 0;
                    if (token.format instanceof Format) {
                        format = token.format;
                    }
                    else if (typeof token.format === "string") {
                        format = token.format = getFormat(obj.meta.type.model, value.constructor, token.format);
                    }
                    value = format.convert(value);
                    // if (this._formatEval)
                    // 	value = this._formatEval(value);
                }
                result = result + value;
            }
        }
        return result;
    };
    ModelFormat.prototype.convertFromString = function (text) {
        throw new Error("Cannot convert from a format string back to an entity.");
    };
    return ModelFormat;
}(Format));
function createFormat(type, format) {
    if (type === Date) {
        return Format.create({
            specifier: format,
            description: "",
            paths: [],
            convert: function (value) {
                if (format === "d") {
                    var m = value.getMonth() + 1;
                    var d = value.getDate();
                    var yyyy = value.getFullYear();
                    return m + "/" + d + "/" + yyyy;
                }
                else {
                    throw new Error("Date format '" + format + "' is not supported.");
                }
            },
            convertBack: function (str) {
                return new FormatError("Convert back from string to date is not implemented.", str);
            }
        });
    }
    if (type === Number) {
        var isCurrencyFormat = format.match(/[$c]+/i);
        var isPercentageFormat = format.match(/[%p]+/i);
        var isIntegerFormat = format.match(/[dnfg]0/i);
        return new CustomFormat({
            specifier: format,
            description: isCurrencyFormat ? Resource["format-currency"] : isPercentageFormat ? Resource["format-percentage"] : isIntegerFormat ? Resource["format-integer"] : Resource["format-decimal"],
            convert: function (val) {
                // Default to browser formatting for general format
                if (format.toLowerCase() === "g")
                    return val.toString();
                throw new Error("Number format '" + format + "' is not implemented.");
            },
            convertBack: function (str) {
                return new FormatError("Convert back from string to date is not implemented.", str);
            }
        });
    }
    if (type === Boolean) {
        // Format strings used for true, false, and null (or undefined) values
        var trueFormat_1, falseFormat_1, nullFormat_1;
        if (format && format.toLowerCase() === "g") {
            trueFormat_1 = "True";
            falseFormat_1 = "False";
            nullFormat_1 = "";
        }
        else {
            var formats = format.split(';');
            trueFormat_1 = formats.length > 0 ? formats[0] : "";
            falseFormat_1 = formats.length > 1 ? formats[1] : "";
            nullFormat_1 = formats.length > 2 ? formats[2] : "";
        }
        return new CustomFormat({
            specifier: format,
            convert: function (val) {
                if (val === true) {
                    return trueFormat_1;
                }
                else if (val === false) {
                    return falseFormat_1;
                }
                else {
                    return nullFormat_1;
                }
            },
            convertBack: function (str) {
                if (str.toLowerCase() === trueFormat_1.toLowerCase()) {
                    return true;
                }
                else if (str.toLowerCase() === falseFormat_1.toLowerCase()) {
                    return false;
                }
                else {
                    return null;
                }
            }
        });
    }
}
function getFormatStorage(model, type) {
    if (type.meta && type.meta instanceof Type) {
        // Entity types track their own formats
        var entityCtor = type;
        return entityCtor.meta._formats;
    }
    var nativeTypeName = null;
    if (type === String) {
        nativeTypeName = "String";
    }
    else if (type === Number) {
        nativeTypeName = "Number";
    }
    else if (type === Boolean) {
        nativeTypeName = "Boolean";
    }
    else if (type === Date) {
        nativeTypeName = "Date";
    }
    if (nativeTypeName) {
        // Store formats for native types with the model
        var formatStorageForNativeType = model._nativeTypeFormats[nativeTypeName];
        if (!formatStorageForNativeType) {
            formatStorageForNativeType = model._nativeTypeFormats[nativeTypeName] = {};
        }
        return formatStorageForNativeType;
    }
    else {
        // For all other types, store formats in an "_unknownTypeFormats" list
        var unknownTypeFormats = void 0;
        if (hasOwnProperty(model, "_unknownTypeFormats")) {
            unknownTypeFormats = model._unknownTypeFormats;
            for (var i = 0; i < unknownTypeFormats.length; i++) {
                if (unknownTypeFormats[i].type === type) {
                    return unknownTypeFormats[i].formats;
                }
            }
        }
        else {
            unknownTypeFormats = [];
            Object.defineProperty(model, "_unknownTypeFormats", { configurable: false, enumerable: false, value: unknownTypeFormats, writable: false });
        }
        var formatStorage = {};
        unknownTypeFormats.push({ type: type, formats: formatStorage });
        return formatStorage;
    }
}
function getFormat(model, type, format) {
    // return null if a format specifier was not provided
    if (!format || format === '') {
        return null;
    }
    // Get the format cache for the type
    var formats = getFormatStorage(model, type);
    // first see if the requested format is cached
    var f = formats[format];
    if (f) {
        return f;
    }
    // then see if it is an entity type
    if (type.meta && type.meta instanceof Type) {
        var entityConstructor = type;
        formats[format] = f = Format.fromTemplate(entityConstructor.meta, format);
    }
    else {
        // otherwise, call the format provider to create a new format
        formats[format] = f = createFormat(type, format);
    }
    return f;
}

var Entity = /** @class */ (function () {
    function Entity() {
        Object.defineProperty(this, "_events", { value: new EntityEvents() });
    }
    Object.defineProperty(Entity.prototype, "accessed", {
        get: function () {
            return this._events.accessedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Entity.prototype, "changed", {
        get: function () {
            return this._events.changedEvent.asEventSubscriber();
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
        var formatter = null;
        if (format) {
            // TODO: Use format to convert entity to string
            formatter = getFormat(this.meta.type.model, this.constructor, format);
        }
        else {
            // TODO: Use format to convert entity to string
            formatter = this.meta.type.format;
        }
        if (formatter) {
            return formatter.convert(this);
        }
        else {
            return Entity$toIdString(this);
        }
    };
    return Entity;
}());
var EntityEvents = /** @class */ (function () {
    function EntityEvents() {
        this.accessedEvent = new Event();
        this.changedEvent = new Event();
    }
    return EntityEvents;
}());
// Gets the typed string id suitable for roundtripping via fromIdString
function Entity$toIdString(obj) {
    return obj.meta.type.fullName + "|" + obj.meta.id;
}
// Gets or loads the entity with the specified typed string id
function Entity$fromIdString(model, idString) {
    // Typed identifiers take the form "type|id".
    var type = idString.substring(0, idString.indexOf("|"));
    var id = idString.substring(type.length + 1);
    // Use the left-hand portion of the id string as the object's type.
    var jstype = Model$getJsType(type, model._allTypesRoot);
    // Retrieve the object with the given id.
    return jstype.meta.get(id, 
    // Typed identifiers may or may not be the exact type of the instance.
    // An id string may be constructed with only knowledge of the base type.
    false);
}

var ObjectMeta = /** @class */ (function () {
    function ObjectMeta(type, entity, id, isNew) {
        // Public read-only properties
        Object.defineProperty(this, "type", { enumerable: true, value: type });
        Object.defineProperty(this, "entity", { enumerable: true, value: entity });
        // Public settable properties that are simple values with no side-effects or logic
        Object.defineProperty(this, "_id", { enumerable: false, value: id, writable: true });
        Object.defineProperty(this, "_isNew", { enumerable: false, value: isNew, writable: true });
        Object.defineProperty(this, "_conditions", { enumerable: false, value: {}, writable: true });
        Object.defineProperty(this, "_events", { value: new ObjectMetaEvents() });
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
    Object.defineProperty(ObjectMeta.prototype, "conditionsChanged", {
        get: function () {
            return this._events.conditionsChangedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    // gets the condition target with the specified condition type
    ObjectMeta.prototype.getCondition = function (conditionType) {
        return this._conditions[conditionType.code];
    };
    // stores the condition target for the current instance
    ObjectMeta.prototype.setCondition = function (conditionTarget) {
        if (conditionTarget.condition.type != FormatError$getConditionType()) {
            this._conditions[conditionTarget.condition.type.code] = conditionTarget;
        }
    };
    // clears the condition for the current instance with the specified condition type
    ObjectMeta.prototype.clearCondition = function (conditionType) {
        delete this._conditions[conditionType.code];
    };
    // determines if the set of permissions are allowed for the current instance
    ObjectMeta.prototype.isAllowed = function ( /*codes*/) {
        if (arguments.length === 0) {
            return undefined;
        }
        // ensure each condition type is allowed for the current instance
        for (var c = arguments.length - 1; c >= 0; c--) {
            var code = arguments[c];
            var conditionType = exports.ConditionType.get(code);
            // return undefined if the condition type does not exist
            if (conditionType === undefined) {
                return undefined;
            }
            // throw an exception if the condition type is not a permission
            if (!(conditionType instanceof PermissionConditionType)) {
                throw new Error("Condition type \"" + code + "\" should be a Permission.");
            }
            // return false if a condition of the current type exists and is a deny permission or does not exist and is a grant permission
            if (this._conditions[conditionType.code] ? !conditionType.isAllowed : conditionType.isAllowed) {
                return false;
            }
        }
        return true;
    };
    // TODO: Should this be a method on the entity itself, or a static method on Entity?
    ObjectMeta.prototype.destroy = function () {
        this.type.unregister(this.entity);
        // Raise the destroy event on this type and all base types
        for (var t = this.type; t; t = t.baseType) {
            t._events.destroyEvent.publish(t, { entity: this.entity });
        }
    };
    return ObjectMeta;
}());
var ObjectMetaEvents = /** @class */ (function () {
    function ObjectMetaEvents() {
        this.conditionsChangedEvent = new Event();
    }
    return ObjectMetaEvents;
}());

(function (RuleInvocationType) {
    /** Occurs when an existing instance is initialized.*/
    RuleInvocationType[RuleInvocationType["InitExisting"] = 2] = "InitExisting";
    /** Occurs when a new instance is initialized. */
    RuleInvocationType[RuleInvocationType["InitNew"] = 4] = "InitNew";
    /** Occurs when a property value is retrieved. */
    RuleInvocationType[RuleInvocationType["PropertyGet"] = 8] = "PropertyGet";
    /** Occurs when a property value is changed. */
    RuleInvocationType[RuleInvocationType["PropertyChanged"] = 16] = "PropertyChanged";
})(exports.RuleInvocationType || (exports.RuleInvocationType = {}));

var EventScope$current = null;
// TODO: Make `nonExitingScopeNestingCount` an editable configuration value
// Controls the maximum number of times that a child event scope can transfer events
// to its parent while the parent scope is exiting. A large number indicates that
// rules are not reaching steady-state. Technically something other than rules could
// cause this scenario, but in practice they are the primary use-case for event scope. 
var nonExitingScopeNestingCount = 100;
var EventScope = /** @class */ (function () {
    function EventScope() {
        // If there is a current event scope
        // then it will be the parent of the new event scope
        var parent = EventScope$current;
        // Public read-only properties
        Object.defineProperty(this, "parent", { enumerable: true, value: parent });
        // Backing fields for properties
        Object.defineProperty(this, "_isActive", { enumerable: false, value: true, writable: true });
        Object.defineProperty(this, "_events", { value: new EventScopeEvents() });
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
            return this._events.exitEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EventScope.prototype, "abortEvent", {
        get: function () {
            return this._events.abortEvent.asEventSubscriber();
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
            this._events.abortEvent.publish(this, { maxNestingExceeded: maxNestingExceeded });
            // Clear the events to ensure that they aren't
            // inadvertantly raised again through this scope
            this._events.abortEvent.clear();
            this._events.exitEvent.clear();
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
            var exitSubscriptions = getEventSubscriptions(this._events.exitEvent);
            if (exitSubscriptions && exitSubscriptions.length > 0) {
                // If there is no parent scope, then go ahead and execute the 'exit' event
                if (this.parent === null || !this.parent.isActive) {
                    // Record the initial version and initial number of subscribers
                    this._exitEventVersion = 0;
                    this._exitEventHandlerCount = exitSubscriptions.length;
                    // Invoke all subscribers
                    this._events.exitEvent.publish(this, {});
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
                            _this.parent._events.exitEvent.subscribe(sub.handler);
                        }
                    });
                    if (this.parent.hasOwnProperty("_exitEventVersion")) {
                        this.parent._exitEventVersion++;
                    }
                }
                // Clear the events to ensure that they aren't
                // inadvertantly raised again through this scope
                this._events.abortEvent.clear();
                this._events.exitEvent.clear();
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
var EventScopeEvents = /** @class */ (function () {
    function EventScopeEvents() {
        this.exitEvent = new Event();
        this.abortEvent = new Event();
    }
    return EventScopeEvents;
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
        EventScope$current._events.exitEvent.subscribe(callback.bind(thisPtr));
    }
}
function EventScope$onAbort(callback, thisPtr) {
    if (thisPtr === void 0) { thisPtr = null; }
    if (EventScope$current !== null) {
        if (!EventScope$current.isActive) {
            throw new Error("The current event scope cannot be inactive.");
        }
        // Subscribe to the abort event
        EventScope$current._events.abortEvent.subscribe(callback.bind(thisPtr));
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
                this._execute = thisOptions.execute;
        }
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(this);
        }
    }
    Rule.prototype.execute = function (entity) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this._execute) {
            this._execute.call(entity);
        }
    };
    // Indicates that the rule should run only for new instances when initialized
    Rule.prototype.onInitNew = function () {
        // ensure the rule has not already been registered
        if (this._registered)
            throw new Error("Rules cannot be configured once they have been registered: " + this.name);
        // configure the rule to run on init new
        this.invocationTypes |= exports.RuleInvocationType.InitNew;
        return this;
    };
    // indicates that the rule should run only for existing instances when initialized
    Rule.prototype.onInitExisting = function () {
        // ensure the rule has not already been registered
        if (this._registered)
            throw new Error("Rules cannot be configured once they have been registered: " + this.name);
        // configure the rule to run on init existingh
        this.invocationTypes |= exports.RuleInvocationType.InitExisting;
        return this;
    };
    // indicates that the rule should run for both new and existing instances when initialized
    Rule.prototype.onInit = function () {
        // ensure the rule has not already been registered
        if (this._registered)
            throw new Error("Rules cannot be configured once they have been registered: " + this.name);
        // configure the rule to run on both init new and init existing
        this.invocationTypes |= exports.RuleInvocationType.InitNew | exports.RuleInvocationType.InitExisting;
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
        if ((this.invocationTypes & exports.RuleInvocationType.PropertyGet) === 0)
            this.invocationTypes |= exports.RuleInvocationType.PropertyChanged;
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
        this.invocationTypes |= exports.RuleInvocationType.PropertyGet;
        this.invocationTypes &= ~exports.RuleInvocationType.PropertyChanged;
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
function canExecuteRule(rule, obj, eventArgument) {
    // ensure the rule target is a valid rule root type
    return obj instanceof rule.rootType.jstype;
}
function executeRule(rule, obj, eventArgument) {
    // Ensure that the rule can be executed.
    if (!canExecuteRule(rule, obj, eventArgument)) {
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
        rule.execute(obj);
    });
}
function prepareRuleForRegistration(rule, callback) {
    // resolve return values, which should all be loaded since the root type is now definitely loaded
    if (rule.returnValues) {
        rule.returnValues.forEach(function (returnValue, i) {
            if (!(returnValue instanceof Property)) {
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
                    Model$getPropertyOrPropertyChain(path, rule.rootType, rule.rootType.model._allTypesRoot, false, signal.pending(function (propertyChain) {
                        rule.predicates[predicateIndex_1] = propertyChain;
                    }, this, true), this);
                }, this_1);
            }
            else if (!(predicate instanceof Property || predicate instanceof PropertyChain)) {
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
    if (rule.invocationTypes & exports.RuleInvocationType.InitNew)
        rule.rootType._events.initNewEvent.subscribe(function (args) { executeRule(rule, args.entity, args); });
    // register for init existing
    if (rule.invocationTypes & exports.RuleInvocationType.InitExisting) {
        rule.rootType._events.initExistingEvent.subscribe(function (args) { executeRule(rule, args.entity, args); });
    }
    // register for property change
    if (rule.invocationTypes & exports.RuleInvocationType.PropertyChanged) {
        rule.predicates.forEach(function (predicate) {
            Property$addChanged(predicate, function (args) {
                if (canExecuteRule(rule, args.entity, args) && !pendingInvocation(args.entity.meta, rule)) {
                    pendingInvocation(args.entity.meta, rule, true);
                    EventScope$onExit(function () {
                        pendingInvocation(args.entity.meta, rule, false);
                        executeRule(rule, args.entity, args);
                    });
                    EventScope$onAbort(function () {
                        pendingInvocation(args.entity.meta, rule, false);
                    });
                }
            }, null, // no object filter
            // false, // subscribe for all time, not once
            true // tolerate nulls since rule execution logic will handle guard conditions
            );
        });
    }
    // register for property get
    if (rule.invocationTypes & exports.RuleInvocationType.PropertyGet && rule.returnValues) {
        // register for property get events for each return value to calculate the property when accessed
        rule.returnValues.forEach(function (returnValue) {
            Property$addAccessed(returnValue, function (args) {
                // run the rule to initialize the property if it is pending initialization
                if (canExecuteRule(rule, args.entity, args) && Property$pendingInit(args.entity, returnValue)) {
                    Property$pendingInit(args.entity, returnValue, false);
                    executeRule(rule, args.entity, args);
                }
            });
        });
        // register for property change events for each predicate to invalidate the property value when inputs change
        rule.predicates.forEach(function (predicate) {
            Property$addChanged(predicate, function (args) {
                if (rule.returnValues.some(function (returnValue) { return hasPropertyChangedSubscribers(returnValue, args.entity); })) {
                    // Immediately execute the rule if there are explicit event subscriptions for the property
                    if (canExecuteRule(rule, args.entity, args) && !pendingInvocation(args.entity.meta, rule)) {
                        pendingInvocation(args.entity.meta, rule, true);
                        EventScope$onExit(function () {
                            pendingInvocation(args.entity.meta, rule, false);
                            executeRule(rule, args.entity, args);
                        });
                        EventScope$onAbort(function () {
                            pendingInvocation(args.entity.meta, rule, false);
                        });
                    }
                }
                else {
                    // Otherwise, just mark the property as pending initialization and raise property change for UI subscribers
                    rule.returnValues.forEach(function (returnValue) {
                        Property$pendingInit(args.entity, returnValue, true);
                    });
                    // Defer change notification until the scope of work has completed
                    EventScope$onExit(function () {
                        rule.returnValues.forEach(function (returnValue) {
                            // TODO: Implement observable?
                            args.entity._events.changedEvent.publish(args.entity, { entity: args.entity, property: returnValue });
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
    var subscriptions = getEventSubscriptions(rule.property._events.ruleRegisteredEvent);
    if (subscriptions && subscriptions.length > 0) {
        rule.property._events.ruleRegisteredEvent.publish(rule.property, { rule: rule });
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
                    if (typeof p === "string" || p instanceof PropertyChain || p instanceof Property) {
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
            else if (value instanceof PropertyChain) {
                options.onChangeOf = [value];
                return true;
            }
            else if (value instanceof Property) {
                options.onChangeOf = [value];
                return true;
            }
        }
        else if (key === 'returns') {
            if (Array.isArray(value)) {
                var invalidReturns_1 = null;
                options.returns = value.filter(function (p) {
                    if (typeof p === "string" || p instanceof PropertyChain || p instanceof Property) {
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
            else if (value instanceof Property) {
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
function Rule$ensureConditionType(ruleName, typeOrProp, category) {
    if (category === void 0) { category = "Error"; }
    var generatedCode = typeOrProp instanceof Property ? typeOrProp.containingType.fullName + "." + typeOrProp.name + "." + ruleName :
        typeOrProp instanceof Type ? typeOrProp + "." + ruleName :
            ruleName;
    var counter = "";
    while (exports.ConditionType.get(generatedCode + counter))
        counter = (typeof counter === "string" ? 0 : counter) + 1;
    var DesiredConditionType;
    if (category === "Error") {
        DesiredConditionType = ErrorConditionType;
    }
    else if (category === "Warning") {
        DesiredConditionType = WarningConditionType;
    }
    else {
        throw new Error("Cannot create condition type for unsupported category '" + category + "'.");
    }
    // return a new client condition type of the specified category
    return new DesiredConditionType(generatedCode + counter, "Generated condition type for " + ruleName + " rule.", null, "client");
}

var Type$newIdPrefix = "+c";
var Type = /** @class */ (function () {
    function Type(model, fullName, baseType, origin) {
        if (baseType === void 0) { baseType = null; }
        if (origin === void 0) { origin = "client"; }
        // Public read-only properties
        Object.defineProperty(this, "model", { enumerable: true, value: model });
        Object.defineProperty(this, "fullName", { enumerable: true, value: fullName });
        Object.defineProperty(this, "jstype", { enumerable: true, value: Type$_generateConstructor(this, fullName, baseType, model.settings.useGlobalObject ? getGlobalObject() : null) });
        Object.defineProperty(this, "baseType", { enumerable: true, value: baseType });
        // Public settable properties
        this.origin = origin;
        this.originForNewProperties = this.origin;
        // Backing fields for properties
        Object.defineProperty(this, "_lastId", { enumerable: false, value: 0, writable: true });
        Object.defineProperty(this, "_pool", { enumerable: false, value: {}, writable: false });
        Object.defineProperty(this, "_legacyPool", { enumerable: false, value: {}, writable: false });
        Object.defineProperty(this, "_properties", { enumerable: false, value: {}, writable: false });
        Object.defineProperty(this, "_formats", { configurable: false, enumerable: false, value: {}, writable: false });
        Object.defineProperty(this, '_derivedTypes', { enumerable: false, value: [], writable: false });
        Object.defineProperty(this, "_events", { value: new TypeEvents() });
        // Object.defineProperty(this, "rules", { value: [] });
        // TODO: Is self-reference to type needed?
        // Add self-reference to decrease the likelihood of errors
        // due to an absence of the necessary type vs. entity.
        // this.type = this;
    }
    Object.defineProperty(Type.prototype, "destroy", {
        get: function () {
            return this._events.destroyEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Type.prototype, "initNew", {
        get: function () {
            return this._events.initNewEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Type.prototype, "initExisting", {
        get: function () {
            return this._events.initExistingEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Type.prototype, "conditionsChanged", {
        get: function () {
            return this._events.conditionsChangedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Type.prototype, "format", {
        // static get newIdPrefix() {
        // 	return newIdPrefix.substring(1);
        // }
        // static set newIdPrefix(value) {
        // 	if (typeof (value) !== "string") throw new TypeError("Property `Type.newIdPrefix` must be a string, found <" + (typeof value) + ">");
        // 	if (value.length === 0) throw new Error("Property `Type.newIdPrefix` cannot be empty string");
        // 	newIdPrefix = "+" + value;
        // }
        get: function () {
            if (this._format) {
                return this._format;
            }
            if (this.baseType) {
                return this.baseType.format;
            }
        },
        set: function (value) {
            if (value && typeof value === "string") {
                value = getFormat(this.model, this.jstype, value);
            }
            Object.defineProperty(this, "_format", { configurable: true, enumerable: false, value: value, writable: true });
        },
        enumerable: true,
        configurable: true
    });
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
        return Type$newIdPrefix + nextId;
    };
    Type.prototype.register = function (obj, id, suppressModelEvent) {
        if (suppressModelEvent === void 0) { suppressModelEvent = false; }
        // register is called with single argument from default constructor
        if (arguments.length === 2) {
            Type$_validateId.call(this, id);
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
                t._known.push(obj);
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
            this.model._events.entityRegisteredEvent.publish(this.model, { entity: obj });
        }
    };
    Type.prototype.changeObjectId = function (oldId, newId) {
        Type$_validateId.call(this, oldId);
        Type$_validateId.call(this, newId);
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
                var objIndex = t._known.indexOf(obj);
                if (objIndex >= 0) {
                    t._known.splice(objIndex, 1);
                }
            }
        }
        this.model._events.entityUnregisteredEvent.publish(this.model, { entity: obj });
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
            known = this._known = ObservableArray.ensureObservable(list);
        }
        return known;
    };
    Type.prototype.addProperty = function (name, jstype, isList, isStatic, options) {
        if (options === void 0) { options = {}; }
        var format = null;
        if (options.format) {
            if (typeof (options.format) === "string") {
                format = getFormat(this.model, jstype, options.format);
            }
            else if (format.constructor === Format) {
                format = options.format;
            }
        }
        var property = new Property(this, name, jstype, options.label, options.helptext, format, isList, isStatic, options.isPersisted, options.isCalculated, options.defaultValue);
        this._properties[name] = property;
        // TODO: Implement static and instance property storage?
        // (isStatic ? this._staticProperties : this._instanceProperties)[name] = property;
        Property$_generateShortcuts(property, property.containingType.jstype);
        if (property.isStatic) {
            Property$_generateStaticProperty(property, this.jstype);
        }
        else if (this.model.settings.createOwnProperties === true) {
            for (var id in this._pool) {
                if (Object.prototype.hasOwnProperty.call(this._pool, id)) {
                    Property$_generateOwnProperty(property, this._pool[id]);
                }
            }
        }
        else {
            Property$_generatePrototypeProperty(property, this.jstype.prototype);
        }
        this.model._events.propertyAddedEvent.publish(this.model, { property: property });
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
    Type.prototype.addRule = function (optionsOrFunction) {
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
        var rule = new Rule(this, options.name, options);
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
var TypeEvents = /** @class */ (function () {
    function TypeEvents() {
        this.initNewEvent = new Event();
        this.initExistingEvent = new Event();
        this.destroyEvent = new Event();
        this.conditionsChangedEvent = new Event();
    }
    return TypeEvents;
}());
function Type$_validateId(id) {
    if (id === null || id === undefined) {
        throw new Error("Id cannot be " + (id === null ? "null" : "undefined") + " (entity = " + this.fullName + ").");
    }
    else if (getTypeName(id) !== "string") {
        throw new Error("Id must be a string:  encountered id " + id + " of type \"" + parseFunctionName(id.constructor) + "\" (entity = " + this.fullName + ").");
    }
    else if (id === "") {
        throw new Error("Id cannot be a blank string (entity = " + this.fullName + ").");
    }
}
// TODO: Get rid of disableConstruction?
var disableConstruction = false;
function Type$_generateConstructor(type, fullName, baseType, global) {
    if (baseType === void 0) { baseType = null; }
    if (global === void 0) { global = null; }
    // Create namespaces as needed
    var nameTokens = fullName.split("."), token = nameTokens.shift(), namespaceObj = type.model._allTypesRoot, globalObj = global;
    while (nameTokens.length > 0) {
        namespaceObj = ensureNamespace(token, namespaceObj);
        if (global) {
            globalObj = ensureNamespace(token, globalObj);
        }
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
                    t._events.initExistingEvent.publish(t, { entity: this });
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
                    t._events.initNewEvent.publish(t, { entity: this });
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
    if (global) {
        // If the global object already contains a type with this name, append a '$' to the name
        if (!globalObj[finalName]) {
            globalObj[finalName] = ctor;
        }
        else {
            globalObj['$' + finalName] = ctor;
        }
    }
    // Setup inheritance
    var baseConstructor;
    if (baseType) {
        baseConstructor = baseType.jstype;
        // // TODO: Implement `inheritBaseTypePropShortcuts`
        // // inherit all shortcut properties that have aleady been defined
        // inheritBaseTypePropShortcuts(ctor, baseType);
    }
    else {
        baseConstructor = Entity;
    }
    disableConstruction = true;
    ctor.prototype = new baseConstructor();
    disableConstruction = false;
    ctor.prototype.constructor = ctor;
    // Add the 'meta' helper
    Object.defineProperty(ctor, "meta", { enumerable: false, value: type, configurable: false, writable: false });
    return ctor;
}

var intrinsicJsTypes = ["Object", "String", "Number", "Boolean", "Date", "Array"];
var Model = /** @class */ (function () {
    function Model(createOwnProperties, useGlobalObject) {
        if (createOwnProperties === void 0) { createOwnProperties = undefined; }
        if (useGlobalObject === void 0) { useGlobalObject = undefined; }
        Object.defineProperty(this, "settings", { configurable: false, enumerable: true, value: new ModelSettings(createOwnProperties, useGlobalObject), writable: false });
        Object.defineProperty(this, "_types", { value: {} });
        Object.defineProperty(this, "_allTypesRoot", { value: {} });
        Object.defineProperty(this, "_nativeTypeFormats", { configurable: false, enumerable: false, value: {}, writable: false });
        Object.defineProperty(this, "_fieldNamePrefix", { value: ("_fN" + randomText(3, false, true)) });
        Object.defineProperty(this, "_events", { value: new ModelEvents() });
    }
    Object.defineProperty(Model.prototype, "typeAdded", {
        get: function () {
            return this._events.typeAddedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "entityRegistered", {
        get: function () {
            return this._events.entityRegisteredEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "entityUnregistered", {
        get: function () {
            return this._events.entityUnregisteredEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "propertyAdded", {
        get: function () {
            return this._events.propertyAddedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    // dispose() {
    // 	// TODO: Implement model disposal
    // 	// for (var key in this._types) {
    // 	// 	delete window[key];
    // 	// }
    // }
    Model.prototype.getTypes = function () {
        var typesArray = [];
        for (var typeName in this._types) {
            if (this._types.hasOwnProperty(typeName)) {
                typesArray.push(this._types[typeName]);
            }
        }
        return typesArray;
    };
    Model.prototype.addType = function (fullName, baseType, origin) {
        if (baseType === void 0) { baseType = null; }
        if (origin === void 0) { origin = "client"; }
        var type = new Type(this, fullName, baseType ? baseType : null, origin);
        this._types[fullName] = type;
        this._events.typeAddedEvent.publish(this, { type: type });
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
var ModelEvents = /** @class */ (function () {
    function ModelEvents() {
        // TODO: Don't construct events by default, only when subscribed (optimization)
        // TODO: Extend `EventDispatcher` with `any()` function to check for subscribers (optimization)
        this.typeAddedEvent = new Event();
        this.entityRegisteredEvent = new Event();
        this.entityUnregisteredEvent = new Event();
        this.propertyAddedEvent = new Event();
    }
    return ModelEvents;
}());
var ModelSettings = /** @class */ (function () {
    function ModelSettings(createOwnProperties, useGlobalObject) {
        if (createOwnProperties === void 0) { createOwnProperties = false; }
        if (useGlobalObject === void 0) { useGlobalObject = false; }
        // There is a slight speed cost to creating own properties,
        // which may be noticeable with very large object counts.
        this.createOwnProperties = false;
        // Don't pollute the window object by default
        this.useGlobalObject = false;
        Object.defineProperty(this, "createOwnProperties", { configurable: false, enumerable: true, value: createOwnProperties, writable: false });
        Object.defineProperty(this, "useGlobalObject", { configurable: false, enumerable: true, value: useGlobalObject, writable: false });
    }
    return ModelSettings;
}());
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
 * @param allTypesRoot The model namespace that contains all types
 * @param allowUndefined If true, return undefined if the type is not defined
 */
function Model$getJsType(fullName, allTypesRoot, allowUndefined) {
    if (allowUndefined === void 0) { allowUndefined = false; }
    var steps = fullName.split(".");
    if (steps.length === 1 && intrinsicJsTypes.indexOf(fullName) > -1) {
        return allTypesRoot[fullName];
    }
    else {
        var obj = void 0;
        var ns = allTypesRoot;
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
function Model$getPropertyOrPropertyChain(pathOrTokens, thisType, allTypesRoot, forceLoadTypes, callback, thisPtr) {
    if (forceLoadTypes === void 0) { forceLoadTypes = false; }
    if (callback === void 0) { callback = null; }
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
        type = Model$getJsType(tokens.steps[0].cast, allTypesRoot, false).meta;
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
            return type.getProperty(singlePropertyName);
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
            var jstype = Model$getJsType(globalTypeName, allTypesRoot, true);
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
            type = jstype.meta;
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

var allConditionTypeSets = {};
/** Groups condition types into a set in order to be notified conditions for these types change. */
var ConditionTypeSet = /** @class */ (function () {
    /**
    * Creates a set of condition types.
    * @param name The name of the set
    */
    function ConditionTypeSet(name) {
        if (allConditionTypeSets[name])
            throw new Error("A set with the name \"" + name + "\" has already been created.");
        this.name = name;
        this.types = [];
        this.conditions = ObservableArray.create();
        Object.defineProperty(this, "_events", { value: new ConditionTypeSetEvents() });
        allConditionTypeSets[name] = this;
    }
    Object.defineProperty(ConditionTypeSet.prototype, "conditionsChanged", {
        get: function () {
            return this._events.conditionsChangedEvent.asEventSubscriber();
        },
        enumerable: true,
        configurable: true
    });
    /**
    * Gets all condition type sets that have been created.
    * @returns Array of all condition type sets.
    * */
    ConditionTypeSet.all = function () {
        var all = [];
        for (var type in allConditionTypeSets.keys) {
            all.push(allConditionTypeSets[type]);
        }
        return all;
    };
    /**
    * Gets the condition type set with the specified name.
    * @param name
    */
    ConditionTypeSet.get = function (name) {
        return allConditionTypeSets[name];
    };
    return ConditionTypeSet;
}());
var ConditionTypeSetEvents = /** @class */ (function () {
    function ConditionTypeSetEvents() {
        this.conditionsChangedEvent = new Event();
    }
    return ConditionTypeSetEvents;
}());

var ConditionRule = /** @class */ (function (_super) {
    __extends(ConditionRule, _super);
    /**
     * Creates a rule that asserts a condition based on a predicate
     * @param rootType The model type the rule is for
     * @param options The options for the rule, of type ConditionRuleOptions
     */
    function ConditionRule(rootType, options, skipRegistration) {
        if (skipRegistration === void 0) { skipRegistration = false; }
        var _this = this;
        // Exit immediately if called with no arguments
        if (arguments.length === 0)
            return;
        // automatically run the condition rule during initialization of new instances
        if (!options.hasOwnProperty("onInitNew")) {
            options.onInitNew = true;
        }
        // coerce string to condition type
        var conditionType = options.conditionType;
        if (typeof conditionType === "string") {
            conditionType = exports.ConditionType.get(conditionType);
        }
        // automatically run the condition rule during initialization of existing instances if the condition type was defined on the client
        if (!options.hasOwnProperty("onInitExisting") && conditionType && conditionType.origin !== "server") {
            options.onInitExisting = true;
        }
        // Call the base rule constructor
        _this = _super.call(this, rootType, name, options, true) || this;
        // store the condition predicate
        var assert = options.assert || options.fn;
        if (assert) {
            _this._assert = assert;
        }
        if (!conditionType) {
            // create a condition type if not passed in, defaulting to Error if a condition category was not specified
            conditionType = Rule$ensureConditionType(options.name, rootType, options.category || "ErrorConditionType");
        }
        Object.defineProperty(_this, "conditionType", { enumerable: true, value: conditionType });
        // store the condition message and properties
        if (options.message) {
            Object.defineProperty(_this, "_message", { value: options.message, writable: true });
        }
        Object.defineProperty(_this, "_properties", { value: options.properties || [], writable: true });
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(_this);
        }
        return _this;
    }
    // subclasses may override this function to return the set of properties to attach conditions to for this rule
    ConditionRule.prototype.getProperties = function () {
        return hasOwnProperty(this, "_properties") ? this._properties : [];
    };
    // subclasses may override this function to calculate an appropriate message for this rule during the registration process
    ConditionRule.prototype.getMessage = function (obj) {
        if (hasOwnProperty(this, "_message")) {
            if (typeof this._message === "string") {
                var compiledMessageFn = new Function(this._message);
                this._message = compiledMessageFn;
            }
            if (this._message instanceof Function) {
                return this._message.call(obj);
            }
        }
        return this.conditionType.message;
    };
    // subclasses may override this function to indicate whether the condition should be asserted
    ConditionRule.prototype.assert = function (obj) {
        // call assert the root object as "this" if the assertion function was overriden in the constructor
        if (hasOwnProperty(this, "_assert")) {
            // convert string functions into compiled functions on first execution
            if (typeof this._assert === "string") {
                this._assert = (new Function(this.assert));
            }
            return this._assert.call(obj);
        }
        throw new Error("ConditionRule.assert() must be passed into the constructor or overriden by subclasses.");
    };
    // asserts the condition and adds or removes it from the model if necessary
    ConditionRule.prototype.execute = function (obj) {
        var assert = this.assert(obj);
        var message;
        if (hasOwnProperty(this, "message")) {
            message = ConditionRule.prototype.getMessage.bind(this);
        }
        // create or remove the condition if necessary
        if (assert !== undefined) {
            this.conditionType.when(assert, obj, this._properties instanceof Function ? this._properties.call(obj) : this._properties, message);
        }
    };
    // gets the string representation of the condition rule
    ConditionRule.prototype.toString = function () {
        return typeof this._message === "string" ? this._message : this.conditionType.message;
    };
    return ConditionRule;
}(Rule));

var ValidatedPropertyRule = /** @class */ (function (_super) {
    __extends(ValidatedPropertyRule, _super);
    function ValidatedPropertyRule(rootType, options, skipRegistration) {
        /// <summary>Creates a rule that validates the value of a property in the model.</summary>
        /// <param name="rootType" type="Type">The model type the rule is for.</param>
        /// <param name="options" type="Object">
        ///		The options for the rule, including:
        ///			property:			the property being validated (either a Property instance or string property name)
        ///			isValid:			function (obj, prop, val) { return true; } (a predicate that returns true when the property is valid)
        ///			name:				the optional unique name of the type of validation rule
        ///			conditionType:		the optional condition type to use, which will be automatically created if not specified
        ///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
        ///			message:			the message to show the user when the validation fails
        ///			properties:			an array of property paths the validation condition should be attached to when asserted, in addition to the target property
        ///			onInit:				true to indicate the rule should run when an instance of the root type is initialized, otherwise false
        ///			onInitNew:			true to indicate the rule should run when a new instance of the root type is initialized, otherwise false
        ///			onInitExisting:		true to indicate the rule should run when an existing instance of the root type is initialized, otherwise false
        ///			onChangeOf:			an array of property paths (strings, Property or PropertyChain instances) that drive when the rule should execute due to property changes
        /// </param>
        /// <returns type="ValidatedPropertyRule">The new validated property rule.</returns>
        if (skipRegistration === void 0) { skipRegistration = false; }
        var _this = this;
        // exit immediately if called with no arguments
        if (arguments.length == 0)
            return;
        // ensure the rule name is specified
        options.name = options.name || "ValidatedProperty";
        // store the property being validated
        var property = typeof options.property === "string" ? rootType.getProperty(options.property) : options.property;
        // ensure the properties and predicates to include the target property
        if (!options.properties) {
            options.properties = [property.name];
        }
        else if (options.properties.indexOf(property.name) < 0 && options.properties.indexOf(property) < 0) {
            options.properties.push(property.name);
        }
        if (!options.onChangeOf) {
            options.onChangeOf = [property];
        }
        else if (options.onChangeOf.indexOf(property.name) < 0 && options.onChangeOf.indexOf(property) < 0) {
            options.onChangeOf.push(property);
        }
        // Default condition category to Error if a condition category was not specified
        if (!options.conditionType) {
            options.category = "Error";
        }
        // replace the property label token in the validation message if present
        if (options.message && typeof (options.message) !== "function") {
            options.message = options.message.replace('{property}', property.label);
        }
        // call the base rule constructor
        _this = _super.call(this, rootType, options, true) || this;
        Object.defineProperty(_this, "property", { value: property });
        // override the prototype isValid function if specified
        if (options.isValid instanceof Function) {
            Object.defineProperty(_this, "_isValid", { value: options.isValid });
        }
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(_this);
        }
        return _this;
    }
    // returns false if the property is valid, true if invalid, or undefined if unknown
    ValidatedPropertyRule.prototype.isValid = function (obj, prop, val) {
        return this._isValid.call(obj, prop, val);
    };
    // returns false if the property is valid, true if invalid, or undefined if unknown
    ValidatedPropertyRule.prototype.assert = function (obj) {
        var isValid = this.isValid(obj, this.property, this.property.value(obj));
        return isValid === undefined ? isValid : !isValid;
    };
    // perform addition initialization of the rule when it is registered
    ValidatedPropertyRule.prototype.onRegister = function () {
        // register the rule with the target property
        registerPropertyRule(this);
    };
    return ValidatedPropertyRule;
}(ConditionRule));

var AllowedValuesRule = /** @class */ (function (_super) {
    __extends(AllowedValuesRule, _super);
    /**
     * Creates a rule that validates whether a selected value or values is in a list of allowed values.
     * @param rootType The root type to bind the rule to
     * @param options The rule configuration options
     */
    function AllowedValuesRule(rootType, options, skipRegistration) {
        if (skipRegistration === void 0) { skipRegistration = false; }
        var _this = this;
        // ensure the rule name is specified
        options.name = options.name || "AllowedValues";
        // ensure the error message is specified
        // options.message = options.message || Resource.get("allowed-values");
        options.message = options.message || Resource.get("allowed-values");
        var source;
        var sourcePath;
        var sourceFn;
        // subscribe to changes to the source property
        if (options.source) {
            // define properties for the rule
            if (options.source instanceof Property || options.source instanceof PropertyChain) {
                sourcePath = options.source.getPath();
                source = options.source;
                options.onChangeOf = [options.source];
            }
            else if (options.source instanceof Function) {
                sourceFn = options.source;
            }
            else {
                sourcePath = options.source;
                options.onChangeOf = [options.source];
            }
        }
        // Default condition category to Error if a condition category was not specified
        if (!options.conditionType) {
            options.category = "Error";
        }
        // never run allowed values rules during initialization of existing instances
        if (!options.hasOwnProperty("onInitExisting") && options.conditionType instanceof exports.ConditionType && options.conditionType.origin === "server") {
            options.onInitExisting = false;
        }
        // call the base type constructor
        _this = _super.call(this, rootType, options, true) || this;
        if (source) {
            Object.defineProperty(_this, "_source", { enumerable: false, value: source });
        }
        if (sourcePath) {
            Object.defineProperty(_this, "_sourcePath", { enumerable: false, value: sourcePath });
        }
        if (sourceFn) {
            Object.defineProperty(_this, "_sourceFn", { enumerable: false, value: sourceFn });
        }
        if (options.ignoreValidation) {
            Object.defineProperty(_this, "ignoreValidation", { value: options.ignoreValidation });
        }
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(_this);
        }
        return _this;
    }
    AllowedValuesRule.prototype.onRegister = function () {
        // get the allowed values source, if only the path was specified
        if (!this._source && !this._sourceFn) {
            this._source = Model$getPropertyOrPropertyChain(this._sourcePath, this.rootType, this.rootType.model._allTypesRoot);
        }
        _super.prototype.onRegister.call(this);
    };
    AllowedValuesRule.prototype.isValid = function (obj, prop, value) {
        //gives the ability to create a drop down of available options
        //but does not need validatin (combo box)
        if (this.ignoreValidation) {
            return true;
        }
        // return true if no value is currently selected
        if (!value) {
            return true;
        }
        // get the list of allowed values of the property for the given object
        var allowed = this.values(obj);
        // TODO: Lazy loading?
        // return undefined if the set of allowed values cannot be determined
        // if (!LazyLoader.isLoaded(allowed)) {
        // 	return;
        // }
        // ensure that the value or list of values is in the allowed values list (single and multi-select)				
        if (value instanceof Array) {
            return value.every(function (item) { return allowed.indexOf(item) >= 0; });
        }
        else {
            return allowed.indexOf(value) >= 0;
        }
    };
    // // Subscribes to changes to the allow value predicates, indicating that the allowed values have changed
    // addChanged(handler, obj, once) {
    // 	for (var p = 0; p < this.predicates.length; p++) {
    // 		var predicate = this.predicates[p];
    // 		if (predicate !== this.property)
    // 			predicate.addChanged(handler, obj, once);
    // 	}
    // }
    // // Unsubscribes from changes to the allow value predicates
    // removeChanged(handler, obj, once) {
    // 	for (var p = 0; p < this.predicates.length; p++) {
    // 		var predicate = this.predicates[p];
    // 		if (predicate !== this.property)
    // 			predicate.removeChanged(handler, obj, once);
    // 	}
    // }
    AllowedValuesRule.prototype.values = function (obj, exitEarly) {
        if (exitEarly === void 0) { exitEarly = false; }
        if (!this._source && !this._sourceFn) {
            // TODO: Log warning?
            // logWarning("AllowedValues rule on type \"" + this.prop.get_containingType().get_fullName() + "\" has not been initialized.");
            return;
        }
        // Function-based allowed values
        if (this._sourceFn) {
            // convert string functions into compiled functions on first execution
            if (typeof this._sourceFn === "string") {
                this._sourceFn = (new Function(this._sourceFn));
            }
            return this._sourceFn.call(obj);
        }
        // Property path-based allowed values
        else {
            // For non-static properties, verify that a final target exists and
            // if not return an appropriate null or undefined value instead.
            if (!(this._source instanceof Property) || !this._source.isStatic) {
                // Get the value of the last target for the source property (chain).
                var target = obj;
                if (this._source instanceof PropertyChain) {
                    this._source.getLastTarget(obj, exitEarly);
                }
                // Use the last target to distinguish between the absence of data and
                // data that has not been loaded, if a final value cannot be obtained.
                if (target === undefined) {
                    // Undefined signifies unloaded data
                    return undefined;
                }
                else if (target === null) {
                    // Null signifies the absensce of a value
                    return null;
                }
            }
            // Return the value of the source for the given object
            return this._source.value(obj);
        }
    };
    AllowedValuesRule.prototype.toString = function () {
        return this.property.containingType.fullName + "." + this.property.name + " allowed values = " + this._sourcePath;
    };
    return AllowedValuesRule;
}(ValidatedPropertyRule));

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
                property = typeof thisOptions.property === "string" ? rootType.getProperty(thisOptions.property) : thisOptions.property;
                // indicate that the rule is responsible for returning the value of the calculated property
                options.returns = [property];
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
                newValue = calculateFn.call(obj);
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
            curList.batchUpdate(function (array) {
                updateArray(array, newList);
            });
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
function extractCalculatedPropertyRuleOptions(obj) {
    if (!obj) {
        return;
    }
    var options = {};
    var keys = Object.keys(obj);
    var extractedKeys = keys.filter(function (key) {
        var value = obj[key];
        if (key === 'property') {
            if (value instanceof Property) {
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

var RequiredRule = /** @class */ (function (_super) {
    __extends(RequiredRule, _super);
    function RequiredRule(rootType, options, skipRegistration) {
        /// <summary>Creates a rule that validates that a property has a value.</summary>
        /// <param name="rootType" type="Type">The model type the rule is for.</param>
        /// <param name="options" type="Object">
        ///		The options for the rule, including:
        ///			property:			the property being validated (either a Property instance or string property name)
        ///			name:				the optional unique name of the type of validation rule
        ///			conditionType:		the optional condition type to use, which will be automatically created if not specified
        ///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
        ///			message:			the message to show the user when the validation fails
        ///			requiredValue:		the optional required value
        /// </param>
        /// <returns type="RequiredRule">The new required rule.</returns>
        if (skipRegistration === void 0) { skipRegistration = false; }
        var _this = this;
        // ensure the rule name is specified
        options.name = options.name || "Required";
        // ensure the error message is specified
        options.message = options.message || Resource.get("required");
        // call the base type constructor
        _this = _super.call(this, rootType, options, true) || this;
        if (options.requiredValue)
            Object.defineProperty(_this, "requiredValue", { value: options.requiredValue });
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(_this);
        }
        return _this;
    }
    // define a global function that determines if a value exists
    RequiredRule.hasValue = function (val) {
        return val !== undefined && val !== null && (val.constructor !== String || val.trim() !== "") && (!(val instanceof Array) || val.length > 0);
    };
    // returns true if the property is valid, otherwise false
    RequiredRule.prototype.isValid = function (obj, prop, val) {
        if (this.requiredValue)
            return val === this.requiredValue;
        else
            return RequiredRule.hasValue(val);
    };
    // get the string representation of the rule
    RequiredRule.prototype.toString = function () {
        return this.property.containingType.fullName + "." + this.property.name + " is required";
    };
    return RequiredRule;
}(ValidatedPropertyRule));

var RequiredIfRule = /** @class */ (function (_super) {
    __extends(RequiredIfRule, _super);
    function RequiredIfRule(rootType, options, skipRegistration) {
        /// <summary>Creates a rule that conditionally validates whether a property has a value.</summary>
        /// <param name="rootType" type="Type">The model type the rule is for.</param>
        /// <param name="options" type="Object">
        ///		The options for the rule, including:
        ///			property:			the property being validated (either a Property instance or string property name)
        ///			isRequired:			a predicate function indicating whether the property should be required
        ///			name:				the optional unique name of the type of validation rule
        ///			conditionType:		the optional condition type to use, which will be automatically created if not specified
        ///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
        ///			message:			the message to show the user when the validation fails
        ///		    onInit:				true to indicate the rule should run when an instance of the root type is initialized, otherwise false
        ///		    onInitNew:			true to indicate the rule should run when a new instance of the root type is initialized, otherwise false
        ///		    onInitExisting:		true to indicate the rule should run when an existing instance of the root type is initialized, otherwise false
        ///		    onChangeOf:			an array of property paths (strings, Property or PropertyChain instances) that drive when the rule should execute due to property changes
        ///			requiredValue:		the optional required value
        /// </param>
        /// <returns type="RequiredIfRule">The new required if rule.</returns>
        if (skipRegistration === void 0) { skipRegistration = false; }
        var _this = this;
        options.name = options.name || "RequiredIf";
        // ensure changes to the compare source triggers rule execution
        if (!options.onChangeOf && options.compareSource) {
            options.onChangeOf = [options.compareSource];
        }
        if (!options.isRequired && options.fn) {
            options.isRequired = options.fn;
            options.fn = null;
        }
        // predicate-based rule
        if (options.isRequired) {
            options.message = options.message || Resource.get("required");
        }
        // call the base type constructor
        _this = _super.call(this, rootType, options, true) || this;
        // predicate-based rule
        if (options.isRequired) {
            Object.defineProperty(_this, "_isRequired", { value: options.isRequired, writable: true });
        }
        if (options.requiredValue)
            Object.defineProperty(_this, "requiredValue", { value: options.requiredValue });
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(_this);
        }
        return _this;
    }
    // returns false if the property is valid, true if invalid, or undefined if unknown
    RequiredIfRule.prototype.assert = function (obj) {
        var isReq;
        // convert string functions into compiled functions on first execution
        if (typeof this._isRequired === "string") {
            this._isRequired = (new Function(this._isRequired));
        }
        try {
            isReq = this._isRequired.call(obj);
        }
        catch (e) {
            isReq = false;
        }
        if (this.requiredValue) {
            return isReq && this.property.value(obj) !== this.requiredValue;
        }
        else {
            return isReq && !RequiredRule.hasValue(this.property.value(obj));
        }
    };
    return RequiredIfRule;
}(ValidatedPropertyRule));

var RangeRule = /** @class */ (function (_super) {
    __extends(RangeRule, _super);
    function RangeRule(rootType, options, skipRegistration) {
        /// <summary>Creates a rule that validates a property value is within a specific range.</summary>
        /// <param name="rootType" type="Type">The model type the rule is for.</param>
        /// <param name="options" type="Object">
        ///		The options for the rule, including:
        ///			property:			the property being validated (either a Property instance or string property name)
        ///			min:				the minimum valid value of the property (or function)
        ///			max:				the maximum valid value of the property (or function)
        ///			name:				the optional unique name of the type of validation rule
        ///			conditionType:		the optional condition type to use, which will be automatically created if not specified
        ///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
        ///			message:			the message to show the user when the validation fails
        ///		    onChangeOf:			an array of property paths (strings, Property or PropertyChain instances) that drive when the rule should execute due to property changes
        /// </param>
        /// <returns type="RangeRule">The new range rule.</returns>
        if (skipRegistration === void 0) { skipRegistration = false; }
        var _this = this;
        // exit immediately if called with no arguments
        if (arguments.length == 0)
            return;
        // ensure the rule name is specified
        options.name = options.name || "Range";
        // get the property being validated in order to determine the data type
        var property = options.property instanceof Property ? options.property : rootType.getProperty(options.property);
        // coerce date range constants
        if (options.min && !(options.min instanceof Function) && typeof options.min !== "string" && property.propertyType === Date) {
            options.min = new Date(options.min);
        }
        if (options.max && !(options.max instanceof Function) && typeof options.max !== "string" && property.propertyType === Date) {
            options.max = new Date(options.max);
        }
        // coerce null ranges to undefined
        if (options.min === null) {
            options.min = undefined;
        }
        if (options.max === null) {
            options.max = undefined;
        }
        // call the base type constructor
        _this = _super.call(this, rootType, options, true) || this;
        // Store the min and max functions
        Object.defineProperty(_this, "_min", { value: options.min, writable: true });
        Object.defineProperty(_this, "_max", { value: options.max, writable: true });
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(_this);
        }
        return _this;
    }
    // get the min and max range in effect for this rule for the specified instance
    RangeRule.prototype.range = function (obj) {
        // convert string functions into compiled functions on first execution
        if (this._min && !(this._min instanceof Function)) {
            if (typeof this._min === "string") {
                this._min = (new Function(this._min));
            }
            else {
                // convert constant values into functions
                var min_1 = this._min;
                this._min = function () { return min_1; };
            }
        }
        if (this._max && !(this._max instanceof Function)) {
            if (typeof this._max === "string") {
                this._max = (new Function(this._max));
            }
            else {
                // convert constant values into functions
                var max_1 = this._max;
                this._max = function () { return max_1; };
            }
        }
        // determine the min and max values based on the current state of the instance
        var range = {};
        if (this._min && this._min instanceof Function)
            try {
                range.min = this._min.call(obj);
            }
            catch (e) { }
        if (this._max && this._max instanceof Function)
            try {
                range.max = this._max.call(obj);
            }
            catch (e) { }
        range.min = range.min == null ? undefined : range.min;
        range.max = range.max == null ? undefined : range.max;
        return range;
    };
    // returns true if the property is valid, otherwise false
    RangeRule.prototype.isValid = function (obj, prop, val) {
        var range = this.range(obj);
        return val === null || val === undefined || ((range.min === undefined || val >= range.min) && (range.max === undefined || val <= range.max));
    };
    RangeRule.prototype.getMessage = function (obj) {
        var range = this.range(obj);
        // ensure the error message is specified
        var message = (range.min !== undefined && range.max !== undefined ? Resource.get("range-between").replace("{min}", Property$format(this.property, range.min) || range.min).replace("{max}", Property$format(this.property, range.max) || range.max) : // between date or ordinal
            this.property.propertyType === Date ?
                range.min !== undefined ?
                    Resource.get("range-on-or-after").replace("{min}", Property$format(this.property, range.min) || range.min) : // on or after date
                    Resource.get("range-on-or-before").replace("{max}", Property$format(this.property, range.max) || range.max) : // on or before date
                range.min !== undefined ?
                    Resource.get("range-at-least").replace("{min}", Property$format(this.property, range.min) || range.min) : // at least ordinal
                    Resource.get("range-at-most").replace("{max}", Property$format(this.property, range.max) || range.max)); // at most ordinal
        return message.replace('{property}', this.property.label);
    };
    // get the string representation of the rule
    RangeRule.prototype.toString = function () {
        return this.property.containingType.fullName + "." + this.property.name + " in range, min: , max: ";
    };
    return RangeRule;
}(ValidatedPropertyRule));

var StringLengthRule = /** @class */ (function (_super) {
    __extends(StringLengthRule, _super);
    function StringLengthRule(rootType, options, skipRegistration) {
        /// <summary>Creates a rule that validates that the length of a string property is within a specific range.</summary>
        /// <param name="rootType" type="Type">The model type the rule is for.</param>
        /// <param name="options" type="Object">
        ///		The options for the rule, including:
        ///			property:			the property being validated (either a Property instance or string property name)
        ///			min:				the minimum length of the property
        ///			max:				the maximum length of the property
        ///			name:				the optional unique name of the type of validation rule
        ///			conditionType:		the optional condition type to use, which will be automatically created if not specified
        ///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
        ///			message:			the message to show the user when the validation fails
        /// </param>
        /// <returns type="RangeRule">The new range rule.</returns>
        if (skipRegistration === void 0) { skipRegistration = false; }
        var _this = this;
        // ensure the rule name is specified
        options.name = options.name || "StringLength";
        // ensure the error message is specified
        options.message = options.message ||
            (options.min && options.max ? Resource.get("string-length-between").replace("{min}", options.min).replace("{max}", options.max) :
                options.min ? Resource.get("string-length-at-least").replace("{min}", options.min) :
                    Resource.get("string-length-at-most").replace("{max}", options.max));
        var min = options.min;
        delete options.min;
        var max = options.max;
        delete options.max;
        // call the base type constructor
        _this = _super.call(this, rootType, options, true) || this;
        // store the min and max lengths
        Object.defineProperty(_this, "_min", { value: min });
        Object.defineProperty(_this, "_max", { value: max });
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(_this);
        }
        return _this;
    }
    // returns true if the property is valid, otherwise false
    StringLengthRule.prototype.isValid = function (obj, prop, val) {
        return !val || val === "" || ((!this._min || val.length >= this._min) && (!this._max || val.length <= this._max));
    };
    // get the string representation of the rule
    StringLengthRule.prototype.toString = function () {
        return this.property.containingType.fullName + "." + this.property.name + " in range, min: , max: ";
    };
    return StringLengthRule;
}(RangeRule));

var StringFormatRule = /** @class */ (function (_super) {
    __extends(StringFormatRule, _super);
    function StringFormatRule(rootType, options, skipRegistration) {
        /// <summary>Creates a rule that validates that a string property value is correctly formatted.</summary>
        /// <param name="rootType" type="Type">The model type the rule is for.</param>
        /// <param name="options" type="Object">
        ///		The options for the rule, including:
        ///			property:			the property being validated (either a Property instance or string property name)
        ///			description:		the human readable description of the format, such as MM/DD/YYY
        ///		    expression:			a regular expression string or RegExp instance that the property value must match
        ///		    reformat:			and optional regular expression reformat string or reformat function that will be used to correct the value if it matches
        ///			name:				the optional unique name of the type of validation rule
        ///			conditionType:		the optional condition type to use, which will be automatically created if not specified
        ///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
        ///			message:			the message to show the user when the validation fails
        /// </param>
        /// <returns type="StringFormatRule">The new string format rule.</returns>
        if (skipRegistration === void 0) { skipRegistration = false; }
        var _this = this;
        // exit immediately if called with no arguments
        if (arguments.length == 0)
            return;
        // ensure the rule name is specified
        options.name = options.name || "StringFormat";
        // ensure the error message is specified
        if (Resource.get(options.message))
            options.message = Resource.get(options.message);
        else
            options.message = options.message || Resource.get("string-format").replace("{formatDescription}", options.description);
        // call the base type constructor
        _this = _super.call(this, rootType, options, true) || this;
        // define properties for the rule
        Object.defineProperty(_this, "description", { value: options.description });
        Object.defineProperty(_this, "expression", { value: options.expression instanceof RegExp ? options.expression : RegExp(options.expression) });
        Object.defineProperty(_this, "reformat", { value: options.reformat });
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(_this);
        }
        return _this;
    }
    // returns true if the property is valid, otherwise false
    StringFormatRule.prototype.isValid = function (obj, prop, val) {
        var isValid = true;
        if (val && val != "") {
            this.expression.lastIndex = 0;
            isValid = this.expression.test(val);
            if (isValid && this.reformat) {
                if (this.reformat instanceof Function) {
                    val = this.reformat(val);
                }
                else {
                    this.expression.lastIndex = 0;
                    val = val.replace(this.expression, this.reformat);
                }
                prop.value(obj, val);
            }
        }
        return isValid;
    };
    // get the string representation of the rule
    StringFormatRule.prototype.toString = function () {
        return this.property.containingType.fullName + "." + this.property.name + " formatted as " + this.description;
    };
    return StringFormatRule;
}(ValidatedPropertyRule));

var ListLengthRule = /** @class */ (function (_super) {
    __extends(ListLengthRule, _super);
    function ListLengthRule(rootType, options, skipRegistration) {
        /// <summary>Creates a rule that validates a list property contains a specific range of items.</summary>
        /// <param name="rootType" type="Type">The model type the rule is for.</param>
        /// <param name="options" type="Object">
        ///		The options for the rule, including:
        ///			property:			the property being validated (either a Property instance or string property name)
        ///			min:				the minimum valid value of the property (or function)
        ///			max:				the maximum valid value of the property (or function)
        ///			name:				the optional unique name of the type of validation rule
        ///			conditionType:		the optional condition type to use, which will be automatically created if not specified
        ///			category:			ConditionType.Error || ConditionType.Warning (defaults to ConditionType.Error)
        ///			message:			the message to show the user when the validation fails
        ///		    onChangeOf:			an array of property paths (strings, Property or PropertyChain instances) that drive when the rule should execute due to property changes
        /// </param>
        /// <returns type="ListLengthRule">The new list length rule.</returns>
        if (skipRegistration === void 0) { skipRegistration = false; }
        var _this = this;
        // ensure the rule name is specified
        options.name = options.name || "ListLength";
        var min = options.min;
        delete options.min;
        var max = options.max;
        delete options.max;
        // call the base type constructor
        _this = _super.call(this, rootType, options, true) || this;
        // store the min and max lengths
        Object.defineProperty(_this, "_min", { value: min });
        Object.defineProperty(_this, "_max", { value: max });
        if (!skipRegistration) {
            // Register the rule after loading has completed
            rootType.model.registerRule(_this);
        }
        return _this;
    }
    // returns true if the property is valid, otherwise false
    ListLengthRule.prototype.isValid = function (obj, prop, val) {
        var range = this.range(obj);
        return val === null || val === undefined || ((!range.min || val.length >= range.min) && (!range.max || val.length <= range.max));
    };
    ListLengthRule.prototype.getMessage = function (obj) {
        var range = this.range(obj);
        // ensure the error message is specified
        var message = (range.min && range.max ? Resource.get("listlength-between").replace("{min}", Property$format(this.property, range.min) || range.min).replace("{max}", Property$format(this.property, range.max) || range.max) :
            range.min ?
                Resource.get("listlength-at-least").replace("{min}", Property$format(this.property, range.min) || range.min) : // at least ordinal
                Resource.get("listlength-at-most").replace("{max}", Property$format(this.property, range.max) || range.max)); // at most ordinal
        return message.replace('{property}', this.property.label);
    };
    return ListLengthRule;
}(RangeRule));

function preparePropertyRuleOptions(property, options, error) {
    options.property = property;
    if (error && error.constructor === String) {
        options.message = error;
    }
    else if (error instanceof exports.ConditionType) {
        options.conditionType = error;
    }
    return options;
}
mixin(Property, {
    calculated: function Property$calculated(options) {
        options.property = this;
        var definedType = options.rootType ? options.rootType.meta : this.containingType;
        delete options.rootType;
        new CalculatedPropertyRule(definedType, options.name, options);
        return this;
    },
    conditionIf: function Property$conditionIf(options, error) {
        var definedType = options.rootType ? options.rootType.meta : this.containingType;
        delete options.rootType;
        options = preparePropertyRuleOptions(this, options, error);
        new ValidatedPropertyRule(definedType, options);
        return this;
    },
    required: function Property$required(error) {
        var options = preparePropertyRuleOptions(this, {}, error);
        new RequiredRule(this.containingType, options);
        return this;
    },
    requiredIf: function Property$requiredIf(options, error) {
        var definedType = options.rootType ? options.rootType.meta : this.containingType;
        delete options.rootType;
        var options = preparePropertyRuleOptions(this, options, error);
        new RequiredIfRule(definedType, options);
        return this;
    },
    allowedValues: function (source, error) {
        var options = preparePropertyRuleOptions(this, { source: source }, error);
        new AllowedValuesRule(this.containingType, options);
        return this;
    },
    optionValues: function (source, error) {
        var options = preparePropertyRuleOptions(this, { source: source, onInit: false, onInitNew: false, onInitExisting: false }, error);
        options.ignoreValidation = true;
        new AllowedValuesRule(this.containingType, options);
        return this;
    },
    range: function (min, max, error) {
        var options = preparePropertyRuleOptions(this, { min: min, max: max }, error);
        new RangeRule(this.containingType, options);
        return this;
    },
    stringLength: function (min, max, error) {
        var options = preparePropertyRuleOptions(this, { min: min, max: max }, error);
        new StringLengthRule(this.containingType, options);
        return this;
    },
    stringFormat: function (description, expression, reformat, error) {
        var options = preparePropertyRuleOptions(this, { description: description, expression: expression, reformat: reformat }, error);
        new StringFormatRule(this.containingType, options);
        return this;
    },
    listLength: function (min, max, error) {
        var options = preparePropertyRuleOptions(this, { min: min, max: max }, error);
        new ListLengthRule(this.containingType, options);
        return this;
    }
});

// Core model

exports.intrinsicJsTypes = intrinsicJsTypes;
exports.Model = Model;
exports.ModelEvents = ModelEvents;
exports.ModelSettings = ModelSettings;
exports.Model$whenTypeAvailable = Model$whenTypeAvailable;
exports.Model$getJsType = Model$getJsType;
exports.Model$getPropertyOrPropertyChain = Model$getPropertyOrPropertyChain;
exports.Type$newIdPrefix = Type$newIdPrefix;
exports.Type = Type;
exports.TypeEvents = TypeEvents;
exports.Type$_generateConstructor = Type$_generateConstructor;
exports.Property = Property;
exports.PropertyEvents = PropertyEvents;
exports.Property$format = Property$format;
exports.Property$_generateShortcuts = Property$_generateShortcuts;
exports.Property$_generateStaticProperty = Property$_generateStaticProperty;
exports.Property$_generatePrototypeProperty = Property$_generatePrototypeProperty;
exports.Property$_generateOwnProperty = Property$_generateOwnProperty;
exports.Property$_generateOwnPropertyWithClosure = Property$_generateOwnPropertyWithClosure;
exports.Property$getRules = Property$getRules;
exports.Property$pendingInit = Property$pendingInit;
exports.Property$addAccessed = Property$addAccessed;
exports.Property$removeAccessed = Property$removeAccessed;
exports.Property$addChanged = Property$addChanged;
exports.Property$removeChanged = Property$removeChanged;
exports.hasPropertyChangedSubscribers = hasPropertyChangedSubscribers;
exports.PropertyChain = PropertyChain;
exports.PropertyChain$create = PropertyChain$create;
exports.PropertyChainEvents = PropertyChainEvents;
exports.PropertyChain$_addAccessedHandler = PropertyChain$_addAccessedHandler;
exports.PropertyChain$_removeAccessedHandler = PropertyChain$_removeAccessedHandler;
exports.PropertyChain$_addChangedHandler = PropertyChain$_addChangedHandler;
exports.PropertyChain$_removeChangedHandler = PropertyChain$_removeChangedHandler;
exports.Entity = Entity;
exports.EntityEvents = EntityEvents;
exports.Entity$toIdString = Entity$toIdString;
exports.Entity$fromIdString = Entity$fromIdString;
exports.ObjectMeta = ObjectMeta;
exports.ObjectMetaEvents = ObjectMetaEvents;
exports.Format = Format;
exports.CustomFormat = CustomFormat;
exports.ModelFormat = ModelFormat;
exports.createFormat = createFormat;
exports.getFormat = getFormat;
exports.PathTokens = PathTokens;
exports.PathTokens$normalizePaths = PathTokens$normalizePaths;
exports.ConditionTarget = ConditionTarget;
exports.ConditionTypeSet = ConditionTypeSet;
exports.ConditionTypeSetEvents = ConditionTypeSetEvents;
exports.ConditionTypeEvents = ConditionTypeEvents;
exports.ErrorConditionType = ErrorConditionType;
exports.WarningConditionType = WarningConditionType;
exports.PermissionConditionType = PermissionConditionType;
exports.Condition = Condition;
exports.FormatError = FormatError;
exports.FormatError$getConditionType = FormatError$getConditionType;
exports.Rule = Rule;
exports.registerPropertyRule = registerPropertyRule;
exports.Rule$ensureConditionType = Rule$ensureConditionType;
exports.ConditionRule = ConditionRule;
exports.ValidatedPropertyRule = ValidatedPropertyRule;
exports.AllowedValuesRule = AllowedValuesRule;
exports.CalculatedPropertyRule = CalculatedPropertyRule;
