import express, { Application } from "express"
import { Knex } from "knex"
import { logger } from "./logger"
import { reportMRIData } from "./report"

export const webServer = (db: Knex): Application => {
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

            const dateTimeString = `${dateParam}T10:00:00Z`

            const parsedDate = new Date(dateTimeString)
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).send('invalid date format');
            }

            await reportMRIData(db, parsedDate)

        } catch (e) {
            logger.error({ e }, "error in record request")
            return res.status(500).send()
        }
        return res.status(200).send()
    })

    return app
}
