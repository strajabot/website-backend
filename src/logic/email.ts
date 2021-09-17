import { getRepository } from "typeorm";
import { User } from "../database/entity/user";
import { v4 as uuid } from "uuid"

/**
 * Generates an 8 character code that is used to verify the user's 
 * email address   
 * @returns confirmation code
 */
 export function genEmailConfirmCode(): string {
    return uuid().slice(0, 8)
}

export async function changeEmail(username:string, email: string): Promise<boolean> {
    const user = await getRepository(User).findOne(username)
    if(!user) return false
    user.email = email
    user.emailConfirmCode = genEmailConfirmCode()
    user.emailIsConfirmed = false
    getRepository(User).save(user)
    return true;
}

export async function confirmEmail(username: string, confirmCode: string): Promise<boolean> {
    const user = await getRepository(User).findOne(username)
    if(!user) return false
    if(user.emailConfirmCode !== confirmCode) return false
    user.emailIsConfirmed = true;
    getRepository(User).save(user)
    return true
}