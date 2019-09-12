import { Resource } from "./resource";
import { FormatError } from "./format-error";
import { Property } from "./property";
import { PropertyChain } from "./property-chain";
import { Type } from "./type";
import { Entity } from "./entity";
import { evalPath, getConstructorName } from "./helpers";

export const formatTemplateParser = /\[([_a-zA-Z\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02b8\u02bb-\u02c1\u02d0-\u02d1\u02e0-\u02e4\u02ee\u0370-\u0373\u0376-\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0523\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0621-\u064a\u0660-\u0669\u066e-\u066f\u0671-\u06d3\u06d5\u06e5-\u06e6\u06ee-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07c0-\u07ea\u07f4-\u07f5\u07fa\u0904-\u0939\u093d\u0950\u0958-\u0961\u0966-\u096f\u0971-\u0972\u097b-\u097f\u0985-\u098c\u098f-\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc-\u09dd\u09df-\u09e1\u09e6-\u09f1\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a59-\u0a5c\u0a5e\u0a66-\u0a6f\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2-\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0-\u0ae1\u0ae6-\u0aef\u0b05-\u0b0c\u0b0f-\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3d\u0b5c-\u0b5d\u0b5f-\u0b61\u0b66-\u0b6f\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0be6-\u0bef\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58-\u0c59\u0c60-\u0c61\u0c66-\u0c6f\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0-\u0ce1\u0ce6-\u0cef\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d28\u0d2a-\u0d39\u0d3d\u0d60-\u0d61\u0d66-\u0d6f\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32-\u0e33\u0e40-\u0e46\u0e50-\u0e59\u0e81-\u0e82\u0e84\u0e87-\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa-\u0eab\u0ead-\u0eb0\u0eb2-\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0ed0-\u0ed9\u0edc-\u0edd\u0f00\u0f20-\u0f29\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8b\u1000-\u102a\u103f-\u1049\u1050-\u1055\u105a-\u105d\u1061\u1065-\u1066\u106e-\u1070\u1075-\u1081\u108e\u1090-\u1099\u10a0-\u10c5\u10d0-\u10fa\u10fc\u1100-\u1159\u115f-\u11a2\u11a8-\u11f9\u1200-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u1676\u1681-\u169a\u16a0-\u16ea\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u17e0-\u17e9\u1810-\u1819\u1820-\u1877\u1880-\u18a8\u18aa\u1900-\u191c\u1946-\u196d\u1970-\u1974\u1980-\u19a9\u19c1-\u19c7\u19d0-\u19d9\u1a00-\u1a16\u1b05-\u1b33\u1b45-\u1b4b\u1b50-\u1b59\u1b83-\u1ba0\u1bae-\u1bb9\u1c00-\u1c23\u1c40-\u1c49\u1c4d-\u1c7d\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u2094\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2183-\u2184\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2c6f\u2c71-\u2c7d\u2c80-\u2ce4\u2d00-\u2d25\u2d30-\u2d65\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3006\u3031-\u3035\u303b-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31b7\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fc3\ua000-\ua48c\ua500-\ua60c\ua610-\ua62b\ua640-\ua65f\ua662-\ua66e\ua680-\ua697\ua722-\ua788\ua78b-\ua78c\ua7fb-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8d0-\ua8d9\ua900-\ua925\ua930-\ua946\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa50-\uaa59\uac00-\ud7a3\uf900-\ufa2d\ufa30-\ufa6a\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][_.0-9a-zA-Z\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02b8\u02bb-\u02c1\u02d0-\u02d1\u02e0-\u02e4\u02ee\u0370-\u0373\u0376-\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0523\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0621-\u064a\u0660-\u0669\u066e-\u066f\u0671-\u06d3\u06d5\u06e5-\u06e6\u06ee-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07c0-\u07ea\u07f4-\u07f5\u07fa\u0904-\u0939\u093d\u0950\u0958-\u0961\u0966-\u096f\u0971-\u0972\u097b-\u097f\u0985-\u098c\u098f-\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc-\u09dd\u09df-\u09e1\u09e6-\u09f1\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a59-\u0a5c\u0a5e\u0a66-\u0a6f\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2-\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0-\u0ae1\u0ae6-\u0aef\u0b05-\u0b0c\u0b0f-\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3d\u0b5c-\u0b5d\u0b5f-\u0b61\u0b66-\u0b6f\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0be6-\u0bef\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58-\u0c59\u0c60-\u0c61\u0c66-\u0c6f\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0-\u0ce1\u0ce6-\u0cef\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d28\u0d2a-\u0d39\u0d3d\u0d60-\u0d61\u0d66-\u0d6f\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32-\u0e33\u0e40-\u0e46\u0e50-\u0e59\u0e81-\u0e82\u0e84\u0e87-\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa-\u0eab\u0ead-\u0eb0\u0eb2-\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0ed0-\u0ed9\u0edc-\u0edd\u0f00\u0f20-\u0f29\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8b\u1000-\u102a\u103f-\u1049\u1050-\u1055\u105a-\u105d\u1061\u1065-\u1066\u106e-\u1070\u1075-\u1081\u108e\u1090-\u1099\u10a0-\u10c5\u10d0-\u10fa\u10fc\u1100-\u1159\u115f-\u11a2\u11a8-\u11f9\u1200-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u1676\u1681-\u169a\u16a0-\u16ea\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u17e0-\u17e9\u1810-\u1819\u1820-\u1877\u1880-\u18a8\u18aa\u1900-\u191c\u1946-\u196d\u1970-\u1974\u1980-\u19a9\u19c1-\u19c7\u19d0-\u19d9\u1a00-\u1a16\u1b05-\u1b33\u1b45-\u1b4b\u1b50-\u1b59\u1b83-\u1ba0\u1bae-\u1bb9\u1c00-\u1c23\u1c40-\u1c49\u1c4d-\u1c7d\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u2094\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2183-\u2184\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2c6f\u2c71-\u2c7d\u2c80-\u2ce4\u2d00-\u2d25\u2d30-\u2d65\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3006\u3031-\u3035\u303b-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31b7\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fc3\ua000-\ua48c\ua500-\ua60c\ua610-\ua62b\ua640-\ua65f\ua662-\ua66e\ua680-\ua697\ua722-\ua788\ua78b-\ua78c\ua7fb-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8d0-\ua8d9\ua900-\ua925\ua930-\ua946\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa50-\uaa59\uac00-\ud7a3\uf900-\ufa2d\ufa30-\ufa6a\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]*)(\:(.+?))?\]/ig;

