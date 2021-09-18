import { getRepository } from "typeorm";
import { User } from "../database/entity/user";
import { v4 as uuid } from "uuid"
import { UserNotExist } from "./user";
import { logger } from "../logger";
import { safeCompare } from "../util";

/**
 * Generates an 8 character code that is used to verify the user's 
 * email address   
 * @returns confirmation code
 */
 export function genEmailConfirmCode(): string {
    return uuid().slice(0, 8)
}

export async function changeEmail(username:string, email: string): Promise<void> {
    const user = await getRepository(User).findOne(username)
    if(!user) throw new UserNotExist(username)
    user.email = email
    user.emailConfirmCode = genEmailConfirmCode()
    user.emailIsConfirmed = false
    getRepository(User).save(user)
    logger.info(`User "${username}" changed email address`)
}

export async function confirmEmail(username: string, confirmCode: string): Promise<boolean> {
    const user = await getRepository(User).findOne(username)
    if(!user) throw new UserNotExist(username)
    if(!safeCompare(confirmCode, user.emailConfirmCode)) return false
    user.emailIsConfirmed = true;
    getRepository(User).save(user)
    logger.info(`User "${username}" confirmed their email address`)
    return true
}