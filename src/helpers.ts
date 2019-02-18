export function getProp(obj: any, prop: string) {
    return obj[prop];
}

export function setProp(target: any, key: string, value: any) {
    target[key] = value;
}

var hasOwnPropertyFn = Object.prototype.hasOwnProperty;

export function hasOwnProperty(obj: any, prop: string) {
    return hasOwnPropertyFn.call(obj, prop);
}

export function debug(message: string) {
     //console.log("%c[DEBUG] " + message, "background-color: #efefef; color: #999;");
}
