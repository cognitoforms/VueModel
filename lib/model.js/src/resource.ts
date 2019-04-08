/* eslint-disable import/export */
import { ObjectLookup, hasOwnProperty, merge } from "./helpers";

/**
 * Alias type for a localized resource dictionary
 */
export type LocalizedResources = ObjectLookup<string>;

/**
 * Implements the ability to get and set localizable resource strings
 */
export interface ResourceLocalizationImplementation {
	setDefaultLocale(locale: string): void;
	defineResources(locale: string, resources: LocalizedResources): void;
	getResource(name: string, locale: string, params: ObjectLookup<string>): string;
}

/**
 * Alias type for a lookup of string locales to localized resource dictionary
 */
type LocalizedResourcesMap = ObjectLookup<LocalizedResources>;

/**
 * The dictionary of localized resource messages
 */
const localizedResources: LocalizedResourcesMap = { };

/**
 * The default locale, can be changed via `Resource.setDefaultLocale(locale)`.
 */
let defaultLocale: string = null;

/**
 * Default resource localization implementation
 */
let localizationImplementation: ResourceLocalizationImplementation = {
	setDefaultLocale: function Resource$setDefaultLocale(locale: string): void {
		if (!hasOwnProperty(localizedResources, locale)) throw new Error("Resources are not defined for locale '" + locale + "'.");
		defaultLocale = locale;
	},
	defineResources: function Resource$defineResources(locale: string, resources: ObjectLookup<string>): void {
		if (!resources) throw new Error("Resources cannot be unset for locale '" + locale + "'.");
		localizedResources[locale] = hasOwnProperty(localizedResources, locale) ? merge(localizedResources[locale], resources) : resources;
	},
	getResource: function Resource$getResource(name: string, locale: string, params: ObjectLookup<string>) {
		if (!locale) locale = defaultLocale || "en";
		if (!hasOwnProperty(localizedResources, locale)) throw new Error("Resources are not defined for locale '" + locale + "'.");
		var localeResources = localizedResources[locale];
		if (!hasOwnProperty(localeResources, name)) throw new Error("Resource '" + name + "' is not defined for locale '" + locale + "'.");
		let res = localeResources[name];
		if (params) {
			return res.replace(/{([^}]+)}/g, (match: string, key: string): string => {
				return hasOwnProperty(params, key) ? params[key] : match;
			});
		}
		return res;
	}
};

/**
 * Defines the implementation of resource localization (`setDefaultLocale` and `defineResources`, and `getResource` functions).
 * This is optional, since a default implementation is provided.
 * @param implementation The resource localization implementation
 */
export function setResourceImplementation(implementation: ResourceLocalizationImplementation): void {
	if (!implementation) throw new Error("Cannot unset localization implementation.");
	localizationImplementation = implementation;
}

/**
 * Sets the current locale
 * @param locale The locale to use
 */
export function setDefaultLocale(locale: string): void {
	localizationImplementation.setDefaultLocale(locale);
}

/**
 * Sets resource messages for the given locale
 * @param locale The locale to set messages for
 * @param resources The resources messages
 */
export function defineResources(locale: string, resources: LocalizedResources): void {
	localizationImplementation.defineResources(locale, resources);
}

/**
 * Gets the resource with the specified name
 * @param name The resource name/key
 * @param locale The locale of the resource
 * @param params The parameters to use for string format substitution
 */
export function getResource(name: string, locale?: string): string;
export function getResource(name: string, params?: ObjectLookup<string>): string;
export function getResource(name: string, locale?: string, params?: ObjectLookup<string>): string;
export function getResource(name: string, arg2?: string | ObjectLookup<string>, arg3?: ObjectLookup<string>): string {
	let locale: string;
	let params: ObjectLookup<string>;
	if (arguments.length === 2) {
		if (typeof arg2 === "string") {
			locale = arg2;
			params = null;
		}
		else if (typeof arg2 === "object") {
			locale = null;
			params = arg2;
		}
	}
	else if (arguments.length >= 3) {
		locale = arg2 as string;
		params = arg3 as ObjectLookup<string>;
	}

	return localizationImplementation.getResource(name, locale, params);
}
