import { defineResources } from "./resource";

defineResources("en", {
	"allowed-values":	"{property} is not in the list of allowed values.",
	"listlength-at-least":	"Please specify at least {min} {property}.",
	"listlength-at-most":	"Please specify no more than {max} {property}.",
	"listlength-between":	"Please specify between {min} and {max} {property}.",
	"range-at-least":	"{property} must be at least {min}.",
	"range-at-most":	"{property} must be at most {max}.",
	"range-between":	"{property} must be between {min} and {max}.",
	"range-on-or-after":	"{property} must be on or after {min}.",
	"range-on-or-before":	"{property} must be on or before {max}.",
	"required":	"{property} is required.",
	"string-format":	"{property} must be formatted as {formatDescription}.",
	"string-length-at-least":	"{property} must be at least {min} characters.",
	"string-length-at-most":	"{property} must be at most {max} characters.",
	"string-length-between": "{property} must be between {min} and {max} characters.",
	"format-with-description": "{property} must be formatted as {description}.",
	"format-without-description": "{property} is not properly formatted.",
	"format-currency": "$#,###.##",
	"format-percentage": "#.##%",
	"format-integer": "#,###",
	"format-decimal": "#,###.##"
});
