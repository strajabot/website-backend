import exp from 'constants'
import { validate } from 'uuid'
import { validateEmail, validateUsername, validateDeviceName, validatePassword, safeCompare, safePathJoin } from '../util'

describe("Email address validator", () => {
    test("Should return true for valid email address", () => {
        expect(validateEmail("example@gmail.com")).toBe(true)
    })
      
    test("Should return false for invalid email address", () => {
        expect(validateEmail("www.example.com")).toBe(false)
    })
})

describe("Username validator", () => {
    test("Should return true for valid username", () => {
        expect(validateUsername("username")).toBe(true)
        expect(validateUsername("user1234567890")).toBe(true)
        expect(validateUsername("username_")).toBe(true)
        expect(validateUsername("USERNAME")).toBe(true)
    })

    test("Should return false if username shorther than 3 chars", () => {
        expect(validateUsername("no")).toBe(false)
    })

    test("Should return false if username longer than 31 chars", () => {
        expect(validateUsername("usernameusernameusernameusername")).toBe(false)
    })
    
    test("Should return false if username contain special chars other than underscore", () => {
        expect(validateUsername("username-")).toBe(false)
        expect(validateUsername("username!")).toBe(false)
        expect(validateUsername("username@")).toBe(false)
        expect(validateUsername("username$")).toBe(false)
    })
})

describe("Password validator", () => {
    test("Should return true for a valid password", () => {
        expect(validatePassword("Password_1")).toBe(true)
    })

    test("Should return false if there aren't any digits", () => {
        expect(validatePassword("Password_")).toBe(false)
    })

    test("Should return false if there aren't any lowercase characters", () => {
        expect(validatePassword("PASSWORD_1")).toBe(false)
    })

    test("Should return false if there aren't any uppercase characters", () => {
        expect(validatePassword("password_1")).toBe(false)
    })

    test("Should return false if ther aren't any special characthers", () => {
        expect(validatePassword("Password1")).toBe(false)
    })

    test("Should return false if password is shorter than 8 chars", () => {
        expect(validatePassword("Pwd_1")).toBe(false)
    })

    test("Should return false if password is longer than 31 characters", () => {
        expect(validatePassword("PasswordPasswordPasswordPasswo_1"))
    })
})

describe("Timing attack safe string comparasion", () => {
    test("Should return true if string are the same", () => { 
        expect(safeCompare("string1", "string1")).toBe(true)
    })

    test("Should return false if strings aren't the same length", () => {
        expect(safeCompare("str1", "string1")).toBe(false)
    })

    test("Should return false if strings are the same length but not equal", () => { 
        expect(safeCompare("string1", "string2")).toBe(false)
    })
})

