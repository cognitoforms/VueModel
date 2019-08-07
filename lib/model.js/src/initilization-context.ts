import { Entity } from "./entity";
import { Property } from "./property";

export type InitializationValueResolver = (instance: Entity, property: Property, value: any) => Promise<any>;

export class InitializationContext {
	private constructorCall = false;
	private valueResolver: InitializationValueResolver;
	private tasks = new Set<Promise<any>>();
	private waiting: (() => void)[] = [];
	constructor(constructorCall: boolean, valueResolver?: InitializationValueResolver) {
		this.constructorCall = constructorCall;
		this.valueResolver = valueResolver;
	}

	wait(task: Promise<any>) {
		this.tasks.add(task);
		task.then(() => {
			this.tasks.delete(task);
			if (this.tasks.size === 0)
				this.waiting.forEach(done => done());
		});
	}

	ready() {
		if (this.tasks.size === 0)
			return Promise.resolve;

		return new Promise<void>(resolve => {
			this.waiting.push(resolve);
		});
	}

	tryResolveValue(instance: Entity, property: Property, value: any) {
		const task = this.valueResolver && this.valueResolver(instance, property, value);
		if (task)
			this.wait(task);
		return task;
	}
}
