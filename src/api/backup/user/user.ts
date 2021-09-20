import { Router, Response } from "express"
import { Device, IDevice } from "../../../database/entity/device"
import { logger } from "../../../logger"
import { isAuthorized } from "../../../logic/auth"
import { createDevice } from "../../../logic/device"
import { changeEmail, confirmEmail } from "../../../logic/email"
import { changePassword } from "../../../logic/password"
import { BadRegistrationData, deleteUser, EmailAlreadyInUse, isRegistrationData, registerUser, UserAlreadyExists, UserNotExist } from "../../../logic/user"
import { validateDeviceName, validateEmail, validatePassword, validateUsername } from "../../../util"

const router = Router()

router.post("/", async (req, res) => {
    const data = req.body
    if(!isRegistrationData(data)) {
        resBadData()
        return
    }
    try {
        await registerUser(data)
    } catch(err) {
        if(err instanceof UserAlreadyExists) resUserConflict(err)
        else if(err instanceof EmailAlreadyInUse) resEmailConflict(data.username, err)
        else if(err instanceof BadRegistrationData) resBadData()
        else resInternalError(data.username)
        return
    }
    resSuccess(data.username)
    //responses
    function resSuccess(username: string):void  {
        res.status(200).json({ message: `Successfully registered user "${username}"`})
    }
    
    function resUserConflict(err: UserAlreadyExists): void {
        res.status(409).json({
            error: "UserAlreadyExist",
            message: `Can't register user "${err.username}": Username already in use`,
            username: err.username
        })
    }

    function resEmailConflict(username: string, err: EmailAlreadyInUse): void {
        res.status(409).json({
            error: "EmailAlreadyInUse",
            message: `Can't register user "${username}": Email "${err.email}" already in use`,
            usename: username,
            email: err.email
        })
    }

    function resBadData(): void {
        logger.warn(`Connection "${req.ip}" sent bad RegistrationData`)
        res.status(400).json({ 
            error: "BadRequest",
            message: "Couldn't register user: Bad Request"
        })
    }

    function resInternalError(username: string): void {
        res.status(500).json({
            error: "InternalError",
            message: `Can't register user "${username}": Internal error`,
            username: username
        })
    }
})

router.post("/:username/device", async (req, res) => {
    //Access token and device ID are generated server side 
    //to try and prevent path poinsoning attacks (null bytes, illegal chars, directory traversal)
    const username = req.params.username
    const deviceName = req.body.deviceName
    if(!validateUsername(username) || !validateDeviceName(deviceName)) return resBadData()
    if(!isAuthorized(username, req , res)) return
    let device: Device
    try {
        device = await createDevice(username, deviceName)
    } catch(err) {
        if(err instanceof UserNotExist) resUserNotExist(username, deviceName)
        else resInternalError(username, deviceName)
        return
    }
    resSuccess(username, device)
    //responses
    function resSuccess(username: string, device: IDevice) {
        logger.info(`Added device "${device.deviceName}" for user "${username}"`)
        res.status(200).json({
            identifier: device.identifier,
            deviceName: device.deviceName,
            accessToken: device.accessToken,
            owner: username
        })        
    }

    function resUserNotExist(username: string, deviceName: string): void {
        res.status(404).json({
            error: "UserNotExist",
            message: `Can't add "${deviceName} for user "${username}": User "${username}" doesn't exist`,
            username: username,
            deviceName: deviceName
        })
    }

    function resBadData(): void {
        res.status(400).json({ 
            error: "BadRequest",
            message: "Couldn't add device: Bad Request" 
        })
    }

    function resInternalError(username: string, deviceName: string): void {
        res.status(500).json({
            error: "InternalError",
            message: `Can't add "${deviceName}" for user "${username}": Internal error`,
            username: username,
            deviceName: deviceName
        })
    }

})

