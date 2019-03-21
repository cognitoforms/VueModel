import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator'
import { SourcePropertyAdapter, isSourcePropertyAdapter } from "./source-adapter";
import { formatDisplayValue } from "./source-path-adapter";

@Component
export class SourceOptionAdapter<TValue> extends Vue {

    @Prop()
    value: TValue;

	get parent(): SourcePropertyAdapter<TValue> {

		for (let parentVm: Vue = this.$parent.$parent, parentLevel = 1; parentVm != null; parentVm = parentVm.$parent, parentLevel += 1) {
			if (isSourcePropertyAdapter((parentVm as any).$source)) {
				return (parentVm as any).$source as SourcePropertyAdapter<TValue>;
			}
		}

		throw new Error("Parent source not found!");
    }

    get label(): string {
        return this.parent.label;
    }
    
    get displayValue(): string {
        return formatDisplayValue(this.parent, this.value);
    }

    toString(): string {
        return "Option for Source['" + this.parent.property.path + "']";
    }

}
