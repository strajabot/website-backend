import { getRepository } from "typeorm";
import { User } from "../database/entity/user";
import { v4 as uuid } from "uuid"
import { UserNotExist } from "./user";
import { logger } from "../logger";
import { safeCompare } from "../util";

/**
 * Generates an 8 character code that is used to verify the user's 
 * email address.
 * @returns confirmation code
 */
 export function genEmailConfirmCode(): string {
    const dict = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code: string = ""
    for(let i=0;i<8;i++) {
        const k = Math.floor(Math.random() * dict.length)
        code += dict.charAt(k)
    }
    return code
}


/**
 * Changes the email address of user.
 * @param username The user
 * @param email New email address
 * @throws {UserNotExist} User doesn't exist in the database
 */
export async function changeEmail(username:string, email: string): Promise<void> {
    const user = await getRepository(User).findOne(username)
    if(!user) throw new UserNotExist(username)
    user.email = email
    user.emailConfirmCode = genEmailConfirmCode()
    user.emailIsConfirmed = false
    getRepository(User).save(user)
    logger.info(`User "${username}" changed email address`)
}

/** 
 * Used to confirm email address of a user.
 * @param username The user 
 * @param confirmCode Confirmation code 
 * @returns true if code is correct
 * @throws {UserNotExist} User doesn't exist in the database 
 */
export async function confirmEmail(username: string, confirmCode: string): Promise<boolean> {
    const user = await getRepository(User).findOne(username)
    if(!user) throw new UserNotExist(username)
    if(!safeCompare(confirmCode, user.emailConfirmCode)) return false
    user.emailIsConfirmed = true;
    getRepository(User).save(user)
    logger.info(`User "${username}" confirmed their email address`)
    return true
}