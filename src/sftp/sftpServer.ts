import fs from "fs"
import { promisify } from "util"
import { Server, SFTP_OPEN_MODE as OPEN_MODE, SFTP_STATUS_CODE as STATUS_CODE } from "ssh2"
import { SFTPStream } from "ssh2-streams"
import { checkAccessToken } from "../logic/device"
import { validate as validateUUID } from "uuid"
import { safePathJoin } from "../util"

const storage = "./storage/"

const openFile = promisify(fs.open)
const write = promisify(fs.write)
const read = promisify(fs.read)
const close = promisify(fs.close)



const customSFTP = new Server({
    hostKeys: [fs.readFileSync(process.env.SSH_PRIVATE_KEY || "")]
}, function(client) {
    console.log("Client connected!");
    let deviceID: string

    client.on("authentication", async (ctx) => {
        if (ctx.method !== 'password'){
            ctx.reject(["password"])
            return
        }
        deviceID = ctx.username
        const accessToken = ctx.password
        if(!validateUUID(deviceID) || !validateUUID(accessToken)) {
            ctx.reject()
            return
        }
        if(!await checkAccessToken(deviceID, accessToken)) {
            ctx.reject()
            return
        }
        ctx.accept()
    }).on("ready", () => {
        console.log(`Authenticated device: ${deviceID}`)
        client.on("session", accept => {
            const session = accept()
            session.on("sftp", accept => {
                console.log("Client SFTP session")
                const userStorage = safePathJoin(storage, deviceID)
                if(!userStorage) return
                const openedFiles: Set<number> = new Set()
                const sftpStream = accept()
                sftpStream
                .on("OPEN", async (requestID: number, filename: string, rawFlags: number) => {
                    const filePath = safePathJoin(userStorage, filename)
                    if(!filePath) return sftpStream.status(requestID, STATUS_CODE.FAILURE)
                    const fd = await openFile(filePath, SFTPStream.flagsToString(rawFlags))
                    const handle = Buffer.alloc(4)
                    handle.writeUInt32BE(fd)
                    //keep track of file desciptors created by this user to prevent potential exploits?
                    openedFiles.add(fd)
                    sftpStream.handle(requestID, handle)
                })
                .on("WRITE", async (requestID: number, handle: Buffer, offset: number, data: Buffer) => {
                    if(handle.length !== 4) return sftpStream.status(requestID, STATUS_CODE.FAILURE)
                    const fd = handle.readUInt32BE()
                    if(!openedFiles.has(fd)) return sftpStream.status(requestID, STATUS_CODE.FAILURE)
                    write(fd, data, offset)
                    //fixme: add error handling here
                    sftpStream.status(requestID, STATUS_CODE.OK)
                })
                .on("READ", async (requestID: number, handle: Buffer, offset: number, length: number) => {
                    if(handle.length !== 4) return sftpStream.status(requestID, STATUS_CODE.FAILURE)
                    const fd = handle.readUInt32BE()
                    if(!openedFiles.has(fd)) return sftpStream.status(requestID, STATUS_CODE.FAILURE)
                    const { bytesRead, buffer } = await read(fd, Buffer.alloc(length), 0, length, offset)
                    if(bytesRead === length) return sftpStream.data(requestID, buffer)
                    sftpStream.data(requestID, buffer.slice(0, bytesRead))
                })
                .on("CLOSE", async (requestID: number, handle: Buffer) => {
                    if(handle.length !== 4) return sftpStream.status(requestID, STATUS_CODE.FAILURE)
                    const fd = handle.readUInt32BE()
                    if(!openedFiles.has(fd)) return sftpStream.status(requestID, STATUS_CODE.FAILURE)
                    close(fd)
                    openedFiles.delete(fd)
                    sftpStream.status(requestID, STATUS_CODE.OK)
                })
            })
        })
    }).on("end", () => {
        console.log("Client disconnected")
    })
})

export { customSFTP }