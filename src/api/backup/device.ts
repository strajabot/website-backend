import { Router } from "express";
import { changeAccessToken, createDevice } from "../../logic/device"
import { validate as validateUUID } from "uuid"
const router = Router()


router.post('/:deviceID/change_accesstoken', async (req, res) => {
    const identifier = req.params.deviceID
    if(!validateUUID(identifier)) {
        res.status(400).json({ message: "Bad Request" })
        return
    }
    const accessToken = changeAccessToken(identifier)
    if(!accessToken) {
        res.status(400).json({ message: "Bad Request" })
        return    
    }
    res.status(200).json({ accessToken: accessToken })
})

export { router };