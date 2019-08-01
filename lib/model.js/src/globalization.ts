/*!
 * Based on portions of MicrosoftAjax.debug.js (v3.0.31106.1) from System.Web.Extensions.
 */

import { clone } from "./helpers";

/**
 * Internally used resource strings
 * TODO: Make these localizable resources?
 */
let Res = {
	"format": "One of the identified items was in an invalid format.",
	"formatBadFormatSpecifier": "Format specifier was invalid.",
	"formatInvalidString": "Input string was not in a correct format."
};

/**
 * A class for building a string programmatically
 */
class StringBuilder {
	private _parts: string[];
	private _value: { [separator: string]: string };
	private _len: number;

	constructor(initialText?: string) {
		this._parts = (typeof(initialText) !== "undefined" && initialText !== null && initialText !== "") ? [initialText.toString()] : [];
		this._value = {};
		this._len = 0;
	}

	append(text: string): this {
		this._parts.push(text);
		return this;
	}

	appendLine(text?: string): this {
		this._parts.push(((typeof(text) === "undefined") || (text === null) || (text === "")) ? "\r\n" : (text + "\r\n"));
		return this;
	}

	clear(): void {
		this._parts = [];
		this._value = {};
		this._len = 0;
	}

	isEmpty(): boolean {
		if (this._parts.length === 0) return true;
		return this.toString() === "";
	}

	toString(separator?: string): string {
		separator = separator || "";
		var parts = this._parts;
		if (this._len !== parts.length) {
			this._value = {};
			this._len = parts.length;
		}
		var val = this._value;
		if (typeof(val[separator]) === "undefined") {
			if (separator !== "") {
				for (var i = 0; i < parts.length;) {
					if ((typeof(parts[i]) === "undefined") || (parts[i] === "") || (parts[i] === null)) {
						parts.splice(i, 1);
					}
					else {
						i++;
					}
				}
			}
			val[separator] = this._parts.join(separator);
		}
		return val[separator];
	}
}

// Vendor-specific error extensions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Vendor-specific_extensions
declare interface Error {
	// Microsoft
	description?: string;
	number?: number;
	// Mozilla
	fileName?: string;
	lineNumber?: number;
	columnNumber?: number;
	stack?: string;
}

/**
 * Subclass of error for invalid format strings
 */
class FormatError extends Error {
	constructor(message: string) {
		var displayMessage = "Sys.FormatException: " + (message || Res.format);
		super(displayMessage);
		this.name = "Sys.FormatException";
	}
}

function date$appendPreOrPostMatch(preMatch: string, strBuilder: StringBuilder) {
	var quoteCount = 0;
	var escaped = false;
	for (var i = 0, il = preMatch.length; i < il; i++) {
		var c = preMatch.charAt(i);
		switch (c) {
			case "'":
				if (escaped) strBuilder.append("'");
				else quoteCount++;
				escaped = false;
				break;
			case "\\":
				if (escaped) strBuilder.append("\\");
				escaped = !escaped;
				break;
			default:
				strBuilder.append(c);
				escaped = false;
				break;
		}
	}
	return quoteCount;
}

export function expandDateFormat(dtf: DateTimeFormatInfo, format: string): string {
	if (!format) {
		format = "F";
	}
	var len = format.length;
	if (len === 1) {
		switch (format) {
			case "d":
				return dtf["ShortDatePattern"];
			case "D":
				return dtf["LongDatePattern"];
			case "t":
				return dtf["ShortTimePattern"];
			case "T":
				return dtf["LongTimePattern"];
			case "f":
				return dtf["LongDatePattern"] + " " + dtf["ShortTimePattern"];
			case "F":
				return dtf["FullDateTimePattern"];
			case "g":
				return dtf["ShortDatePattern"] + " " + dtf["ShortTimePattern"];
			case "G":
				return dtf["ShortDatePattern"] + " " + dtf["LongTimePattern"];
			case "M": case "m":
				return dtf["MonthDayPattern"];
			case "s":
				return dtf["SortableDateTimePattern"];
			
			case "Y": case "y":
				return dtf["YearMonthPattern"];
			default:
				throw new FormatError(Res.formatInvalidString);
		}
	}
	else if ((len === 2) && (format.charAt(0) === "%")) {
		format = format.charAt(1);
	}
	return format;
}

function expandYear(dtf: DateTimeFormatInfo, year: number): number {
	var now = new Date();
	var era = getEra(now);
	if (year < 100) {
		var curr = getEraYear(now, dtf, era);
		year += curr - (curr % 100);
		if (year > dtf.Calendar.TwoDigitYearMax) {
			year -= 100;
		}
	}
	return year;
}

function getEra(date: Date, eras?: any[]): number {
	if (!eras) return 0;
	var start; var ticks = date.getTime();
	for (var i = 0, l = eras.length; i < l; i += 4) {
		start = eras[i + 2];
		if ((start === null) || (ticks >= start)) {
			return i;
		}
	}
	return 0;
}

function getEraYear(date: Date, dtf: DateTimeFormatInfo, era: number, sortable?: boolean): number {
	var year = date.getFullYear();
	if (!sortable && dtf.Eras) {
		year -= dtf.Eras[era + 3];
	}
	return year;
}

