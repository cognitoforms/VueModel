import Vue from "vue";
import { createLocalVue, shallowMount } from "@vue/test-utils";
import { VueModel } from "./vue-model";
import { SourceRootMixin } from "./source-root-mixin";

const localVue = createLocalVue();

localVue.use(VueModel);

const model = new VueModel({
	Person: {
		FirstName: String,
		LastName: String
	}
});

const Person = model.getJsType("Person");

const RootComponent = {
	template: `
<div>
	<div v-if="$source.readonly"><span class="last">{{ $source.value.LastName }}</span><span class="first">{{ $source.value.FirstName }}</span></div>
	<div v-else><input class="first" :value="$source.value.FirstName" /><input class="last" :value="$source.value.LastName" /></div>
</div>
`,
	mixins: [SourceRootMixin]
};

describe("SourceRootMixin", () => {
	it("provides the $source adapter object", () => {
		const person = new Person({ FirstName: "John", LastName: "Doe" });
		const c = shallowMount(RootComponent, { localVue, propsData: { source: person } });

		expect(c.vm.$source.value).toBe(person);
		expect(c.vm.$source.readonly).toBeFalsy();
	});

	it("allows binding to $source", () => {
		const person = new Person({ FirstName: "John", LastName: "Doe" });
		const wrapper = shallowMount(RootComponent, { localVue, propsData: { source: person } });

		expect(wrapper.find("input.first").element.value).toBe(person.FirstName);
		expect(wrapper.find("input.last").element.value).toBe(person.LastName);

		wrapper.setProps({ readonly: true });

		expect(wrapper.contains("input")).toBeFalsy();

		expect(wrapper.find("span.first").text()).toBe(person.FirstName);
		expect(wrapper.find("span.last").text()).toBe(person.LastName);
	});
});