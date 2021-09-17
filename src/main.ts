import "reflect-metadata"
import express from "express"
import expressSession from "express-session"
import redis from "redis"
import connectRedis from "connect-redis"
import chalk from "chalk";
import { router as apiRouter } from "./api"
import { customSFTP } from "./sftp/sftpServer"
import { createConnection } from "typeorm"
import { logger } from "./logger"

const oneDay = 1000 * 60 * 60 * 24;

const app = express();

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "3306"),
    password: process.env.REDIS_PASSWORD || "admin",
})

const RedisStore = connectRedis(expressSession)

createConnection()
    .then(() => {
        logger.info("Successfully connected to the database")
    })
    .catch(err => {
        logger.error(`Couldn't connect to Database: \n${err}`)
    })

if(!process.env.SESSION_SECRET) console.log(chalk.bold.red + "WARN: ENVIRONMENT VARIABLE \"SESSION_SECRET\" NOT SPECIFIED")

app.use(express.json({type: "application/json"}))
app.use(expressSession({
    secret: process.env.SESSION_SECRET || "secret",
    cookie: { maxAge: oneDay },
    store: new RedisStore({
        client: redisClient,
        prefix: "session"
    }),
}))

app.use("/api/", apiRouter)

app.get("/", (req, res) => {
    res.status(200).json("BACKEND IS UP")
})

customSFTP.listen(parseInt(process.env.SFTP_PORT || "22"), "0.0.0.0", () => {
    logger.info("SFTP server started")
})

app.listen(parseInt(process.env.EXPRESS_PORT || "80"), () => {
    logger.info("Express server started")
})