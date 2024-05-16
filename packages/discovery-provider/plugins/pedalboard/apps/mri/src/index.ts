import knex from "knex"
import { S3Client } from "@aws-sdk/client-s3"
import { logger } from "./logger"
import { CronJob } from "cron"
import { webServer } from "./server"
import { createBucket, listBuckets } from "./s3"
import { clm } from "./clm"

const main = async () => {
    logger.info({}, "good morning")

    const db = knex({
        client: 'pg',
        connection: process.env.audius_db_url || "postgresql://postgres:pass@0.0.0.0:5433/default_db"
    })

    const s3 = new S3Client({
        region: "us-east-1",
        endpoint: "http://localhost:4566",
        credentials: {
            accessKeyId: "test",
            secretAccessKey: "test"
        },
        forcePathStyle: true
    })

    await createBucket("audius-clm-data")

    const job = CronJob.from({
        // run at 10 AM PST every day
        cronTime: '00 00 10 * * *',
        onTick: async function () {
            const date = new Date()
            await clm(db, s3, date)
        },
        timeZone: "America/Los_Angeles"
    })

    job.start()

    const server = webServer(db, s3)
    const port = process.env.audius_mri_port || 6003
    server.listen(port, () => logger.info({ port }, "webserver is running"))
}

main().catch((err) => {
    logger.error({ err }, "mri crashed")
    process.exit(1)
})
