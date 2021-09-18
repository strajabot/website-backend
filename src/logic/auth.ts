import chalk from "chalk";
import express from "express"

//inject username into session data
declare module 'express-session' {
    interface SessionData {
        username: string | null;
    }
}

export function isAuthorized(username: string, req: express.Request, res: express.Response): boolean {
    if(!req.session.username) {
        res.status(401).json({ message: "Unauthorized" })
        return false
    }
    if(req.session.username === username) return true
    res.status(403).json({ message: "Forbidden" })
    return false;
}

export function authorize(username: string, req: express.Request): void {
    req.session.username = username
}

export function unauthorize(req: express.Request): void {
    req.session.username = null
}