function getDateParseRegExp(dtf: DateTimeFormatInfo, format: string): { regExp: string, groups: string[] } {
	// Get or initialize the regex cache
	let cache: { [format: string]: { regExp: string, groups: string[] } };
	if (!(cache = (dtf as any)._parseRegExp)) {
		cache = (dtf as any)._parseRegExp = {};
	}

	// Return a cached format if available
	if (cache[format]) {
		return cache[format];
	}

	var expFormat = expandDateFormat(dtf, format);

	// eslint-disable-next-line no-useless-escape
	expFormat = expFormat.replace(/([\^\$\.\*\+\?\|\[\]\(\)\{\}])/g, "\\\\$1");

	var regexp = new StringBuilder("^");
	var groups = [];
	var index = 0;
	var quoteCount = 0;
	var tokenRegExp = getDateTokenRegExp();
	var match;

	while ((match = tokenRegExp.exec(expFormat)) !== null) {
		var preMatch = expFormat.slice(index, match.index);
		index = tokenRegExp.lastIndex;

		quoteCount += date$appendPreOrPostMatch(preMatch, regexp);
		if ((quoteCount%2) === 1) {
			regexp.append(match[0]);
			continue;
		}

		switch (match[0]) {
			case "dddd": case "ddd":
			case "MMMM": case "MMM":
			case "gg": case "g":
				regexp.append("(\\D+)");
				break;
			case "tt": case "t":
				regexp.append("(\\D*)");
				break;
			case "yyyy":
				regexp.append("(\\d{4})");
				break;
			case "fff":
				regexp.append("(\\d{3})");
				break;
			case "ff":
				regexp.append("(\\d{2})");
				break;
			case "f":
				regexp.append("(\\d)");
				break;
			case "dd": case "d":
			case "MM": case "M":
			case "yy": case "y":
			case "HH": case "H":
			case "hh": case "h":
			case "mm": case "m":
			case "ss": case "s":
				regexp.append("(\\d\\d?)");
				break;
			case "zzz":
				regexp.append("([+-]?\\d\\d?:\\d{2})");
				break;
			case "zz": case "z":
				regexp.append("([+-]?\\d\\d?)");
				break;
			case "/":
				regexp.append("(\\" + dtf.DateSeparator + ")");
				break;
		}
		groups.push(match[0]);
	}
	date$appendPreOrPostMatch(expFormat.slice(index), regexp);
	regexp.append("$");
	var regexpStr = regexp.toString().replace(/\s+/g, "\\s+");
	var parseRegExp = { regExp: regexpStr, groups: groups };
	cache[format] = parseRegExp;
	return parseRegExp;
};

function getDateTokenRegExp() {
	return /\/|dddd|ddd|dd|d|MMMM|MMM|MM|M|yyyy|yy|y|hh|h|HH|H|mm|m|ss|s|tt|t|fff|ff|f|zzz|zz|z|gg|g/g;
}

/**
 * Parses the given text as a date
 * @param value The text to parse
 * @param cultureInfo The culture
 * @param formats An optional list of formats to use
 */
export function parseDate(value: string, cultureInfo: CultureInfo, formats?: string[]): Date {
	let formatsSpecified = false;

	// Try to parse using format strings if specified
	if (formats) {
		for (let i = 0; i < formats.length; i++) {
			let format = formats[i];
			if (format) {
				formatsSpecified = true;
				let date = parseDateExact(value, format, cultureInfo);
				if (date)
					return date;
			}
		}
	}

	// Use the culture's date/time formats if formats were not specified
	if (!formatsSpecified) {
		formats = cultureInfo._getDateTimeFormats();
		for (let i = 0; i < formats.length; i++) {
			let date = parseDateExact(value, formats[i], cultureInfo);
			if (date) return date;
		}
	}

	return null;
}

