import { getRepository } from "typeorm"
import { v4 as uuid } from "uuid"
import { Device } from "../database/entity/device"
import { User } from "../database/entity/user"
import { safeCompare } from "../util"

export async function createDevice(username: string, deviceName: string): Promise<Device|null> {
    const user = await getRepository(User).findOne(username)
    if(!user) return null
    
    const device = new Device()
    device.identifier = uuid()
    device.deviceName = deviceName
    device.accessToken = uuid()
    device.owner = Promise.resolve(user)

    const userDevices = await user.devices
    userDevices.push(device)
    user.devices = Promise.resolve(userDevices)
    
    getRepository(User).save(user)
    return device
}

export async function checkAccessToken(identifier: string, accessToken: string): Promise<boolean> {
    const device = await getRepository(Device).findOne(identifier)
    if(!device) return false
    return safeCompare(accessToken, device.accessToken)
}

export async function changeAccessToken(identifier: string): Promise<string|null> {
    const device = await getRepository(Device).findOne(identifier)
    if(!device) return null
    device.accessToken = uuid()
    getRepository(Device).save(device)
    return device.accessToken
}

export async function removeDevice(identifier: string): Promise<boolean> {
    const device = await getRepository(Device).findOne(identifier)
    if(!device) return false
    getRepository(Device).remove(device)
    return true
}