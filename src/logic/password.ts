import { getRepository } from "typeorm";
import { User } from "../database/entity/user";
import bcrypt from "bcrypt"

export async function hashPassword(password: string): Promise<string> {
    //https://security.stackexchange.com/questions/17207/recommended-of-rounds-for-bcrypt
    //apparently 8 is good
    return bcrypt.hash(password, 8)
}

export async function checkPassword(username: string, password: string): Promise<boolean> {
    const user = await getRepository(User).findOne(username)
    if(!user) return false
    return bcrypt.compare(password, user.hash)
}

export async function changePassword(username: string, password: string): Promise<boolean> {
    const user = await getRepository(User).findOne(username)
    if(!user) return false
    user.hash = await hashPassword(password)
    getRepository(User).save(user)
    return true;
}