function parseDateExact(value: string, format: string, cultureInfo: CultureInfo): Date {
	value = value.trim();
	var dtf = cultureInfo.dateTimeFormat;
	var parseInfo = getDateParseRegExp(dtf, format);
	var match = new RegExp(parseInfo.regExp).exec(value);
	if (match === null) return null;
	var groups = parseInfo.groups;
	var era = null; var year = null; var month = null; var date = null; var weekDay = null;
	var hour = 0; var hourOffset; var min = 0; var sec = 0; var msec = 0; var tzMinOffset = null;
	var pmHour = false;
	for (var j = 0, jl = groups.length; j < jl; j++) {
		var matchGroup = match[j+1];
		if (matchGroup) {
			switch (groups[j]) {
				case "dd": case "d":
					date = parseInt(matchGroup, 10);
					if ((date < 1) || (date > 31)) return null;
					break;
				case "MMMM":
					month = cultureInfo._getMonthIndex(matchGroup);
					if ((month < 0) || (month > 11)) return null;
					break;
				case "MMM":
					month = cultureInfo._getMonthIndex(matchGroup, true);
					if ((month < 0) || (month > 11)) return null;
					break;
				case "M": case "MM":
					month = parseInt(matchGroup, 10) - 1;
					if ((month < 0) || (month > 11)) return null;
					break;
				case "y": case "yy":
					year = expandYear(dtf, parseInt(matchGroup, 10));
					if ((year < 0) || (year > 9999)) return null;
					break;
				case "yyyy":
					year = parseInt(matchGroup, 10);
					if ((year < 0) || (year > 9999)) return null;
					break;
				case "h": case "hh":
					hour = parseInt(matchGroup, 10);
					if (hour === 12) hour = 0;
					if ((hour < 0) || (hour > 11)) return null;
					break;
				case "H": case "HH":
					hour = parseInt(matchGroup, 10);
					if ((hour < 0) || (hour > 23)) return null;
					break;
				case "m": case "mm":
					min = parseInt(matchGroup, 10);
					if ((min < 0) || (min > 59)) return null;
					break;
				case "s": case "ss":
					sec = parseInt(matchGroup, 10);
					if ((sec < 0) || (sec > 59)) return null;
					break;
				case "tt": case "t":
					var upperToken = matchGroup.toUpperCase();
					pmHour = (upperToken === dtf.PMDesignator.toUpperCase());
					if (!pmHour && (upperToken !== dtf.AMDesignator.toUpperCase())) return null;
					break;
				case "f":
					msec = parseInt(matchGroup, 10) * 100;
					if ((msec < 0) || (msec > 999)) return null;
					break;
				case "ff":
					msec = parseInt(matchGroup, 10) * 10;
					if ((msec < 0) || (msec > 999)) return null;
					break;
				case "fff":
					msec = parseInt(matchGroup, 10);
					if ((msec < 0) || (msec > 999)) return null;
					break;
				case "dddd":
					weekDay = cultureInfo._getDayIndex(matchGroup);
					if ((weekDay < 0) || (weekDay > 6)) return null;
					break;
				case "ddd":
					weekDay = cultureInfo._getDayIndex(matchGroup, true);
					if ((weekDay < 0) || (weekDay > 6)) return null;
					break;
				case "zzz":
					var offsets = matchGroup.split(/:/);
					if (offsets.length !== 2) return null;
					hourOffset = parseInt(offsets[0], 10);
					if ((hourOffset < -12) || (hourOffset > 13)) return null;
					var minOffset = parseInt(offsets[1], 10);
					if ((minOffset < 0) || (minOffset > 59)) return null;
					tzMinOffset = (hourOffset * 60) + (matchGroup.startsWith("-")? -minOffset : minOffset);
					break;
				case "z": case "zz":
					hourOffset = parseInt(matchGroup, 10);
					if ((hourOffset < -12) || (hourOffset > 13)) return null;
					tzMinOffset = hourOffset * 60;
					break;
				case "g": case "gg":
					var eraName = matchGroup;
					if (!eraName || !dtf.Eras) return null;
					eraName = eraName.toLowerCase().trim();
					for (var i = 0, l = dtf.Eras.length; i < l; i += 4) {
						if (eraName === dtf.Eras[i + 1].toLowerCase()) {
							era = i;
							break;
						}
					}
					if (era === null) return null;
					break;
			}
		}
	}
	var result = new Date();
	var defaultYear;
	var convert = dtf.Calendar.convert;
	// If none are specified, set to todays date to 1/1/1970
	if (year == null && month == null && date == null) {
		year = 1970;
		month = 0;
		date = 1;
	}
	else {
		if (convert) {
			defaultYear = convert.fromGregorian(result)[0];
		}
		else {
			defaultYear = result.getFullYear();
		}
		if (year === null) {
			year = defaultYear;
		}
		else if (dtf.Eras) {
			year += dtf.Eras[(era || 0) + 3];
		}
		if (month === null) {
			month = 0;
		}
		if (date === null) {
			date = 1;
		}
	}
	if (convert) {
		result = convert.toGregorian(year, month, date);
		if (result === null) return null;
	}
	else {
		result.setFullYear(year, month, date);
		if (result.getDate() !== date) return null;
		if ((weekDay !== null) && (result.getDay() !== weekDay)) {
			return null;
		}
	}
	if (pmHour && (hour < 12)) {
		hour += 12;
	}
	result.setHours(hour, min, sec, msec);
	if (tzMinOffset !== null) {
		var adjustedMin = result.getMinutes() - (tzMinOffset + result.getTimezoneOffset());
		result.setHours(result.getHours() + parseInt((adjustedMin/60).toString(), 10), adjustedMin%60);
	}
	return result;
}

function addLeadingZero(num: number): string {
	if (num < 10) {
		return "0" + num;
	}
	return num.toString();
}

function addLeadingZeros(num: number): string {
	if (num < 10) {
		return "00" + num;
	}
	if (num < 100) {
		return "0" + num;
	}
	return num.toString();
}

function padYear(year: number): string {
	if (year < 10) {
		return "000" + year;
	}
	else if (year < 100) {
		return "00" + year;
	}
	else if (year < 1000) {
		return "0" + year;
	}
	return year.toString();
}

/**
 * Formats a date as text using the given format string and culture
 * @param date The date to format
 * @param format The format specifier
 * @param cultureInfo The culture
 */
