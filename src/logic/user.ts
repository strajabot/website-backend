import { genEmailConfirmCode} from "./email"
import { validateEmail, validatePassword , validateUsername } from "../util";
import { User, UserConstraint } from "../database/entity/user"
import { checkPassword, hashPassword } from "./password";
import { getRepository, QueryFailedError } from "typeorm";
import { logger } from "../logger";

export interface IRegistrationData {
    username: string
    password: string
    email: string
}

export class UserAlreadyExists extends Error {
    
    public readonly username: string
    
    constructor(username: string) {
        super(`User "${username}" already exists`)        
        Object.setPrototypeOf(this, new.target.prototype);

        this.username = username
    }
}

export class UserNotExist extends Error {
    
    public readonly username: string

    constructor(username: string) {
        super(`User "${username}" doesn't exist`)
        Object.setPrototypeOf(this, new.target.prototype)

        this.username = username
    }
}

export class EmailAlreadyInUse extends Error {

    public readonly email: string
    
    constructor(email: string) {
        super(`Email "${email}" is already in use`)
        Object.setPrototypeOf(this, new.target.prototype)

        this.email = email
    }

}

export class BadRegistrationData extends Error {
    constructor() {
        super("Registration data is malformed")
        Object.setPrototypeOf(this, new.target.prototype)
    }
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

/**
 * Registers a new user in the database
 * @param data Data used to register the user
 * @throws {BadRegistrationData} Provided data is malformeds
 * @throws {UserAlreadyExist} User with the provided username already exists
 * @throws {EmailAlreadyInUse} Provided email is already in use
 */
export async function registerUser(data: IRegistrationData): Promise<void> {
    if(!validateUsername(data.username)
            || !validateEmail(data.email)
            || !validatePassword(data.password)) {
        throw new BadRegistrationData()
    }
    
    //we can't parse the duplicate primary key error in the insert()  
    //because we don't know what the primary key constraint is and
    //there seems to be no way to set it in TypeORM. :( 
    //todo: find a way to avoid the findOne() call 
    const dbUser = await getRepository(User).findOne(data.username)
    if(dbUser) throw new UserAlreadyExists(data.username)

    const user: User = new User()
    user.username = data.username;
    user.email = data.email
    user.emailConfirmCode = genEmailConfirmCode()
    user.emailIsConfirmed = false
    user.hash = await hashPassword(data.password)
    
    try {
        await getRepository(User).insert(user)
        logger.info(`Successfully registered user "${data.username}"`)
    } catch(err: any){
        if(err instanceof QueryFailedError) {
            const constraint = err.driverError.constraint
            if(constraint === UserConstraint.uniqueEmail) throw new EmailAlreadyInUse(data.email)
        }
        logger.error(`Can't register user "${data.username}": \n${JSON.stringify(err)}`)
        throw err
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

export async function deleteUser(username: string): Promise<void> {
    const user = await getRepository(User).findOne(username) 
    if(!user) throw new UserNotExist(username)
    getRepository(User).remove(user)
    logger.info(`Delted user "${username}"`)
}