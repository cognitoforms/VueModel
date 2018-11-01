import { randomText, randomInteger } from "./helpers";

let internalState: { [name: string]: any } = {
    secrets: {}
};

export function createSecret(key: string, len: number = 8, includeLetters: boolean = true, includeDigits: boolean = false, prefix: string = null) {
    let secret: string;
    if (internalState.secrets.hasOwnProperty(key)) {
        secret = internalState.secrets[key];

        if (secret.indexOf(prefix) !== 0) {
            // TODO: Warn about existing secret without prefix?
        }
    } else {
        let rand: string = "";
        if (includeLetters) {
            rand = randomText(len, includeDigits);
        } else if (includeDigits) {
            for (let i = 0; i < len; i++) {
                rand += randomInteger(0, 9).toString();
            }
        } else {
            // TODO: Warn about not including digits or letters?
        }

        if (prefix) {
            secret = prefix + rand;
        } else {
            secret = rand;
        }

        internalState.secrets[key] = secret;
    }

    return secret;
}

export function getSecret(key: string): string {
    let secret: string;

    if (internalState.secrets.hasOwnProperty(key)) {
        secret = internalState.secrets[key];
    } else {
        // TODO: Warn about secret not found?
    }

    return secret;
}
