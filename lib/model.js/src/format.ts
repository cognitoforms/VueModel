export class Format {

	specifier: string;
	convertFn: FormatConvertFunction;
	convertBackFn: FormatConvertBackFunction;
	formatEval: (value: string) => string;
	description: string;
	nullString: string;
	undefinedString: string;

	constructor(options: FormatOptions) {

		if (!options.hasOwnProperty("specifier") || typeof(options.specifier) !== "string") {
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

	convert(val: any): string {
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
	}

	convertBack(val: string): any {
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
	}

	toString() {
		return this.specifier;
	}

}

export interface FormatOptions {
	specifier: string;
	convert: FormatConvertFunction;
	convertBack?: FormatConvertBackFunction;
	formatEval?: (value: string) => string;
	description?: string;
	nullString?: string;
	undefinedString?: string;
}

export interface FormatConstructor {
	new(options: FormatOptions): Format;
}

export type FormatConvertFunction = (value: any) => string;

export type FormatConvertBackFunction = (value: string) => string;
