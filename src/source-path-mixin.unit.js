import Vue from "vue";
import { mount, createLocalVue } from "@vue/test-utils";
import { VueModel } from "./vue-model";
import { SourceRootMixin } from "./source-root-mixin";
import { SourcePathMixin } from "./source-path-mixin";

const localVue = createLocalVue();

localVue.use(VueModel);

const model = new VueModel({
	Person: {
		FirstName: String,
		LastName: String
	}
});

const Person = model.getJsType("Person");

const Field = {
	template: `
<div :class="{ 'c-required': $source.required }">
	<slot :field="$source"></slot>
</div>
`,
	mixins: [SourcePathMixin]
};

const RootComponent = {
	components: { Field },
	props: ['nameRequired'],
	template: `
<Field source="FirstName" :required="nameRequired" v-slot="{ field }">
	<div v-if="field.readonly"><span>{{ field.displayValue }}</span></div>
	<div v-else><input :value="field.displayValue" /></div>
</Field>
`,
	mixins: [SourceRootMixin]
};

describe("SourcePathMixin", () => {
	it.only("provides a SourcePathAdapter to scoped slots", async () => {
		const person = new Person({ FirstName: "John", LastName: "Doe" });
		const wrapper = mount(RootComponent, { sync: false, localVue, propsData: { source: person } });

		expect(wrapper.contains("span")).toBeFalsy();
		expect(wrapper.find(Field).vm.$source.displayValue).toBe(person.FirstName);
		expect(wrapper.find("input").element.value).toBe(person.FirstName);

		person.FirstName = "Jane";
		await Vue.nextTick();

		expect(wrapper.find(Field).vm.$source.displayValue).toBe(person.FirstName);
		expect(wrapper.find("input").element.value).toBe(person.FirstName);
	});

	it.only("supports overriding readonly via the component's prop", async () => {
		const person = new Person({ FirstName: "John", LastName: "Doe" });
		const wrapper = mount(RootComponent, { sync: false, localVue, propsData: { source: person } });

		wrapper.setProps({ readonly: true });
		await Vue.nextTick();

		expect(wrapper.contains("input")).toBeFalsy();
		expect(wrapper.find("span").text()).toBe(person.FirstName);
	});

	it.only("supports overriding required via the component's prop", async () => {
		const person = new Person({ FirstName: "John", LastName: "Doe" });
		const wrapper = mount(RootComponent, { sync: false, localVue, propsData: { source: person } });

		var fieldComponent = wrapper.find(Field);
		var fieldAdapter = fieldComponent.vm.$source;

		expect(fieldAdapter.displayValue).toBe(person.FirstName);
		expect(fieldComponent.classes().includes('c-required')).toBe(false);

		fieldComponent.setProps({ required: true });
		await Vue.nextTick();

		expect(fieldAdapter.displayValue).toBe(person.FirstName);
		expect(fieldComponent.classes().includes('c-required')).toBe(true);
	});
});
