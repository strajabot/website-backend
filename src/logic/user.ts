import { genEmailConfirmCode} from "./email"
import { validateEmail, validatePassword , validateUsername } from "../util";
import { User } from "../database/entity/user"
import { checkPassword, hashPassword } from "./password";
import { getRepository } from "typeorm";

export interface IRegistrationData {
    username: string
    password: string
    email: string
}

export function isRegistrationData(rawData: object): rawData is IRegistrationData {
    if(typeof rawData !== "object") return false
    if(!rawData) return false
    const data = rawData as IRegistrationData
    if(typeof data.username !== "string") return false;
    if(typeof data.password !== "string") return false;
    if(typeof data.email !== "string") return false;
    return true;
}

export async function registerUser(data: IRegistrationData): Promise<boolean> {
    if(!validateUsername(data.username)) throw "Bad Username Format"
    if(!validateEmail(data.email)) throw "Bad email format"
    if(!validatePassword(data.password)) throw "Bad password format"
    const user: User = new User()
    user.username = data.username;
    user.email = data.email
    user.emailConfirmCode = genEmailConfirmCode()
    user.emailIsConfirmed = false
    user.hash = await hashPassword(data.password)
    try {
        //insert will fail if the user already exists resulting in an error
        //that triggers the catch clause?
        await getRepository(User).insert(user)
        return true
    } catch(e) {
        console.log(e)
        return false
    }
}

export interface ILoginData {
    username: string
    password: string
}

export function isLoginData(rawData: object): rawData is ILoginData {
    if(typeof rawData !== "object") return false
    if(!rawData) return false
    const data = rawData as ILoginData
    if(typeof data.username !== "string") return false;
    if(typeof data.password !== "string") return false;
    return true;
}

export async function loginUser(data: ILoginData): Promise<boolean> {
    if(!validateUsername(data.username)) return false
    if(!validatePassword(data.password)) return false
    return checkPassword(data.username, data.password)
}

export async function deleteUser(username: string): Promise<boolean> {
    const user = await getRepository(User).findOne(username) 
    if(!user) return false
    getRepository(User).remove(user)
    return true
}