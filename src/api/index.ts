import { Router } from "express"
import { router as backupRouter } from "./backup"

const router = Router()

router.use("/backup", backupRouter)

export { router }