router.post("/:username/change_password", async (req, res) => {
    const username = req.params.username
    const password = req.body.password
    if(!validateUsername(username) || !validatePassword(password)) return resBadData()
    if(!isAuthorized(username, req, res)) return
    try {
        await changePassword(username, password)
    } catch(err) {
        if(err instanceof UserNotExist) resUserNotExist(username)
        else resInternalError(username)
        return
    }
    resSuccess(username)
    //responses
    function resSuccess(username: string): void {
        res.status(200).json({ message: `Successfully changed password of user "${username}"` }) 
    }
    
    function resUserNotExist(username: string): void {
        res.status(404).json({ 
            error: "UserNotExist",    
            message: `Couldn't change password of user "${username}": User "${username}" doesn't exist`,
            username: username
        })
    }

    function resBadData(): void {
        res.status(400).json({ 
            error: "BadRequest",
            message: "Couldn't change password: Bad Request" 
        })
    }

    function resInternalError(username: string): void {
        res.status(500).json({
            error: "InternalError",
            message: `Couldn't change password of user "${username}": Internal error`,
            username: username
        })
    }

})

router.post("/:username/email/change", async (req, res) => {
    const username = req.params.username
    const email = req.body.email
    if(!validateUsername(username) || !validateEmail(email)) return resBadData()
    if(!isAuthorized(username, req, res)) return
    try {
        await changeEmail(username, email)
    } catch(err) {
        if(err instanceof UserNotExist) resUserNotExist(username, email)
        else resInternalError(username, email)
        return
    }
    resSuccess(username, email)
    //responses
    function resSuccess(username: string, email: string): void {
        res.status(200).json({ message: `Successfully changed email of user "${username}" to "${email}"` })
    }

    function resUserNotExist(username: string, email: string): void {
        res.status(404).json({ 
            error: "UserNotExist",
            message: `Couldn't change email of user "${username}" to "${email}": User "${username}" doesn't exist`,
            username: username,
            email: email
        })    
    }
    
    function resBadData(): void {
        res.status(400).json({ 
            error: "BadRequest",
            message: "Couldn't change email: Bad Request" 
        })
    }

    function resInternalError(username: string, email: string): void {
        res.status(500).json({
            error: "InternalError",
            message: `Couldn't change email of user "${username}" to "${email}": Internal error"`,
            username: username,
            email: email
        })
    }

})

router.post("/:username/email/confirm", async (req, res) => {
    const username = req.params.username
    const code = req.body.confirmCode
    //todo: add confirm code validation
    if(!validateUsername(username)) return resBadData()
    if(!isAuthorized(username, req, res)) return
    let success: boolean
    try {
        success = await confirmEmail(username, code)
    } catch(err) {
        if(err instanceof UserNotExist) resUserNotExist(username)
        else resInternalError(username)
        return
    }
    if(success) resSuccess(username)
    else resBadConfirmCode(username)
    //responses
    function resSuccess(username: string): void {
        res.status(200).json({ message: `Successfully confirmed email of user "${username}"` })
    }

    function resUserNotExist(username: string): void {
        res.status(404).json({
            error: "UserNotExist", 
            message: `Couldn't confrm email of user "${username}": User "${username}" doesn't exist`,
            username: username
        })    
    }
    
    function resBadConfirmCode(username: string): void {
        res.status(400).json({
            error: "BadConfirmCode", 
            message: `Couldn't confirm email of user "${username}": Wrong confirmation code`,
            username: username
        })
    }

    function resBadData(): void {
        res.status(400).json({ 
            error: "BadRequest",
            message: "Couldn't confirm email: Bad Request" 
        })
    }

    function resInternalError(username: string): void {
        res.status(500).json({ 
            error: "InternalError",
            message: `Couldn't confirm email of user "${username}": Internal error"`,
            username: username
        })
    }

})



router.delete("/:username", async (req, res) => {
    const username = req.params.username
    if(!validateUsername(username)) return resBadData()
    if(!isAuthorized(username, req, res)) return
    try {
        await deleteUser(username)
    } catch(err) {
        if(err instanceof UserNotExist) resUserNotExist(username)
        else resInternalError(username)
        return
    }
    resSuccess(username)
    //responses
    function resSuccess(username: string): void {
        res.status(200).json({ message: `Successfully deleted user "${username}"`})
    }

    function resUserNotExist(username: string): void {
        res.status(404).json({ 
            error: "UserNotExist",
            message: `Couldn't delete user "${username}": User "${username}" doesn't exist`,
            username: username
        })
    }

    function resBadData(): void {
        res.status(400).json({
            error: "BadRequest",
            message: "Couldn't delete user: Bad request"
        })
    }

    function resInternalError(username: string): void {
        res.status(400).json({
            error: "InternalError",
            message: `Couldn't delete user "${username}": Internal error`,
            username: username
        })
    }

})

export { router }