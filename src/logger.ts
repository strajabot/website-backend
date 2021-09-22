import { createLogger, addColors, format, transports } from "winston"
const { combine,  timestamp, printf, colorize} =  format


const logFormat = printf(({level, message, timestamp}) => {
    return `[${timestamp}][${level}]: ${message}`
})

//don't log debug in prod to avoid leaking user data :)
//we default to running in prod if unspecified to prevent forgeting to set the environment
const runningInProd =  (process.env.NODE_ENV !== "dev")  
let logLevel = process.env.LOG_LEVEL
if(!logLevel) logLevel = "info"
if(logLevel === "debug" && runningInProd) logLevel = "verbose"

const logger  = createLogger({
    format: combine(
        timestamp(),
        colorize(),
        logFormat
    ),
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        verbose: 3,
        debug: 4
    },
    transports: [ new transports.Console({ level: logLevel }) ]
})

addColors({
    error: "red",
    warn: "yellow",
    info: "white",
    verbose: "white",
    debug: "white"
})

export { logger }