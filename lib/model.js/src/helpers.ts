import { Event, EventSubscription } from "./events";
import { FunctorItem, FunctorWith1Arg } from "./functor";

export interface ObjectLiteral {
	[key: string]: ObjectLiteral | any;
}

export interface ObjectLookup<T> {
	[key: string]: T;
}

export function getGlobalObject(): any {
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

export function ensureNamespace(name: string, parentNamespace: string | ObjectLiteral): object {
	var result; var nsTokens; var target: any = parentNamespace;

	if (typeof target === "string") {
		nsTokens = target.split(".");
		target = getGlobalObject();
		nsTokens.forEach(function (token: string) {
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

export function navigateAttribute(obj: any, attr: string, callback: Function, thisPtr: any = null): void {
	for (var val = obj[attr]; val != null; val = val[attr]) {
		if (callback.call(thisPtr || obj, val) === false) {
			return;
		}
	}
}

function isObject(obj: any): boolean {
	return getTypeName(obj) === "object" || (obj && obj instanceof Object);
}

// If a getter method matching the given property name is found on the target it is invoked and returns the 
// value, unless the the value is undefined, in which case null is returned instead.  This is done so that 
// calling code can interpret a return value of undefined to mean that the property it requested does not exist.
function getValue(target: any, property: string): any {
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
		else if (/\./.test(property)) {
			// TODO: Warn about passing multi-hop path to `getValue()`
			// logWarning("Possible incorrect usage of \"getValue()\", the path \"" + property + "\" does not exist on the target and appears to represent a multi-hop path.");
		}
	}

	return value;
}

export function evalPath(obj: any, path: string, nullValue: any = null, undefinedValue: any = undefined): any {
	let value = obj;

	let steps = path.split(".");

	for (let i = 0; i < steps.length; ++i) {
		let name = steps[i];
		let source = value;
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

/**
 * Replace tokens (ex: {0}) in the given string
 * @param template The template string
 * @param params The replacement parameters
 */
export function replaceTokens(template: string, params: ObjectLookup<string>): string {
	if (params) {
		return template.replace(/{([^}]+)}/g, (match: string, key: string): string => {
			return hasOwnProperty(params, key) ? params[key] : match;
		});
	}
	return template;
}

var fnRegex = /function\s*([\w_$]*)/i;

export function parseFunctionName(fn: Function): string {
	var fnMatch = fnRegex.exec(fn.toString());
	return fnMatch ? (fnMatch[1] || "{anonymous}") : "{anonymous}";
}

var typeNameExpr = /\s([a-z|A-Z]+)/;

export function getTypeName(obj: any): string {
	if (obj === undefined) return "undefined";
	if (obj === null) return "null";
	return Object.prototype.toString.call(obj).match(typeNameExpr)[1].toLowerCase();
}

export function getConstructorName(ctor: Function): string {
	// Handle value types explicitly
	if (ctor === String) return "String";
	if (ctor === Number) return "Number";
	if (ctor === Date) return "Date";
	if (ctor === Boolean) return "Boolean";

	// Try to use function name
	if (typeof ctor === "function" && ctor.name) {
		return ctor.name;
	}

	// Fall back to the low-level 'toString' on the prototype
	return getTypeName(ctor.prototype);
}

export function isNumber(obj: any): boolean {
	return getTypeName(obj) === "number" && !isNaN(obj);
}

export function getDefaultValue(isList: boolean, jstype: any): any {
	if (isList) return [];
	if (jstype === Boolean) return false;
	if (jstype === Number) return 0;
	return null;
}

export function isType<T>(obj: any, test: ((o: any) => boolean) = null): obj is T {
	if (test) {
		return test(obj);
	}
	else {
		// Do nothing, assume object is of the type
		return true;
	}
}

export function randomInt(min: number = 0, max: number = 9): number {
	var rand = Math.random();
	return rand === 1 ? max : Math.floor(rand * (max - min + 1)) + min;
}

export function randomText(len: number, includeLetters: boolean = true, includeDigits: boolean = true): string {
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

export function toTitleCase(input: string): string {
	// https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript/6475125#6475125
	var i, j, str, lowers, uppers;

	str = input.replace(/([^\W_]+[^\s-]*) */g, function(txt: string) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});

	// Certain minor words should be left lowercase unless 
	// they are the first or last words in the string
	lowers = ["A", "An", "The", "And", "But", "Or", "For", "Nor", "As", "At",
		"By", "For", "From", "In", "Into", "Near", "Of", "On", "Onto",
		"To", "With"];

	for (i = 0, j = lowers.length; i < j; i++) {
		str = str.replace(new RegExp("\\s" + lowers[i] + "\\s", "g"), function(txt) {
			return txt.toLowerCase();
		});
	}

	// Certain words such as initialisms or acronyms should be left uppercase
	uppers = ["Id", "Tv"];
	for (i = 0, j = uppers.length; i < j; i++) {
		str = str.replace(new RegExp("\\b" + uppers[i] + "\\b", "g"), uppers[i].toUpperCase());
	}

	return str;
}

export function hasOwnProperty(obj: any, prop: string): boolean {
	return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function merge<T>(obj1: T, ...objs: any[]): T {
	let target = {};

	for (let arg in obj1) {
		if (hasOwnProperty(obj1, arg)) {
			(target as any)[arg] = obj1[arg];
		}
	}

	for (let i = 0; i < objs.length; i++) {
		let obj = objs[i];
		for (let arg in obj) {
			if (hasOwnProperty(obj, arg)) {
				(target as any)[arg] = obj[arg];
			}
		}
	}

	return target as T;
}

export function getEventSubscriptions<TypeType, EventArgsType>(event: Event<TypeType, EventArgsType>): EventSubscription<TypeType, EventArgsType>[] {
	let func = (event as any).func as FunctorWith1Arg<EventArgsType, void>;
	if (func) {
		let funcs = (func as any)._funcs as FunctorItem[];
		if (funcs.length > 0) {
			let subs = funcs.map((f) => { return { handler: f.fn, isExecuted: f.applied, isOnce: f.once };});
			return subs as EventSubscription<TypeType, EventArgsType>[];
		}
		else {
			return null;
		}
	}
}

export function mixin<T>(ctor: { new(...args: any[]): T }, methods: { [name: string]: (this: T, ...args: any[]) => any }): void {
	for (var key in methods) {
		if (hasOwnProperty(methods, key) && methods[key] instanceof Function) {
			ctor.prototype[key] = methods[key];
		}
	}
}

/**
 * Recursively clone an object and its children
 * @param value The object to clone
 */
export function clone<T>(obj: T): T {
	var result: any = {};
	for (var prop in obj) {
		if (hasOwnProperty(obj, prop)) {
			let value = obj[prop];
			result[prop] = value instanceof Array ? (value.length === 1 ? [value[0]] : Array.apply(null, value)) : typeof value === "object" ? clone(value) : value;
		}
	}
	return result;
}
