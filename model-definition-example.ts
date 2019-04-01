/// <reference path="dist/vuemodel.d.ts" />
import * as bob from "dist/vuemodel";

(function () { }).constructor.prototype.when = function (props) {
	return this;
};

var model = new Model;

let options =
{
	"Forms.FormEntryRef": {
		Id: String
	},
	"Forms.EntryMeta": {
		AdminLink: String,
		CustomerCard: "Cognito.Payment.CustomerCard",
		DateCreated: { type: Date, format: "g" },
		DateSubmitted: { type: Date, format: "g" },
		DateUpdated: { type: Date, format: "g" },
		EditLink: String,
		LastPageViewed: String,
		Number: { type: Number, format: "N0" },
		Order: "Cognito.Payment.OrderRef",
		Origin: "Cognito.Origin",
		PaymentToken: "Cognito.Payment.PaymentToken",
		Status: String,
		Timestamp: { type: Date, format: "g" },
		ViewLink: String
	},
	"Origin": {
		City: String,
		CountryCode: String,
		IpAddress: String,
		IsImported: Boolean,
		Region: String,
		Timezone: String,
		UserAgent: String
	},
	"Forms.FormEntry": {
		Id: String,
		Entry: "Cognito.Forms.EntryMeta",
		Form: "Cognito.Forms.FormRef"
	},
	"Forms.FormEntry.ThomasFamily.Form": {
		$extends: "Cognito.Forms.FormEntry",
		$format: "[TextSingleLine]",
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
					return (this ? this.get("TextMultipleLines_IsRequired") : null);
				},
				dependsOn: "TextMultipleLines_IsRequired"
			},
			default: {
				function() {
					return (this ? this.get("TextSingleLine") : null);
				},
				dependsOn: "TextSingleLine"
			}
		},
		TextPassword: {
			type: String,
			label: "Text - Password",
			validation: {
				function() {
					return ((this ? this.get("TextPassword") : null) === null);
				},
				message: "Password must be specified.",
				dependsOn: "TextPassword"
			}
		},
		Calculation: {
			type: Number,
			format: "N0",
			get: function () { var result = (1 + 1); return isFinite(result) ? result : null; }
		},
		TextMultipleLines_IsRequired: {
			type: Boolean,
			label: "Text - Multiple Lines Required",
			get: {
				function() {
					return (this ? this.get("TextSingleLine") : null) !== null;
				},
				dependsOn: "TextSingleLine"
			}
		}
	},
	"Cognito.EndpointNotification": {
		$extends: "Cognito.Notification",
		SubmitEndpoint: String,
		UpdateEndpoint: String
	}
};

// let model = new bob.VueModel({

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
// });