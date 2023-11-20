import { reactive, shallowReactive } from "vue";
import { EntityType } from "@cognitoforms/model.js";
import { VueModel } from "./vue-model";
import { createLocalVue } from "@vue/test-utils";

const localVue = createLocalVue();

localVue.use(VueModel);

const model = new VueModel({
	Person: {
		FirstName: String,
		LastName: String
	}
});

const Person = model.getJsType("Person") as EntityType;

describe("preventVueObservability", () => {
	it("VueModel instances are prevented from being observed by Vue", () => {
		// NOTE: The VueModel constructor calls `preventVueObservability` automatically

		// Ask Vue to make the model reactive / observable
		reactive(model);

		// Ensure that the model is marked as raw / skipped
		expect((model as any).__v_skip).toBe(true);

		// Ensure that the model does NOT have an Observer
		expect((model as any).__ob__).toBeUndefined();

		// Ensure that Vue doesn't override any of the model's properties
		Object.keys(model).forEach(key => {
			const prop = Object.getOwnPropertyDescriptor(model, key);
			if (prop)
				expect(key + ": " + (prop.get ? prop.get.name : null)).not.toBe(key + ": reactiveGetter");
		});
	});
});

describe("makeEntitiesVueObservable", () => {
	it("when an entity is created it is marked as raw / skipped, an entity observer is attached, and none of its properties are hijacked by Vue", () => {
		// NOTE: When an entity is registered, observeEntity is called automatically
		const person = new Person({ FirstName: "John", LastName: "Doe" });

		// Ask Vue to make the entity reactive / observable (use shallow to avoid console error since EntityObserver uses the shallow option)
		shallowReactive(person);

		// Ensure that the entity is marked as raw / skipped
		expect((person as any).__v_skip).toBe(true);

		// Ensure that the entity has an EntityObserver
		expect((person as any).__ob__).not.toBeNull();
		expect((person as any).__ob__).not.toBeUndefined();
		expect((person as any).__ob__.constructor.name).toBe("EntityObserver");

		// Ensure that Vue doesn't override any of the entity's properties
		Object.keys(person).forEach(key => {
			const prop = Object.getOwnPropertyDescriptor(person, key);
			if (prop)
				expect(key + ": " + (prop.get ? prop.get.name : null)).not.toBe(key + ": reactiveGetter");
		});

		// Ensure that the entity's meta object is marked as raw / skipped
		expect((person.meta as any).__v_skip).toBe(true);

		// Ensure that the entity's meta object has an ObjectMetaObserver
		expect((person.meta as any).__ob__).not.toBeNull();
		expect((person.meta as any).__ob__).not.toBeUndefined();
		expect((person.meta as any).__ob__.constructor.name).toBe("ObjectMetaObserver");

		// Ensure that Vue doesn't override any of the entity's object meta's properties
		Object.keys(person.meta).forEach(key => {
			const prop = Object.getOwnPropertyDescriptor(person.meta, key);
			if (prop)
				expect(key + ": " + (prop.get ? prop.get.name : null)).not.toBe(key + ": reactiveGetter");
		});
	});
});
