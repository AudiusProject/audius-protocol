import express, { Application } from "express"
import { Knex } from "knex"
import { logger } from "./logger"
import { clm } from "./clm"
import { ClmS3Config } from "./s3"

export const webServer = (db: Knex, s3s: ClmS3Config[]): Application => {
    const app = express()
    
    app.get("/health_check", (_, res) => {
        res.send({
            status: "up"
        })
    })

    app.post("/record", async (req, res) => {
        try {
            const dateParam = req.query.date

            if (!dateParam) {
                return res.status(400).send('date query param required')
            }

            const exampleDate = "2024-05-14"
            const exampleDateLength = exampleDate.length
            if (dateParam.length !== exampleDateLength) {
                return res.status(400).send(`invalid date, must be formatted like '${exampleDate}'\n`)
            }

            // run all records as if they're from 10am that day
            const dateTimeString = `${dateParam}T10:00:00Z`

            const parsedDate = new Date(dateTimeString)
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).send('invalid date format');
            }

            await clm(db, s3s, parsedDate)

        } catch (e) {
            logger.error({ e }, "error in record request")
            return res.status(500).send()
        }
        return res.status(200).send()
    })

    app.post("/record_now", async (_, res) => {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1)
            await clm(db, s3s, yesterday)
        } catch (e) {
            logger.error({ e }, "error in record request")
            return res.status(500).send()
        }
        return res.status(200).send()
    })

    return app
}
