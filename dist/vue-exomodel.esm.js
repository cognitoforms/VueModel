/*!
 * VueExoModel.js v0.0.2
 * (c) 2018 Cognito LLC
 * Released under the MIT License.
 */
function getProp(obj, prop) {
    return obj[prop];
}
var hasOwnPropertyFn = Object.prototype.hasOwnProperty;
function hasOwnProperty(obj, prop) {
    return hasOwnPropertyFn.call(obj, prop);
}
function debug(message) {
    // console.log("%c[DEBUG] " + message, "background-color: #efefef; color: #999;");
}

function Vue$isReserved(str) {
    var c = (str + '').charCodeAt(0);
    return c === 0x24 || c === 0x5F;
}
function Vue$dependArray(value) {
    for (var e, i = 0, l = value.length; i < l; i++) {
        e = value[i];
        e && e.__ob__ && e.__ob__.dep.depend();
        if (Array.isArray(e)) {
            Vue$dependArray(e);
        }
    }
}

var vueCompatibleModels = [];
function VueExoModel$ensureModelEventsRegistered(model, dependencies) {
    if (model != null) {
        if (vueCompatibleModels.indexOf(model) >= 0) {
            return;
        }
        var ExoModel$Model = dependencies.ExoModel$Model;
        var ExoModel$Property = dependencies.ExoModel$Property;
        var VueExoModel$observeEntity_1 = dependencies.VueExoModel$observeEntity;
        if (model instanceof ExoModel$Model) {
            model.entityRegisteredEvent.subscribe(function (sender, args) {
                VueExoModel$observeEntity_1(args.entity);
            });
            // Make existing entities observable
            model.types.forEach(function (type) {
                type.known().forEach(function (entity) {
                    VueExoModel$observeEntity_1(entity);
                });
            });
            model.propertyAddedEvent.subscribe(function (sender, args) {
                VueExoModel$ensurePropertyEventsRegistered(args.property, dependencies);
            });
            // Register for events for existing properties
            model.types.forEach(function (type) {
                type.properties.forEach(function (p) { return VueExoModel$ensurePropertyEventsRegistered(p, dependencies); });
            });
            vueCompatibleModels.push(model);
        }
    }
}
var vueCompatibleProperties = [];
function VueExoModel$ensurePropertyEventsRegistered(property, dependencies) {
    if (property != null) {
        if (vueCompatibleProperties.indexOf(property) >= 0) {
            return;
        }
        var Vue$Dep_1 = dependencies.Vue$Dep;
        var VueExoModel$observeEntity_2 = dependencies.VueExoModel$observeEntity;
        var ExoModel$Property = dependencies.ExoModel$Property;
        if (property instanceof ExoModel$Property) {
            property.accessedEvent.subscribe(function (entity, args) {
                // Get or initialize the `Dep` object
                var propertyDep = VueExoModel$getEntityPropertyDep(entity, args.property, dependencies);
                // Attach dependencies if something is watching
                if (Vue$Dep_1.target) {
                    propertyDep.depend();
                    var childOb = VueExoModel$observeEntity_2(args.value);
                    if (childOb) {
                        childOb.dep.depend();
                    }
                    else if (Array.isArray(args.value)) {
                        // TODO: set up observability entities in child list if needed? -- ex: if args.property.isEntityList...
                        Vue$dependArray(args.value);
                    }
                }
            });
            property.changedEvent.subscribe(function (entity, args) {
                // Get or initialize the `Dep` object
                var propertyDep = VueExoModel$getEntityPropertyDep(entity, args.property, dependencies);
                // Make sure a new value that is an entity is observable
                VueExoModel$observeEntity_2(args.newValue);
                // Notify of property change
                propertyDep.notify();
            });
            vueCompatibleProperties.push(property);
        }
    }
}
function VueExoModel$getEntityPropertyDep(entity, property, dependencies) {
    var depFieldName = property.fieldName + "_Dep";
    var Vue$Dep = dependencies.Vue$Dep;
    var dep;
    var target = entity;
    if (hasOwnProperty(target, depFieldName) && target[depFieldName] instanceof Vue$Dep) {
        dep = target[depFieldName];
    }
    else {
        dep = new Vue$Dep();
        Object.defineProperty(target, depFieldName, {
            configurable: true,
            enumerable: false,
            value: dep,
            writable: true
        });
    }
    return dep;
}
function VueExoModel$defineEntityObserver(dependencies) {
    var Vue$Observer = dependencies.Vue$Observer;
    var ctor = function EntityObserver() {
        Vue$Observer.apply(this, arguments);
    };
    ctor.prototype = new Vue$Observer({});
    ctor.prototype.constructor = ctor;
    // Prevent walking of entities
    // TODO: Should we allow this to happen?
    ctor.prototype.walk = function EntityObserver$walk() {
    };
    return dependencies.VueExoModel$EntityObserver = ctor;
}
function VueExoModel$defineObserveEntity(dependencies) {
    return dependencies.VueExoModel$observeEntity = function VueExoModel$observeEntity(entity, asRootData) {
        if (asRootData === void 0) { asRootData = false; }
        var ExoModel$Entity = dependencies.ExoModel$Entity;
        var VueExoModel$EntityObserver = dependencies.VueExoModel$EntityObserver;
        if (entity instanceof ExoModel$Entity) {
            var ob;
            if (hasOwnProperty(entity, '__ob__') && getProp(entity, '__ob__') instanceof VueExoModel$EntityObserver) {
                ob = getProp(entity, '__ob__');
            }
            else {
                ob = new VueExoModel$EntityObserver(entity);
            }
            if (asRootData && ob) {
                ob.vmCount++;
            }
            return ob;
        }
    };
}
function VueExoModel$makeEntitiesVueObservable(model, dependencies) {
    var entitiesAreVueObservable = dependencies.entitiesAreVueObservable;
    if (entitiesAreVueObservable) {
        VueExoModel$ensureModelEventsRegistered(model, dependencies);
        return;
    }
    VueExoModel$defineEntityObserver(dependencies);
    VueExoModel$defineObserveEntity(dependencies);
    VueExoModel$ensureModelEventsRegistered(model, dependencies);
    dependencies.entitiesAreVueObservable = true;
    return dependencies;
}

