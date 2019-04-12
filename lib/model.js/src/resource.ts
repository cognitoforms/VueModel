/* eslint-disable import/export */
import { ObjectLookup, hasOwnProperty, merge } from "./helpers";

/**
 * Alias type for a localized resource dictionary
 */
export type LocalizedResources = ObjectLookup<string>;

/**
 * Alias type for a lookup of string locales to localized resource dictionary
 */
export type LocalizedResourcesMap = ObjectLookup<LocalizedResources>;

/**
 * The dictionary of localized resource messages
 */
export const Resources: LocalizedResourcesMap = { };

/**
 * The default locale, can be changed via `setDefaultLocale(locale)`.
 */
let defaultLocale: string = null;

/**
 * Sets the default locale
 * @param locale The default locale
 */
export function setDefaultLocale(locale: string): void {
	defaultLocale = locale;
}

/**
 * Globally defined resources
 */
const globalResources: LocalizedResourcesMap = { };

/**
 * Globally define localized resource messages for the given locale
 * @param locale The locale to set messages for
 * @param resources The resources messages
 */
export function defineResources(locale: string, resources: LocalizedResources): void {
	globalResources[locale] = hasOwnProperty(globalResources, locale) ? merge(globalResources[locale], resources) : resources;
}

/**
 * Gets the resource with the specified name
 * @param name The resource name/key
 * @param customResources The optional custom resource strings lookup object
 * @param locale The requested locale
 */
export function getResource(name: string, locale?: string): string;
export function getResource(name: string, customResources?: LocalizedResourcesMap): string;
export function getResource(name: string, customResources?: LocalizedResourcesMap, locale?: string): string;
export function getResource(name: string, arg2?: LocalizedResourcesMap | string, arg3?: string): string {
	let customResources: LocalizedResourcesMap;
	let locale: string;
	if (arguments.length === 2) {
		if (typeof arg2 === "object") {
			customResources = arg2;
			locale = null;
		}
		else if (typeof arg2 === "string") {
			customResources = null;
			locale = arg2;
		}
	}
	else if (arguments.length >= 3) {
		customResources = arg2 as LocalizedResourcesMap;
		locale = arg3 as string;
	}

	if (!locale) locale = defaultLocale || "en";

	let res: string;

	if (customResources && hasOwnProperty(customResources, locale) && hasOwnProperty(customResources[locale], name))
		res = customResources[locale][name];
	else if (hasOwnProperty(globalResources, locale) && hasOwnProperty(globalResources[locale], name))
		res = globalResources[locale][name];
	else
		throw new Error("Resource '" + name + "' is not defined for locale '" + locale + "'.");

	return res;
}
