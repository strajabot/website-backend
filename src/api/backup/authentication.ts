import { Router } from "express"
import { isLoginData, loginUser } from "../../logic/user"
import { authorize, unauthorize } from "../../logic/auth"

const router = Router()

router.post("/login/", async (req, res) => {
    const data = req.body
    if(!isLoginData(data)) {
        res.status(400).json({ message: "400 Bad Request"})
        return
    }
    const success = await loginUser(data)
    if(!success) {
        res.status(400).json({ message: "Authentication failed." })
        return
    }
    authorize(data.username, req)
    res.status(200).json({ message: "Successfully authenticated" })
})

router.post("/logout/", (req, res) => {
    unauthorize(req)
    res.status(200).json({ message: "Successfully logged out"} )
})

export { router }