const metaPathParser = /^(.*\.|)meta(\..*|)$/;

export abstract class Format<T> {

	readonly specifier: string;

	description: string;
	nullString: string;
	undefinedString: string;

	abstract paths: string[];

	abstract convertToString(val: T): string;

	abstract convertFromString(text: string): T | FormatError;

	constructor(specifier: string, description: string = null, nullString: string = null, undefinedString: string = undefined) {

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

	convert(val: T): string {
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
	}


	convertBack(text: string): T | FormatError {
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

	}

	toString() {
		return this.specifier;
	}

	static create<T>(options: CustomFormatOptions<T>): Format<T> {
		return new CustomFormat<T>(options);
	}

	static fromTemplate<TEntity extends Entity>(type: Type, template: string, formatEval: unknown = null): Format<TEntity> {
		return new ModelFormat<TEntity>(type, template, formatEval);
	}

	static hasTokens(template: string): boolean {
		formatTemplateParser.lastIndex = 0;
		return formatTemplateParser.test(template);
	}

}

export interface FormatConstructor {
	create<T>(options: CustomFormatOptions<T>): Format<T>;
	fromTemplate<TEntity extends Entity>(type: Type, template: string, formatEval?: unknown): Format<TEntity>;
}

export interface FormatOptions {
	specifier: string;
	formatEval?: (value: string) => string;
	description?: string;
	nullString?: string;
	undefinedString?: string;
}

export interface FormatToken<T> {
	prefix: string;
	path?: string;
	format?: string | Format<T>;
}

export class CustomFormat<T> extends Format<T> {

	private customConvert: CustomFormatConvertFunction<T>;
	private customConvertBack: CustomFormatConvertBackFunction<T>;
	paths: string[];

	constructor(options: CustomFormatOptions<T>) {
		super(options.specifier, options.description, options.nullString, options.undefinedString);

		this.customConvert = options.convert;
		this.customConvertBack = options.convertBack;
		this.paths = options.paths;
	}

	convertToString(val: T): string {
		if (!this.customConvert) {
			return val as any;
		}

		return this.customConvert(val);
	}

	convertFromString(text: string): T | FormatError {

		if (!this.customConvertBack) {
			return text as any;
		}

		try {
			return this.customConvertBack(text);
		}
		catch (err) {
			if (err instanceof FormatError) {
				return err;
			}

			let formatError = new FormatError(this.description ?
				Resource.get("format-with-description").replace('{description}', this.description) :
				Resource.get("format-without-description"),
				text);

			return formatError as any;
		}
	}

}

export interface CustomFormatConstructor {
	new <T>(options: CustomFormatOptions<T>): CustomFormat<T>;
}

export interface CustomFormatOptions<T> extends FormatOptions {
	convert: CustomFormatConvertFunction<T>;
	convertBack?: CustomFormatConvertBackFunction<T>;
	paths?: string[];
}

export type CustomFormatConvertFunction<T> = (value: T) => string;

export type CustomFormatConvertBackFunction<T> = (text: string) => T | FormatError;

export class ModelFormat<T extends Entity> extends Format<T> {

