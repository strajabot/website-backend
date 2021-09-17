import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./user";

export interface IDevice {
    identifier: string
    deviceName: string
    accessToken: string
    owner: Promise<User>
}

@Entity()
export class Device implements IDevice {

    @PrimaryColumn({
        type: "uuid",
        nullable: false
    })
    identifier: string

    @Column({
        nullable: false, 
        length: 15
    })
    deviceName: string

    @Column({
        type: "uuid",
        nullable: false
    })
    accessToken: string

    @ManyToOne(
        () => User, 
        user => user.devices,
        {lazy: true})
    owner: Promise<User>

    
}