function VueExoModel$proxyEntityPropertyOntoComponentInstance(vm, rootKey, property) {
    Object.defineProperty(vm, property.name, {
        configurable: true,
        enumerable: true,
        get: function VueExoModel$proxyPropertyGet() {
            return this[rootKey][property.name];
        },
        set: function VueExoModel$proxyPropertySet(value) {
            this[rootKey][property.name] = value;
        }
    });
}
function VueExoModel$proxyEntityPropertiesOntoComponentInstance(entity, vm) {
    // TODO: add proxies onto the component instance
    // proxy data on instance
    var properties = entity.meta.type.properties;
    var props = vm.$options.props;
    var methods = vm.$options.methods;
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        if (methods && hasOwnProperty(methods, property.name)) {
            debug("Property '" + property.name + "' is hidden by a component method with the same name.");
        }
        else if (props && hasOwnProperty(props, property.name)) {
            debug("Property '" + property.name + "' is hidden by a component prop with the same name.");
        }
        else if (!Vue$isReserved(property.name)) {
            VueExoModel$proxyEntityPropertyOntoComponentInstance(vm, '_data', property);
        }
    }
}
function VueExoModel$installPlugin(Vue, dependencies) {
    var ExoModel$Entity = dependencies.ExoModel$Entity;
    Vue.mixin({
        beforeCreate: function VueExoModel$beforeCreate() {
            var vm = this;
            var replaceEntityData = function (data) {
                if (data != null && data instanceof ExoModel$Entity) {
                    vm._entity = data;
                    return {};
                }
                return data;
            };
            if (vm.$options.data) {
                if (vm.$options.data instanceof Function) {
                    var dataFn = vm.$options.data;
                    vm.$options.data = function () {
                        return replaceEntityData(dataFn.apply(this, arguments));
                    };
                }
                else {
                    var entitiesAreVueObservable = dependencies.entitiesAreVueObservable;
                    if (!entitiesAreVueObservable) {
                        // Don't let Vue from getting an Entity prior to setting up Entity observability
                        vm.$options.data = replaceEntityData(vm.$options.data);
                    }
                }
            }
        },
        created: function VueExoModel$created() {
            var vm = this;
            if (vm._entity) {
                dependencies.Vue$Observer = vm._data.__ob__.constructor;
                dependencies.Vue$Dep = vm._data.__ob__.dep.constructor;
                // Ensure that ExoModel entities are observable objects compatible with Vue's observer
                // VueExoModel$makeEntitiesVueObservable(vm._entity.meta.type.model, { ExoModel$Model, ExoModel$Entity, Vue$Observer, Vue$Dep });
                var exports = VueExoModel$makeEntitiesVueObservable(vm._entity.meta.type.model, dependencies);
                var VueExoModel$observeEntity = exports.VueExoModel$observeEntity;
                // What follows is an attempt to emulate what would have happened to
                // the `data` object had it gone through normal component intialization
                // Since the entity is now observable, go ahead and let the component see it
                vm._data = vm._entity;
                // Vue proxies the data objects `Object.keys()` onto the component itself,
                // so that the data objects properties can be used directly in templates
                VueExoModel$proxyEntityPropertiesOntoComponentInstance(vm._entity, vm);
                // The internal `observe()` method basically makes the given object observable,
                // (entities should already be at this point) but it also updates a `vmCount` counter
                VueExoModel$observeEntity(vm._entity, true);
                // Null out the field now that we've finished preparing the entity
                vm._entity = null;
            }
        }
    });
}

var VueExoModel$Dependencies = {
    entitiesAreObservable: false,
    ExoModel$Model: exomodel.Model,
    ExoModel$Entity: exomodel.Entity,
    ExoModel$Property: exomodel.Property,
};
// TODO: Do we need to take `toggleObserving()` into account?
// var shouldObserve = true;
function install(Vue) {
    return VueExoModel$installPlugin(Vue, VueExoModel$Dependencies);
}

export { install };
