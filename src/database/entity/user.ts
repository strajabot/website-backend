import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm"
import { Device } from "./device"

export interface IUser {
    username: string
    hash: string
    email: string
    emailConfirmCode: string
    emailIsConfirmed: boolean
    devices?: Promise<Device[]>
}

@Entity()
export class User implements IUser {
    
    @PrimaryColumn({
        type: "varchar",
        nullable: false,
        unique: true,
        length: 31,
    })
    username: string

    @Column({
        nullable: false
    })
    hash: string

    @Column({
        nullable: false,
        unique: true
    })
    email: string
    
    @Column({
        nullable: false,
        length: 8
    })
    emailConfirmCode: string

    @Column({
        nullable: false
    })
    emailIsConfirmed: boolean

    @OneToMany(
        () => Device, 
        device => device.owner, 
        {
            lazy: true,
            cascade: true
        })
    devices: Promise<Device[]>

}