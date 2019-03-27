export function getProp(obj: any, prop: string): any {
    return obj[prop];
}

export function setProp(target: any, key: string, value: any): void {
    target[key] = value;
}

var hasOwnPropertyFn = Object.prototype.hasOwnProperty;

export function hasOwnProperty(obj: any, prop: string): boolean {
    return hasOwnPropertyFn.call(obj, prop);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function debug(message: string): void {
     //console.log("%c[DEBUG] " + message, "background-color: #efefef; color: #999;");
}