export function formatDate(date: Date, format: string, cultureInfo: CultureInfo): string {
	var dtf = cultureInfo.dateTimeFormat;
	var convert = dtf.Calendar.convert;
	if (!format || !format.length || (format === "i")) {
		if (cultureInfo && cultureInfo.name.length) {
			if (convert) {
				return formatDate(date, dtf.FullDateTimePattern, cultureInfo);
			}
			else {
				var eraDate = new Date(date.getTime());
				var era = getEra(date, dtf.Eras);
				eraDate.setFullYear(getEraYear(date, dtf, era));
				return eraDate.toLocaleString();
			}
		}
		else {
			return date.toString();
		}
	}

	var eras = dtf.Eras;
	var sortable = (format === "s");
	format = expandDateFormat(dtf, format);

	var ret = new StringBuilder();
	var hour;

	var foundDay: boolean;
	var checkedDay: boolean;
	var dayPartRegExp = /([^d]|^)(d|dd)([^d]|$)/g;
	var hasDay = function hasDay(): boolean {
		if (foundDay || checkedDay) {
			return foundDay;
		}
		foundDay = dayPartRegExp.test(format);
		checkedDay = true;
		return foundDay;
	};
	var quoteCount = 0;
	var tokenRegExp = getDateTokenRegExp();
	var converted: number[];
	if (!sortable && convert) {
		converted = convert.fromGregorian(date);
	}
	for (;;) {
		var index = tokenRegExp.lastIndex;

		var ar = tokenRegExp.exec(format);

		var preMatch = format.slice(index, ar ? ar.index : format.length);
		quoteCount += date$appendPreOrPostMatch(preMatch, ret);

		if (!ar) break;

		if ((quoteCount%2) === 1) {
			ret.append(ar[0]);
			continue;
		}
		var getDatePart = function getDatePart(date: Date, part: number): number {
			if (converted) {
				return converted[part];
			}
			switch (part) {
				case 0: return date.getFullYear();
				case 1: return date.getMonth();
				case 2: return date.getDate();
			}
		};

		switch (ar[0]) {
			case "dddd":
				ret.append(dtf.DayNames[date.getDay()]);
				break;
			case "ddd":
				ret.append(dtf.AbbreviatedDayNames[date.getDay()]);
				break;
			case "dd":
				foundDay = true;
				ret.append(addLeadingZero(getDatePart(date, 2)));
				break;
			case "d":
				foundDay = true;
				ret.append(getDatePart(date, 2).toString());
				break;
			case "MMMM":
				ret.append((dtf.MonthGenitiveNames && hasDay())
					? dtf.MonthGenitiveNames[getDatePart(date, 1)]
					: dtf.MonthNames[getDatePart(date, 1)]);
				break;
			case "MMM":
				ret.append((dtf.AbbreviatedMonthGenitiveNames && hasDay())
					? dtf.AbbreviatedMonthGenitiveNames[getDatePart(date, 1)]
					: dtf.AbbreviatedMonthNames[getDatePart(date, 1)]);
				break;
			case "MM":
				ret.append(addLeadingZero(getDatePart(date, 1) + 1));
				break;
			case "M":
				ret.append((getDatePart(date, 1) + 1).toString());
				break;
			case "yyyy":
				ret.append(padYear(converted ? converted[0] : getEraYear(date, dtf, getEra(date, eras), sortable)));
				break;
			case "yy":
				ret.append(addLeadingZero((converted ? converted[0] : getEraYear(date, dtf, getEra(date, eras), sortable)) % 100));
				break;
			case "y":
				ret.append(((converted ? converted[0] : getEraYear(date, dtf, getEra(date, eras), sortable)) % 100).toString());
				break;
			case "hh":
				hour = date.getHours() % 12;
				if (hour === 0) hour = 12;
				ret.append(addLeadingZero(hour));
				break;
			case "h":
				hour = date.getHours() % 12;
				if (hour === 0) hour = 12;
				ret.append(hour.toString());
				break;
			case "HH":
				ret.append(addLeadingZero(date.getHours()));
				break;
			case "H":
				ret.append(date.getHours().toString());
				break;
			case "mm":
				ret.append(addLeadingZero(date.getMinutes()));
				break;
			case "m":
				ret.append(date.getMinutes().toString());
				break;
			case "ss":
				ret.append(addLeadingZero(date.getSeconds()));
				break;
			case "s":
				ret.append(date.getSeconds().toString());
				break;
			case "tt":
				ret.append((date.getHours() < 12) ? dtf.AMDesignator : dtf.PMDesignator);
				break;
			case "t":
				ret.append(((date.getHours() < 12) ? dtf.AMDesignator : dtf.PMDesignator).charAt(0));
				break;
			case "f":
				ret.append(addLeadingZeros(date.getMilliseconds()).charAt(0));
				break;
			case "ff":
				ret.append(addLeadingZeros(date.getMilliseconds()).substr(0, 2));
				break;
			case "fff":
				ret.append(addLeadingZeros(date.getMilliseconds()));
				break;
			case "z":
				hour = date.getTimezoneOffset() / 60;
				ret.append(((hour <= 0) ? "+" : "-") + Math.floor(Math.abs(hour)));
				break;
			case "zz":
				hour = date.getTimezoneOffset() / 60;
				ret.append(((hour <= 0) ? "+" : "-") + addLeadingZero(Math.floor(Math.abs(hour))));
				break;
			case "zzz":
				hour = date.getTimezoneOffset() / 60;
				ret.append(((hour <= 0) ? "+" : "-") + addLeadingZero(Math.floor(Math.abs(hour))) +
				":" + addLeadingZero(Math.abs(date.getTimezoneOffset() % 60)));
				break;
			case "g":
			case "gg":
				if (dtf.Eras) {
					ret.append(dtf.Eras[getEra(date, eras) + 1]);
				}
				break;
			case "/":
				ret.append(dtf.DateSeparator);
				break;
		}
	}
	return ret.toString();
}

export function getNumberStyle(format: string): string {
	format = format || "";

	if (format.match(/[$c]+/i))
		return "Currency";

	if (format.match(/[%p]+/i))
		return "Percent";

	if (format.match(/[dnfg]0/i))
		return "Integer";

	return "Number";	
}