	type: Type;
	tokens: FormatToken<any>[];
	template: string;
	paths: string[];

	constructor(type: Type, specifier: string, formatEval: unknown = null) {

		super(specifier);

		this.type = type;

		// Compile the model format
		this.compile();
	}

	compile(): void {
		if (!this.tokens) {
			this.paths = [];
			this.tokens = [];
			this.template = this.specifier;

			// Replace escaped \, [ or ] characters with placeholders
			let template = this.template.replace(/\\\\/g, '\u0000').replace(/\\\[/g, '\u0001').replace(/\\\]/g, '\u0002');
			var index = 0;
			formatTemplateParser.lastIndex = 0;
			var match = formatTemplateParser.exec(template);

			// Process each token match
			while (match) {
				var path = match[1];
				var propertyPath = path;

				// See if the path represents a property path in the model
				var propertyDefaultFormat: Format<any> = null;
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
						var property = this.type.getPath(propertyPath);
						if (property) {
							// Only allow formats for a property path that is not followed by ".meta..."
							if (allowFormat) {
								// Determine the default property format
								if (property instanceof Property) {
									propertyDefaultFormat = property.format;
								} else if (property instanceof PropertyChain) {
									let lastProperty = property.lastProperty;
									propertyDefaultFormat = lastProperty.format;
								}

								// If the path references one or more entity properties, include paths for the property format. Otherwise, just add the path.
								var lastIndex = formatTemplateParser.lastIndex;
								if (propertyDefaultFormat && propertyDefaultFormat instanceof Format && propertyDefaultFormat !== this && propertyDefaultFormat.paths.length > 0)
									Array.prototype.push.apply(this.paths, propertyDefaultFormat.paths.map(function (p) { return propertyPath + "." + p; }));
								else
									this.paths.push(propertyPath);
								formatTemplateParser.lastIndex = lastIndex;
							}
							// Formats are not allowed, so just add the path
							else {
								this.paths.push(propertyPath);
							}
						}
					}
				}
				catch (e) {
					// 
				}

				// Create a token for the current match, including the prefix, path and format
				this.tokens.push({
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
				this.tokens.push({
					prefix: template.substring(index).replace(/\u0000/g, '\\').replace(/\u0001/g, '[').replace(/\u0002/g, ']')
				});
			}

		}

	}

	convertToString(obj: T): string {

		if (obj === null || obj === undefined) {
			return "";
		}

		var result = "";
		for (var index = 0; index < this.tokens.length; index++) {
			var token = this.tokens[index];
			if (token.prefix)
				result = result + token.prefix;
			if (token.path) {
				var value = evalPath(obj, token.path);
				if (value === undefined || value === null) {
					value = "";
				} else if (token.format) {
					let format: Format<any>
					if (token.format instanceof Format) {
						format = token.format;
					} else if (typeof token.format === "string") {
						format = token.format = obj.meta.type.model.getFormat<any>(value.constructor, token.format);
					}
					value = format.convert(value);
				}
				result = result + value;
			}
		}
		return result;
	}

