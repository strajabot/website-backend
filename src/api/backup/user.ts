import { Router } from "express"
import { logger } from "../../logger"
import { isAuthorized } from "../../logic/auth"
import { createDevice } from "../../logic/device"
import { changeEmail } from "../../logic/email"
import { changePassword } from "../../logic/password"
import { deleteUser, EmailAlreadyInUse, isRegistrationData, registerUser, UserAlreadyExists } from "../../logic/user"
import { validateDeviceName, validateEmail, validatePassword, validateUsername } from "../../util"

const router = Router()

router.post("/", (req, res) => {
    const data = req.body
    if(!isRegistrationData(data)) {
        res.status(400).json({ message: "Bad Request"})
        return
    }
    registerUser(data)
        .then(success => {
            if(!success) {
                res.status(500).json({ message: `Can't register user "${data.username}": Internal error` })
                return
            }
            logger.info(`Registered user ${data.username}`)
            res.status(200).json({ message: "Successfully registered user" }) 
        })
        .catch((err: any) => {
            if(err instanceof UserAlreadyExists) {
                res.status(400).json({ 
                    error: "UserAlreadyExists",
                    message: err.message,
                    username: err.username
                })
            } else if(err instanceof EmailAlreadyInUse) {
                res.status(400).json({
                    error: "EmailAlreafyInUse",
                    message: err.message,
                    username: err.username,
                    email: err.email
                })
            } else {
                res.status(500).json({ message: `Can't register user "${data.username}": Internal error` })
                logger.error(JSON.stringify(err))    
            }
        })
    
})

router.post("/:username/device", async (req, res) => {
    //Access token and device ID are generated server side 
    //to try and prevent path poinsoning attacks (null bytes, illegal chars, directory traversal)
    const username = req.params.username
    const deviceName = req.body.deviceName
    if(!validateUsername(username) || !validateDeviceName(deviceName)) {
        res.status(400).json({ message: "Bad Request" })
        return
    }
    if(!isAuthorized(username, req , res)) return
    const device = await createDevice(username, deviceName)
    if(!device) {
        res.status(400).json({ message: "Bad Request" })
        return
    }
    logger.info(`Added device "${deviceName}" for user "${username}"`)
    res.status(200).json({
        identifier: device.identifier,
        deviceName: device.deviceName,
        accessToken: device.accessToken,
        owner: username
    })
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