export function parseNumber(value: string, style: string = "Number" || "Integer" || "Currency" || "Percent", cultureInfo: CultureInfo) : number {
	// Handle use of () to denote negative numbers
	var sign = 1;
	if (value.match(/^\(.*\)$/)) {
		value = value.substring(1, value.length - 1);
		sign = -1;
	}

	var result;

	// Remove currency symbols before parsing
	if (style === "Currency") {
		result = _parseNumber(value.replace(cultureInfo.numberFormat.CurrencySymbol, ""), cultureInfo) * sign;

		// if there is a decimal place, check the precision isnt greater than allowed for currency. 
		// Floating points in js can be skewed under certain circumstances, we are just checking the decimals instead of multiplying results.
		var resultvalue = result.toString();
		if (resultvalue.indexOf('.') > -1 && (resultvalue.length - (resultvalue.indexOf('.') + 1)) > cultureInfo.numberFormat.CurrencyDecimalDigits	) {
			result = NaN;
		}
	}
	// Remove percentage symbols before parsing and divide by 100
	else if (style === "Percent")
		result = _parseNumber(value.replace(cultureInfo.numberFormat.PercentSymbol, ""), cultureInfo) / 100 * sign;

	// Ensure integers are actual whole numbers
	else if (style === "Integer" && !isInteger(_parseNumber(value, cultureInfo)))
		result = NaN;

	// Just parse a simple number
	else
		result = _parseNumber(value, cultureInfo) * sign;
	
	return result;
}

function isInteger(obj) {
	return typeof (obj) === "number" && !isNaN(obj) && /^-?[0-9]{1,10}$/.test(obj.toString()) && (obj >= -2147483648 && obj <= 2147483647);
}

/**
 * Parses the given text as a number
 * @param value The text to parse
 * @param cultureInfo The culture
 */
export function _parseNumber(value: string, cultureInfo: CultureInfo): number {	
	value = value.trim();
	if (value.match(/^[+-]?infinity$/i)) {
		return parseFloat(value);
	}
	if (value.match(/^0x[a-f0-9]+$/i)) {
		return parseInt(value);
	}

	var numFormat = cultureInfo.numberFormat;
	var signInfo = parseNumberNegativePattern(value, numFormat, numFormat.NumberNegativePattern);
	var sign = signInfo[0];
	var num = signInfo[1];
	if ((sign === '') && (numFormat.NumberNegativePattern !== 1)) {
		signInfo = parseNumberNegativePattern(value, numFormat, 1);
		sign = signInfo[0];
		num = signInfo[1];
	}
	if (sign === '') sign = '+';
	var exponent;
	var intAndFraction;
	var exponentPos = num.indexOf('e');
	if (exponentPos < 0) exponentPos = num.indexOf('E');
	if (exponentPos < 0) {
		intAndFraction = num;
		exponent = null;
	}
	else {
		intAndFraction = num.substr(0, exponentPos);
		exponent = num.substr(exponentPos + 1);
	}
	var integer;
	var fraction;
	var decimalPos = intAndFraction.indexOf(numFormat.NumberDecimalSeparator);
	if (decimalPos < 0) {
		integer = intAndFraction;
		fraction = null;
	}
	else {
		integer = intAndFraction.substr(0, decimalPos);
		fraction = intAndFraction.substr(decimalPos + numFormat.NumberDecimalSeparator.length);
	}
	integer = integer.split(numFormat.NumberGroupSeparator).join('');
	var altNumGroupSeparator = numFormat.NumberGroupSeparator.replace(/\u00A0/g, " ");
	if (numFormat.NumberGroupSeparator !== altNumGroupSeparator) {
		integer = integer.split(altNumGroupSeparator).join('');
	}
	var p = sign + integer;
	if (fraction !== null) {
		p += '.' + fraction;
	}
	if (exponent !== null) {
		var expSignInfo = parseNumberNegativePattern(exponent, numFormat, 1);
		if (expSignInfo[0] === '') {
			expSignInfo[0] = '+';
		}
		p += 'e' + expSignInfo[0] + expSignInfo[1];
	}

	if (p.match(/^[+-]?\d*\.?\d*(e[+-]?\d+)?$/)) {
		return parseFloat(p);
	}
	return Number.NaN;
};

function parseNumberNegativePattern(value: string, numberFormatInfo: NumberFormatInfo, numberNegativePattern: number) {
	var neg = numberFormatInfo.NegativeSign;
	var pos = numberFormatInfo.PositiveSign;
	switch (numberNegativePattern) {
		case 4:
			neg = " " + neg;
			pos = " " + pos;
		// eslint-disable-next-line no-fallthrough
		case 3:
			if (value.endsWith(neg)) {
				return ["-", value.substr(0, value.length - neg.length)];
			}
			else if (value.endsWith(pos)) {
				return ["+", value.substr(0, value.length - pos.length)];
			}
			break;
		case 2:
			neg += " ";
			pos += " ";
		// eslint-disable-next-line no-fallthrough
		case 1:
			if (value.startsWith(neg)) {
				return ["-", value.substr(neg.length)];
			}
			else if (value.startsWith(pos)) {
				return ["+", value.substr(pos.length)];
			}
			break;
		case 0:
			if (value.startsWith("(") && value.endsWith(")")) {
				return ["-", value.substr(1, value.length - 2)];
			}
			break;
	}
	return ["", value];
};

