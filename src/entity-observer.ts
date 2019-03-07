import { Entity, EntityAccessEventArgs, EntityChangeEventArgs } from "../lib/model.js/src/entity";
import { CustomObserver } from "./custom-observer";
import { ExtendedObserver } from "./vue-model-observability";

/**
 * A subclass of Vue's internal `Observer` class for entities, which uses model
 * metadata to manage property access/change rather than property walking and rewriting
 */
export class EntityObserver extends CustomObserver<Entity> implements ExtendedObserver {

    ensureObservable(): void {
        if ((this as any)._observable === true) {
            return;
        }
    
        this.value.accessed.subscribe(this._onAccess.bind(this));
        this.value.changed.subscribe(this._onChange.bind(this));
    
        (this as any)._observable = true;
    }

    _onAccess(args: EntityAccessEventArgs): void {

        // Get the current property value
        var value = (args.entity as any)[args.property.fieldName];

        // Notify interested observers of the property access in order to track dependencies
        this.onPropertyAccess(args.property.name, value);

    }

    _onChange(args: EntityChangeEventArgs): void {
    
        // Get the current property value
        var newValue = (args.entity as any)[args.property.fieldName];

        // Notify interested observers of the property change
        this.onPropertyChange(args.property.name, newValue);

    }
   
}
