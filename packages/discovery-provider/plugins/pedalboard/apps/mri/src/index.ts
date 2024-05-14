import knex from "knex"
import { logger } from "./logger"
import { CronJob } from "cron"
import { reportMRIData } from "./report"
import { webServer } from "./server"

const main = async () => {
    logger.info({}, "good morning")

    const db = knex({
        client: 'pg',
        connection: process.env.audius_db_url || "postgresql://postgres:postgres@0.0.0.0:5432/discovery_provider_1"
    })

    const job = CronJob.from({
        // run at 10 AM PST every day
        cronTime: '00 00 10 * * *',
        onTick: async function () {
            const date = new Date()
            await reportMRIData(db, date)
        },
        timeZone: "America/Los_Angeles"
    })

    job.start()

    const server = webServer(db)
    const port = process.env.audius_mri_port || 6003
    server.listen(port, () => logger.info({ port }, "webserver is running"))
}

main().catch((err) => {
    logger.error({ err }, "mri crashed")
    process.exit(1)
})