function zeroPad(str: string, count: number, left?: boolean): string {
	for (var l = str.length; l < count; l++) {
		str = (left ? ("0" + str) : (str + "0"));
	}
	return str;
}

function expandNumber(number: number, precision: number, groupSizes: number[], sep: string, decimalChar: string): string {
	var curSize = groupSizes[0];
	var curGroupIndex = 1;

	var factor = Math.pow(10, precision);
	var rounded = (Math.round(number * factor) / factor);
	if (!isFinite(rounded)) {
		rounded = number;
	}
	number = rounded;
	var numberString = number.toString();
	var right = "";
	var exponent;
	var split = numberString.split(/e/i);
	numberString = split[0];
	exponent = (split.length > 1 ? parseInt(split[1]) : 0);
	split = numberString.split(".");
	numberString = split[0];
	right = split.length > 1 ? split[1] : "";
	if (exponent > 0) {
		right = zeroPad(right, exponent, false);
		numberString += right.slice(0, exponent);
		right = right.substr(exponent);
	}
	else if (exponent < 0) {
		exponent = -exponent;
		numberString = zeroPad(numberString, exponent+1, true);
		right = numberString.slice(-exponent, numberString.length) + right;
		numberString = numberString.slice(0, -exponent);
	}

	if (precision > 0) {
		if (right.length > precision) {
			right = right.slice(0, precision);
		}
		else {
			right = zeroPad(right, precision, false);
		}
		right = decimalChar + right;
	}
	else {
		right = "";
	}

	var stringIndex = numberString.length-1;
	var ret = "";
	while (stringIndex >= 0) {
		if (curSize === 0 || curSize > stringIndex) {
			if (ret.length > 0)
				return numberString.slice(0, stringIndex + 1) + sep + ret + right;
			else
				return numberString.slice(0, stringIndex + 1) + right;
		}

		if (ret.length > 0)
			ret = numberString.slice(stringIndex - curSize + 1, stringIndex+1) + sep + ret;
		else
			ret = numberString.slice(stringIndex - curSize + 1, stringIndex+1);

		stringIndex -= curSize;

		if (curGroupIndex < groupSizes.length) {
			curSize = groupSizes[curGroupIndex];
			curGroupIndex++;
		}
	}
	return numberString.slice(0, stringIndex + 1) + sep + ret + right;
}

/**
 * Formats a number as text using the given format string and culture
 * @param number The number to format
 * @param format The format specifier
 * @param cultureInfo The culture
 */
export function formatNumber(number: number, format: string, cultureInfo: CultureInfo): string {
	if (!format || (format.length === 0) || (format === "i")) {
		if (cultureInfo && (cultureInfo.name.length > 0)) {
			return number.toLocaleString();
		}
		else {
			return number.toString();
		}
	}
	var _percentPositivePattern = ["n %", "n%", "%n" ];
	var _percentNegativePattern = ["-n %", "-n%", "-%n"];
	var _numberNegativePattern = ["(n)", "-n", "- n", "n-", "n -"];
	var _currencyPositivePattern = ["$n", "n$", "$ n", "n $"];
	var _currencyNegativePattern = ["($n)", "-$n", "$-n", "$n-", "(n$)", "-n$", "n-$", "n$-", "-n $", "-$ n", "n $-", "$ n-", "$ -n", "n- $", "($ n)", "(n $)"];

	var nf = cultureInfo.numberFormat;

	let num: number | string = Math.abs(number);

	if (!format)
		format = "D";

	var precision = -1;
	if (format.length > 1) precision = parseInt(format.slice(1), 10);

	var pattern;
	switch (format.charAt(0)) {
		case "d":
		case "D":
			pattern = "n";

			if (precision !== -1) {
				num = zeroPad(""+num, precision, true);
			}

			if (number < 0) num = -num;
			break;
		case "c":
		case "C":
			if (number < 0) pattern = _currencyNegativePattern[nf.CurrencyNegativePattern];
			else pattern = _currencyPositivePattern[nf.CurrencyPositivePattern];
			if (precision === -1) precision = nf.CurrencyDecimalDigits;
			num = expandNumber(Math.abs(number), precision, nf.CurrencyGroupSizes, nf.CurrencyGroupSeparator, nf.CurrencyDecimalSeparator);
			break;
		case "n":
		case "N":
			if (number < 0) pattern = _numberNegativePattern[nf.NumberNegativePattern];
			else pattern = "n";
			if (precision === -1) precision = nf.NumberDecimalDigits;
			num = expandNumber(Math.abs(number), precision, nf.NumberGroupSizes, nf.NumberGroupSeparator, nf.NumberDecimalSeparator);
			break;
		case "p":
		case "P":
			if (number < 0) pattern = _percentNegativePattern[nf.PercentNegativePattern];
			else pattern = _percentPositivePattern[nf.PercentPositivePattern];
			if (precision === -1) precision = nf.PercentDecimalDigits;
			num = expandNumber(Math.abs(number) * 100, precision, nf.PercentGroupSizes, nf.PercentGroupSeparator, nf.PercentDecimalSeparator);
			break;
		default:
			throw new FormatError(Res.formatBadFormatSpecifier);
	}

	var regex = /n|\$|-|%/g;

	var ret = "";

	for (;;) {
		var index = regex.lastIndex;

		var ar = regex.exec(pattern);

		ret += pattern.slice(index, ar ? ar.index : pattern.length);

		if (!ar)
			break;

		switch (ar[0]) {
			case "n":
				ret += num;
				break;
			case "$":
				ret += nf.CurrencySymbol;
				break;
			case "-":
				if (/[1-9]/.test(num.toString())) {
					ret += nf.NegativeSign;
				}
				break;
			case "%":
				ret += nf.PercentSymbol;
				break;
		}
	}

	return ret;
}

