export const enum RuleInvocationType {

	/** Occurs when an existing instance is initialized.*/
	InitExisting = 2,

	/** Occurs when a new instance is initialized. */
	InitNew = 4,

	/** Occurs when a property value is retrieved. */ 
	PropertyGet = 8,

	/** Occurs when a property value is changed. */
	PropertyChanged = 16
}
