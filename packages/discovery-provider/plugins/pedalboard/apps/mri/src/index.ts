import knex from "knex"
import { logger } from "./logger"
import { CronJob } from "cron"
import { reportMRIData } from "./reports/clientLabelMetadata"
import { webServer } from "./server"
import { createBucket, listBuckets } from "./s3"

const main = async () => {
    logger.info({}, "good morning")

    const db = knex({
        client: 'pg',
        connection: process.env.audius_db_url || "postgresql://postgres:pass@0.0.0.0:5433/default_db"
    })

    await createBucket("test-bucket")
    const buckets = await listBuckets()

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
