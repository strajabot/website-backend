import crypto from "crypto"
import path from "path"

/**
 * 
 * @param email email to validate
 * @returns true if valid email
 */
export function validateEmail(email: string): boolean {
    //https://emailregex.com
    return new RegExp(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)
        .test(email)
}

/**
 * -Usernames can consist of the whole English Alphabet
 * -Usernames can consist of all digits
 * -Out of all special characters usernames can only use the underscore
 * -Usernames mustn't be shorter than 3 characters
 * -Usernames mustn't be longer than 31 characters
 * @param username username to validate
 * @returns true if username valid
 */
export function validateUsername(username: string): boolean {
    return new RegExp(/^[a-zA-Z0-9_]{3,31}$/).test(username)
}

/**
 * -Device name can consist of the whole English Alphabet
 * -Device name can consist of all digits
 * -Device name can contain whitespace
 * -Device name mustn't contain special characters
 * -Device name mustn't be shorter than 3 characters
 * -Device name mustn't be longer than 15 characters
 * @param deviceName Device name to validate
 * @returns true if device name is valid
 */
export function validateDeviceName(deviceName: string): boolean {
    return new RegExp(/^[a-zA-Z0-9 ]{3,15}$/).test(deviceName)
}

/**
 * -Email confirmation code can consist of the uppercase English Alphabet
 * -Email confiramtion code can consist of all digits
 * -Email confirmation code must be exactly 8 characters long
 * @param code 
 * @returns 
 */
export function validateEmailConfirmCode(code: string): boolean {
    return new RegExp(/^[A-Z0-9]{8}$/).test(code)
}

/**
 * -Password has at least one digit
 * -Password has at least one lowercase character
 * -Password has at least one uppercase character 
 * -Password has at least one special character 
 * -Password has at least 8 characters in length, but no more than 31.
 * @param password password to validate
 * @returns true if password valid
 */
export function validatePassword(password: string): boolean {
    return new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@\$%\^&(){}\[\]:;<>,.?/~_+\-=|\\]).{8,32}$/)
        .test(password)
}

/**
 * Prevents timing attacks against string comparasion by utilizing 
 * constant time string comparasion.
 * Also doesn't escape early to prevent timing attacks against 
 * string lenght
 * @param input the string to check
 * @param allowed the correct string
 * @returns true if equal
 */
export function safeCompare(input: string, allowed: string): boolean {
    let inputBuffer = Buffer.from(input)
    const allowedBuffer = Buffer.from(allowed)
    const lengthSame = (inputBuffer.length == allowedBuffer.length)
    if(!lengthSame) {
        inputBuffer = allowedBuffer
    }
    return crypto.timingSafeEqual(inputBuffer, allowedBuffer) && lengthSame
}

/**
 * Used to safely join a safe root path and a user provided unsafe subpath
 * Checks for null byte poisoning, unsuported characters for filenames and
 * directory traversal exploits
 * @param root root folder (unchecked)
 * @param subpath user provided path (checked)
 */
export function safePathJoin(root:string, subpath: string): string|null {
    if(subpath.indexOf('\0') !== -1) {
        return null
    }
    if (!/^[a-zA-Z0-9-_/]+$/.test(subpath)) {
        return null
    }
    const filePath = path.join(root, subpath);
    if (filePath.indexOf(root) !== 0) {
        return null
    }
    return filePath
}

