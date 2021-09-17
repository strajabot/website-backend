import { Router } from "express";

const router = Router()

router.get("/:deviceID/file/", (req, res) => {
    //todo: implement listing all files
})

router.get("/:deviceID/file/:fileUUID", (req, res) => {
    //todo: responds with the file
})

router.delete("/:deviceID/file/:fileUUID", (req, res) => {
    //todo: save files to 
})