function toUpper(value: string) {
	return value.split("\u00A0").join(" ").toUpperCase();
}

function toUpperArray(arr: string[]): string[] {
	var result = [];
	for (let i = 0; i < arr.length; i++) {
		let value = arr[i];
		result[i] = toUpper(value);
	}
	return result;
}

const invariantCultureInfo = {
	name: "",
	numberFormat: {
		CurrencyDecimalDigits: 2,
		CurrencyDecimalSeparator: ".",
		CurrencyGroupSizes: [3],
		NumberGroupSizes: [3],
		PercentGroupSizes: [3],
		CurrencyGroupSeparator: ",",
		CurrencySymbol: "\u00A4",
		NaNSymbol: "NaN",
		CurrencyNegativePattern: 0,
		NumberNegativePattern: 1,
		PercentPositivePattern: 0,
		PercentNegativePattern: 0,
		NegativeInfinitySymbol: "-Infinity",
		NegativeSign: "-",
		NumberDecimalDigits: 2,
		NumberDecimalSeparator: ".",
		NumberGroupSeparator: ",",
		CurrencyPositivePattern: 0,
		PositiveInfinitySymbol: "Infinity",
		PositiveSign: "+",
		PercentDecimalDigits: 2,
		PercentDecimalSeparator: ".",
		PercentGroupSeparator: ",",
		PercentSymbol: "%",
		PerMilleSymbol: "\u2030",
		NativeDigits: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
		DigitSubstitution: 1
	},
	dateTimeFormat: {
		AMDesignator: "AM",
		Calendar: { MinSupportedDateTime: "@-62135568000000@", MaxSupportedDateTime: "@253402300799999@", AlgorithmType: 1, CalendarType: 1, Eras: [1], TwoDigitYearMax: 2029 },
		DateSeparator: "/",
		FirstDayOfWeek: 0,
		CalendarWeekRule: 0,
		FullDateTimePattern: "dddd, dd MMMM yyyy HH:mm:ss",
		LongDatePattern: "dddd, dd MMMM yyyy",
		LongTimePattern: "HH:mm:ss",
		MonthDayPattern: "MMMM dd",
		PMDesignator: "PM",
		RFC1123Pattern: "ddd, dd MMM yyyy HH':'mm':'ss 'GMT'",
		ShortDatePattern: "MM/dd/yyyy",
		ShortTimePattern: "h:mm tt",
		SortableDateTimePattern: "yyyy'-'MM'-'dd'T'HH':'mm':'ss",
		TimeSeparator: ":",
		UniversalSortableDateTimePattern: "yyyy'-'MM'-'dd HH':'mm':'ss'Z'",
		YearMonthPattern: "yyyy MMMM",
		AbbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
		ShortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
		DayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
		AbbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", ""],
		MonthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", ""],
		NativeCalendarName: "Gregorian Calendar",
		AbbreviatedMonthGenitiveNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", ""],
		MonthGenitiveNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", ""]
	},
	eras: [1, "A.D.", null, 0]
};	

export class CultureInfo {
	name: string;
	numberFormat: NumberFormatInfo;
	dateTimeFormat: DateTimeFormatInfo;

	private static _defaultCulture: CultureInfo;

	private _dateTimeFormats: string[];

	private _upperMonths: string[];
	private _upperAbbrMonths: string[];
	private _upperMonthsGenitive: string[];
	private _upperAbbrMonthsGenitive: string[];
	private _upperDays: string[];
	private _upperAbbrDays: string[];

	constructor(name: string, numberFormat: NumberFormatInfo, dateTimeFormat: DateTimeFormatInfo) {
		this.name = name;
		this.numberFormat = numberFormat;
		this.dateTimeFormat = dateTimeFormat;
	}

	static CurrentCulture: CultureInfo;
	static InvariantCulture: CultureInfo;

	static parse(value: any) {
		var dtf = value.dateTimeFormat;
		if (dtf && !dtf.Eras) {
			dtf.Eras = value.eras;
		}
		return new CultureInfo(value.name, value.numberFormat, dtf);
	}

	static setup(cultureInfo: object = null): void {
		if (cultureInfo != null && typeof cultureInfo === "object") {
			CultureInfo.CurrentCulture = CultureInfo.parse(cultureInfo);
		}
		else if (!CultureInfo.CurrentCulture) {
			// Set up default culture
			let defaultCulture = CultureInfo._defaultCulture;
			if (!CultureInfo._defaultCulture) {
				let cultureInfoObject = clone(invariantCultureInfo);
				cultureInfoObject.name = "en-US";
				cultureInfoObject.numberFormat.CurrencySymbol = "$";
				var dtf = cultureInfoObject.dateTimeFormat;
				dtf.FullDateTimePattern = "dddd, MMMM dd, yyyy h:mm:ss tt";
				dtf.LongDatePattern = "dddd, MMMM dd, yyyy";
				dtf.LongTimePattern = "h:mm:ss tt";
				dtf.ShortDatePattern = "M/d/yyyy";
				dtf.ShortTimePattern = "h:mm tt";
				dtf.YearMonthPattern = "MMMM, yyyy";
				defaultCulture = CultureInfo.parse(cultureInfoObject);
				CultureInfo._defaultCulture = defaultCulture;
			}
			CultureInfo.CurrentCulture = defaultCulture;
		}
	}