	convertFromString(text: string): FormatError | T {
		throw new Error("Cannot convert from a format string back to an entity.");
	}

}

export interface CompiledFormatOptions {
	specifier: string;
}

declare global {

	interface DateConstructor {
		parseLocale(text: string): Date;
		parseLocale(text: string, format: string): Date;
		_expandFormat(sft: any, format: string): string;
	}
	
	interface Date {
		localeFormat(format: string): string;
	}

	interface NumberConstructor {
		parseLocale(text: string): number;
		parseLocale(text: string, format: string): number;
	}

	interface Number {
		localeFormat(format: string): string;
	}

}

declare const Sys: SysNamespace;

interface SysNamespace {
	CultureInfo: SysCultureInfoNamespace;
}

interface SysCultureInfoNamespace {
	CurrentCulture: CultureInfo;
}

interface CultureInfo {
	dateTimeFormat: DateTimeFormatInfo;
	numberFormat: NumberFormatInfo;
}

interface DateTimeFormatInfo {
}

interface NumberFormatInfo {
	CurrencyDecimalDigits: Number;
	CurrencySymbol: string;
	PercentSymbol: string;
}

export function createFormat<T>(type: any, format: string): Format<T> {
	if (type === Date) {
		// Add support for g and G that are not natively supported by the MSAJAX framework
		if (format === "g")
			format = Date._expandFormat(Sys.CultureInfo.CurrentCulture.dateTimeFormat, "d") + " " + Date._expandFormat(Sys.CultureInfo.CurrentCulture.dateTimeFormat, "t");
		else if (format === "G")
			format = Date._expandFormat(Sys.CultureInfo.CurrentCulture.dateTimeFormat, "d") + " " + Date._expandFormat(Sys.CultureInfo.CurrentCulture.dateTimeFormat, "T");

		return Format.create<Date>({
			specifier: format,
			description: "",
			paths: [],
			convert: function (value: Date): string {
				return value.localeFormat(format);
			},
			convertBack: function (str: string): Date | FormatError {
				var date;

				// Time value, set default date to 1/1/1970 to easily compare time values
				if (format === "t") {
					var timeFormat = Date._expandFormat(Sys.CultureInfo.CurrentCulture.dateTimeFormat, "d") + " " + Date._expandFormat(Sys.CultureInfo.CurrentCulture.dateTimeFormat, "t");
					var startDate = (new Date(1970, 0, 1)).localeFormat("d");
					date = Date.parseLocale(startDate + " " + str, timeFormat);
				}
				else
					date = Date.parseLocale(str, format);

				if (date === null)
					throw new Error("Invalid date format");

				return date;
			}
		}) as any;
	} else if (type === Number) {
		var isCurrencyFormat = format.match(/[$c]+/i);
		var isPercentageFormat = format.match(/[%p]+/i);
		var isIntegerFormat = format.match(/[dnfg]0/i);

		var currencyDecimalDigits = Sys.CultureInfo.CurrentCulture.numberFormat.CurrencyDecimalDigits;

		var integerExpr = /^-?[0-9]{1,10}$/;

		return new CustomFormat<number>({
			specifier: format,
			description: isCurrencyFormat ? Resource["format-currency"] : isPercentageFormat ? Resource["format-percentage"] : isIntegerFormat ? Resource["format-integer"] : Resource["format-decimal"],
			convert: function (val: Number): string {
				// Default to browser formatting for general format
				if (format.toLowerCase() === "g")
					return val.toString();

				// Otherwise, use the localized format
				return val.localeFormat(format);
			},
			convertBack: function (str: string): number | FormatError {

				// Handle use of () to denote negative numbers
				var sign = 1;
				if (str.match(/^\(.*\)$/)) {
					str = str.substring(1, str.length - 1);
					sign = -1;
				}

				var result;

				// Remove currency symbols before parsing
				if (isCurrencyFormat) {
					result = Number.parseLocale(str.replace(Sys.CultureInfo.CurrentCulture.numberFormat.CurrencySymbol, "")) * sign;

					// if there is a decimal place, check the precision isnt greater than allowed for currency. 
					// Floating points in js can be skewed under certain circumstances, we are just checking the decimals instead of multiplying results.
					var resultStr = result.toString();
					if (resultStr.indexOf('.') > -1 && (resultStr.length - (resultStr.indexOf('.') + 1)) > currencyDecimalDigits) {
						result = NaN;
					}
				} else if (isPercentageFormat) {
					// Remove percentage symbols before parsing and divide by 100
					result = Number.parseLocale(str.replace(Sys.CultureInfo.CurrentCulture.numberFormat.PercentSymbol, "")) / 100 * sign;
				} else {
					var n = Number.parseLocale(str);

					result = n * sign;

					// Ensure integers are actual whole numbers
					if (isIntegerFormat && !(typeof n === "number" && !isNaN(n) && integerExpr.test(n.toString()) && (n >= -2147483648 && n <= 2147483647)))
						result = NaN;
				}

				if (isNaN(result))
					throw new Error("Invalid format");

				return result;

			}
		}) as any;
	} else if (type === Boolean) {
		// Format strings used for true, false, and null (or undefined) values
		let trueFormat: string, falseFormat: string, nullFormat: string;

		if (format && format.toLowerCase() === "g") {
			trueFormat = "True";
			falseFormat = "False";
			nullFormat = ""
		} else {
			var formats = format.split(';');
			trueFormat = formats.length > 0 ? formats[0] : "";
			falseFormat = formats.length > 1 ? formats[1] : "";
			nullFormat = formats.length > 2 ? formats[2] : "";
		}

		return new CustomFormat<boolean>({
			specifier: format,
			convert: function (val: boolean): string {
				if (val === true) {
					return trueFormat;
				} else if (val === false) {
					return falseFormat;
				} else {
					return nullFormat;
				}
			},
			convertBack: function (str: string): boolean | FormatError {
				if (str.toLowerCase() === trueFormat.toLowerCase()) {
					return true;
				} else if (str.toLowerCase() === falseFormat.toLowerCase()) {
					return false;
				} else {
					return null;
				}
			}
		}) as any;
	} else {
		console.log("WARN: Unable to create format for type '" + getConstructorName(type) + "'.");
	}
}
