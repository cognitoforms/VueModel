/// <reference path="dist/vuemodel.d.ts" />
import * as bob from 'dist/vuemodel'

(function () { }).constructor.prototype.when = function (props) {
	return this;
}

let options =
{
	types: {
		'Cognito.Forms.FormEntryRef': {
			"properties": {
				"Id": String
			}
		},
		'Cognito.Forms.EntryMeta': {
			"properties": {
				"AdminLink": {
					type: "String",
					"isPersisted": false,
					label: "Admin Link"
				},
				"CustomerCard": {
					type: "Cognito.Payment.CustomerCard",
					label: "Customer Card"
				},
				"DateCreated": {
					type: "Date",
					"format": "g",
					label: "Date Created"
				},
				"DateSubmitted": {
					type: "Date",
					"format": "g",
					label: "Date Submitted"
				},
				"DateUpdated": {
					type: "Date",
					"format": "g",
					label: "Date Updated"
				},
				"EditLink": {
					type: "String",
					"isPersisted": false,
					label: "Edit Link"
				},
				"LastPageViewed": {
					type: "String",
					label: "Last Page Viewed"
				},
				"Number": {
					type: "Number",
					"format": "N0",
					label: "Number"
				},
				"Order": {
					type: "Cognito.Payment.OrderRef",
					label: "Order"
				},
				"Origin": {
					type: "Cognito.Origin",
					label: "Origin"
				},
				"PaymentToken": {
					type: "Cognito.Payment.PaymentToken",
					label: "Payment Token"
				},
				"Status": {
					type: "String",
					label: "Status"
				},
				"Timestamp": {
					type: "Date",
					"isPersisted": false,
					"format": "g",
					label: "Timestamp"
				},
				"ViewLink": {
					type: "String",
					"isPersisted": false,
					label: "View Link"
				}
			}
		},
		'Cognito.Origin': {
			"properties": {
				"City": {
					type: "String",
					label: "City"
				},
				"CountryCode": {
					type: "String",
					label: "Country Code"
				},
				"IpAddress": {
					type: "String",
					label: "Ip Address"
				},
				"IsImported": {
					type: "Boolean",
					label: "Is Imported"
				},
				"Region": {
					type: "String",
					label: "Region"
				},
				"Timezone": {
					type: "String",
					label: "Timezone"
				},
				"UserAgent": {
					type: "String",
					label: "User Agent"
				}
			}
		},
		'Cognito.Forms.FormEntry': {
			"properties": {
				"Entry": {
					type: "Cognito.Forms.EntryMeta",
					label: "Entry"
				},
				"Form": {
					type: "Cognito.Forms.FormRef",
					label: "Form"
				},
				"Id": {
					type: "String",
					label: "Id"
				}
			},
			"methods": {
				"ShouldEncrypt": {
					"parameters": [],
					"isStatic": false
				}
			}
		},
		'Cognito.Forms.FormEntry.ThomasFamily.Form': {
			"baseType": "Cognito.Forms.FormEntry",
			"format": "[TextSingleLine]",
			"properties": {
				TextSingleLine: {
					type: String,
					label: "Text - Single Line",
					required: true,
					defaultValue: "Text"
				},
				TextMultipleLines: {
					type: String,
					label: "Text - Multiple Lines",
					required: {
						function() {
							return (this ? this.get('TextMultipleLines_IsRequired') : null);
						},
						dependsOn: "TextMultipleLines_IsRequired",
					},
					default: {
						function() {
							return (this ? this.get('TextSingleLine') : null);
						},
						dependsOn: "TextSingleLine"
					}
				},
				TextPassword: {
					type: String,
					label: "Text - Password",
					validation: {
						function() {
							return ((this ? this.get('TextPassword') : null) === null);
						},
						message: "Password must be specified.",
						dependsOn: "TextPassword"
					}
				},
				Calculation: {
					type: Number,
					format: "N0",
					get: function(){ var result = (1 + 1); return isFinite(result) ? result : null; }
				},
				"TextMultipleLines_IsRequired": {
					type: "Boolean",
					"isPersisted": false,
					"isCalculated": true,
					label: "Text - Multiple Lines Required",
					"rules": {
						"calculated": {
							"onChangeOf": ["TextSingleLine"],
							"calculate": "((this ? this.get('TextSingleLine') : null) !== null)"
						}
					}
				}
			}
		},
		'Cognito.EndpointNotification': {
			baseType: "Cognito.Notification",
			properties: {
				SubmitEndpoint: String,
				UpdateEndpoint: String
			}
		}
	}
};

	//let model = new bob.VueModel({

	//	Person: {
	//		properties: {
	//			fullName: {
	//				type: String,
	//				get: function () { return this.firstName + " " + this.lastName; }
	//			},

	//			// Calculated Property
	//			fullName: {
	//				type: String,
	//				get: function () { return this.firstName + " " + this.lastName; },
	//				set: function () { /* split and set first and last */ },
	//				dependsOn: ["firstName", "lastName"],
	//			},
	//		},
	//		propE: {
	//			allowedValues: "MyProp",
	//			allowedValues: ['a', 'b'],
	//			allowedValues: {
	//				values: function () {
	//					return this.myProp.map(function () { });
	//				},
	//				basedOn: ["???"]
	//			},
	//			calculated: {
	//				calculate: function () {

	//				}
	//			}
	//		}
	//	},
	//	Todo: {
	//		format: "[text] completed=[completed]",
	//		properties: {
	//			text: { type: String },
	//			completed: { type: Boolean, format: "Yes|No", default: function () { return false; }, dependsOn: [""] },
	//			canArchive: { type: Boolean, format: "Yes|No" },
	//			canArchive: { type: Boolean, format: "Yes|No", isPersisted: true, get: function () { } }, // Not allowed
	//			canArchive: { type: Boolean, get: function () { }, dependsOn: ["completed"], set: function (value) { } },
	//		},
	//		methods: {
	//			toggleCompleted: function () {
	//				this.completed = !this.completed;
	//			}
	//		},
	//		rules: {
	//			myCustomRule: {
	//				execute: function () {
	//					if (this.completed) {

	//					}
	//				},
	//				onChangeOf: ["completed", "archived"]
	//			},
	//			myCustomRule:
	//				(function () {
	//					if (this.completed) {

	//					}
	//				}).onChangeOf("completed", "archived")
	//					.onInit()
	//		}
	//	}
	//});