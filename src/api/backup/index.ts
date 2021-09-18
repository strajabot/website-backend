import { Router } from "express"
import { router as deviceRouter } from "./device/device"
import { router as userRouter } from "./user/user"
import { router as authRouter } from "./authentication"

const router = Router()

router.use("/device/", deviceRouter)
router.use("/user/", userRouter)
router.use("/", authRouter)

export { router }