	_getDateTimeFormats() {
		var formats = this._dateTimeFormats;
		if (!formats) {
			var dtf = this.dateTimeFormat;
			this._dateTimeFormats = formats = [
				dtf["MonthDayPattern"],
				dtf["YearMonthPattern"],
				dtf["ShortDatePattern"],
				dtf["ShortTimePattern"],
				dtf["LongDatePattern"],
				dtf["LongTimePattern"],
				dtf["FullDateTimePattern"],
				dtf["RFC1123Pattern"],
				dtf["SortableDateTimePattern"],
				dtf["UniversalSortableDateTimePattern"]
			];
		}
		return formats;
	}

	_getMonthIndex(value: string, abbr?: boolean) {
		// Get or create the cache of upper-case month names
		let upperMonths: string[] = abbr ? this._upperAbbrMonths : this._upperMonths; 
		if (!upperMonths) {
			if (abbr)
				upperMonths = this._upperAbbrMonths = toUpperArray(this.dateTimeFormat.AbbreviatedMonthNames);
			else
				upperMonths = this._upperMonths = toUpperArray(this.dateTimeFormat.MonthNames);
		}
		// Convert the month name to upper-case and get its index in the list
		value = toUpper(value);
		var i = upperMonths.indexOf(value);
		if (i < 0) {
			// Get or create the cache of upper-case genitive month names
			let upperMonthsGenitive: string[] = abbr ? this._upperAbbrMonthsGenitive : this._upperMonthsGenitive; 
			if (!upperMonthsGenitive) {
				if (abbr)
					upperMonthsGenitive = this._upperAbbrMonthsGenitive = toUpperArray(this.dateTimeFormat.AbbreviatedMonthGenitiveNames);
				else
					upperMonthsGenitive = this._upperMonthsGenitive = toUpperArray(this.dateTimeFormat.MonthGenitiveNames);
			}
			// Check the list of genitive month names
			i = upperMonthsGenitive.indexOf(value);
		}
		return i;
	}

	_getDayIndex(value: string, abbr?: boolean) {
		// Get or create the cache of upper-case day names
		let upperDays: string[] = abbr ? this._upperAbbrDays : this._upperDays;
		if (!upperDays) {
			if (abbr)
				upperDays = this._upperAbbrDays = toUpperArray(this.dateTimeFormat.AbbreviatedDayNames);
			else
				upperDays = this._upperDays = toUpperArray(this.dateTimeFormat.DayNames);
		}
		// Convert the day name to upper-case and get its index in the list
		value = toUpper(value);
		return upperDays.indexOf(value);
	}
}

CultureInfo.InvariantCulture = CultureInfo.parse(invariantCultureInfo);

export interface CalendarInfo {
	MinSupportedDateTime: string;
	MaxSupportedDateTime: string;
	AlgorithmType: number;
	CalendarType: number;
	Eras: number[];
	TwoDigitYearMax: number;
	convert?: { fromGregorian: (date: Date) => number[], toGregorian: (year: number, month: number, date: number) => Date };
}

export interface DateTimeFormatInfo {
	AMDesignator: string;
	Calendar: CalendarInfo;
	DateSeparator: string;
	FirstDayOfWeek: number;
	CalendarWeekRule: number;
	FullDateTimePattern: string;
	LongDatePattern: string;
	LongTimePattern: string;
	MonthDayPattern: string;
	PMDesignator: string;
	RFC1123Pattern: string;
	ShortDatePattern: string;
	ShortTimePattern: string;
	SortableDateTimePattern: string;
	TimeSeparator: string;
	UniversalSortableDateTimePattern: string;
	YearMonthPattern: string;
	AbbreviatedDayNames: string[];
	ShortestDayNames: string[];
	DayNames: string[];
	AbbreviatedMonthNames: string[];
	MonthNames: string[];
	NativeCalendarName: string;
	AbbreviatedMonthGenitiveNames: string[];
	MonthGenitiveNames: string[];
	Eras: any[];
}

export interface NumberFormatInfo {
	CurrencyDecimalDigits: number;
	CurrencyDecimalSeparator: string;
	CurrencyGroupSizes: number[];
	NumberGroupSizes: number[];
	PercentGroupSizes: number[];
	CurrencyGroupSeparator: string;
	CurrencySymbol: string;
	NaNSymbol: string;
	CurrencyNegativePattern: number;
	NumberNegativePattern: number;
	PercentPositivePattern: number;
	PercentNegativePattern: number;
	NegativeInfinitySymbol: string;
	NegativeSign: string;
	NumberDecimalDigits: number;
	NumberDecimalSeparator: string;
	NumberGroupSeparator: string;
	CurrencyPositivePattern: number;
	PositiveInfinitySymbol: string;
	PositiveSign: string;
	PercentDecimalDigits: number;
	PercentDecimalSeparator: string;
	PercentGroupSeparator: string;
	PercentSymbol: string;
	PerMilleSymbol: string;
	NativeDigits: string[];
	DigitSubstitution: number;
}
