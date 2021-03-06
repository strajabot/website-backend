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


describe("Device name validator", () => {
    test("Should return true for valid device name", () => {
        expect(validateDeviceName("phone")).toBe(true)
        expect(validateDeviceName("PHONE")).toBe(true)
        expect(validateDeviceName("Phone 1")).toBe(true)
    })

    test("Should return false is device name shorter than 3 chars", () => {
        expect(validateDeviceName("ab")).toBe(false)
    })

    test("Should return fale if device name longer than 15 chars", () => {
        expect(validateDeviceName("0123456789abcdef")).toBe(false)
    })

    test("Should return false is device name contains special chars", () => {
        expect(validateDeviceName("Phone -")).toBe(false)
        expect(validateDeviceName("Phone _")).toBe(false)
        expect(validateDeviceName("Phone !")).toBe(false)
        expect(validateDeviceName("Phone @")).toBe(false)
        expect(validateDeviceName("Phone $")).toBe(false)
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

describe("Safe path joining", () => {
    test("Should return the joined path if tehre are no exploits detected", () => {
        expect(safePathJoin("/usr/data/", "user1/mydata/")).toBe("/usr/data/user1/mydata/")
    })

    test("Should return null if null bytes are inside the string", () => {
        expect(safePathJoin("/usr/data/", "user1/\0mydata/")).toBe(null)
    })

    test("Should return null if dissallowed characters are included", () => {
        expect(safePathJoin("/usr/data/", "user1$/mydata/")).toBe(null)
    })

    test("Should return null if directory traversal is attempted", () => {
        expect(safePathJoin("/usr/data/", "../pwd/pwd.txt")).toBe(null)
    })
})
