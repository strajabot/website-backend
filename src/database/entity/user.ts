import { Entity, PrimaryColumn, Column, OneToMany, Unique } from "typeorm"
import { Device } from "./device"

export interface IUser {
    username: string
    hash: string
    email: string
    emailConfirmCode: string
    emailIsConfirmed: boolean
    devices?: Promise<Device[]>
}

export enum UserConstraint {
    //uniqueUsername = "pk_user_username", -> unused - look at registerUser()
    uniqueEmail = "unique_user_email_constraint"
}

@Entity()
@Unique("unique_user_email_constraint", ["email"])
export class User implements IUser {

    @PrimaryColumn({
        type: "varchar",
        nullable: false,
        length: 31,
        unique: true
    })
    username: string

    @Column({
        nullable: false
    })
    hash: string

    @Column({
        nullable: false,
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