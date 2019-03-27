export function Vue$isReserved(str: string): boolean {
    var c = (str + '').charCodeAt(0)
    return c === 0x24 || c === 0x5F
}

export function Vue$dependArray(value: any[]): void {
    for (var e, i = 0, l = value.length; i < l; i++) {
        e = value[i];
        e && e.__ob__ && e.__ob__.dep.depend();
        if (Array.isArray(e)) {
            Vue$dependArray(e)
        }
    }
}

export function Vue$proxy(target: object, sourceKey: string, key: string): void {
    Object.defineProperty(target, key, {
        configurable: true,
        enumerable: true,
        get: function VueModel$proxyPropertyGet() {
            return this[sourceKey][key];
        },
        set: function VueModel$proxyPropertySet(value) {
            this[sourceKey][key] = value;
        }
    });
}
