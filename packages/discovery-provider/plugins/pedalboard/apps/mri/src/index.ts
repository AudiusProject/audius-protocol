import knex from "knex"
import { logger } from "./logger"
import { CronJob } from "cron"
import { webServer } from "./server"
import { createS3Instances } from "./s3"
import { clm } from "./clm"
import { readConfig } from "./config"

const main = async () => {
    logger.info({}, "good morning")

    const config = readConfig()

    const db = knex({
        client: 'pg',
        connection: config.dbUrl
    })

    const s3s = await createS3Instances()

    const job = CronJob.from({
        // run at 10 AM PST every day
        cronTime: '00 00 10 * * *',
        onTick: async function () {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1)
            await clm(db, s3s, yesterday)
        },
        timeZone: "America/Los_Angeles"
    })

    job.start()

    const server = webServer(db, s3s)
    const port = process.env.audius_mri_port || 6003
    server.listen(port, () => logger.info({ port }, "webserver is running"))
}

main().catch((err) => {
    logger.error({ err }, "mri crashed")
    process.exit(1)
})
