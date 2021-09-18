import { Router, Response } from "express"
import { IDevice } from "../../../database/entity/device"
import { logger } from "../../../logger"
import { isAuthorized } from "../../../logic/auth"
import { createDevice } from "../../../logic/device"
import { changeEmail } from "../../../logic/email"
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
        resSuccess(data.username)
    } catch(err) {
        if(err instanceof UserAlreadyExists) resUserConflict(err)
        else if(err instanceof EmailAlreadyInUse) resEmailConflict(data.username, err)
        else if(err instanceof BadRegistrationData) resBadData()
        else resInternalError(data.username)
    }
    //respond on success
    function resSuccess(username: string):void  {
        res.send(200).json({ message: `Successfully registered user "${username}"`})
    }
    //respond based on error thrown by registerUser()
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
        res.status(400).json({ message: "Bad Request"})
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
    try {
        const device = await createDevice(username, deviceName)
        resSuccess(username, device)
    } catch(err) {
        if(err instanceof UserNotExist) resUserNotExist(username, deviceName)
        else resInternalError(username, deviceName)
    }
    
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
        res.status(400).json({ message: "Bad Request" })
    }

    function resInternalError(username: string, deviceName: string): void {
        res.status(500).json({
            error: "InternalError",
            message: `Can't add "${deviceName}" for user "${username}": Internal error`,
            username: username
        })
    }

})

router.post("/:username/change_password", async (req, res) => {
    const username = req.params.username
    const password = req.body.password
    if(!validateUsername(username) || !validatePassword(password)) {
        res.status(400).json({ message: "Bad request." })
        return
    }
    if(!isAuthorized(username, req, res)) return
    const success = await changePassword(username, password)
    if(!success) {
        res.status(400).json({ message: "Couldn't change password of user" })
        return
    }
    logger.info(`User "${username}" changed password`)
    res.status(200).json({ message: "Successfully changed password of user" }) 
})

router.post("/:username/change_email", async (req, res) => {
    const username = req.params.username
    const email = req.body.email
    if(!validateUsername(username) || !validateEmail(email)) {
        res.status(400).json({ message: "Bad request." })
        return
    }
    if(!isAuthorized(username, req, res)) return
    const success = await changeEmail(username, email)
    if(!success) {
        res.status(400).json({ message: "Couldn't change email of user" })
        return
    }
    logger.info(`User "${username}" changed email address`)
    res.status(200).json({ message: "Successfully changed email of user" })    
})


router.delete("/:username", async (req, res) => {
    const username = req.params.username
    if(!validateUsername) {
        res.status(400).json({ message: "Bad Request" })
        return
    }
    if(!isAuthorized(username, req, res)) return
    const success = await deleteUser(username)
    if(!success) {
        res.status(400).json({ message: "Couldn't delete user" })
        return
    }
    logger.info(`Delted user "${username}"`)
    res.status(200).json({ message: "Successfully deleted user" })    
})

export { router }