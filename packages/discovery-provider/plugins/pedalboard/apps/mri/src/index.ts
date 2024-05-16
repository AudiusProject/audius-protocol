import knex from "knex"
import { S3Client } from "@aws-sdk/client-s3"
import { logger } from "./logger"
import { CronJob } from "cron"
import { webServer } from "./server"
import { createBucket } from "./s3"
import { clm } from "./clm"

const main = async () => {
    logger.info({}, "good morning")

    const db = knex({
        client: 'pg',
        connection: process.env.audius_db_url || "postgresql://postgres:pass@0.0.0.0:5433/default_db"
    })

    const localstackS3 = new S3Client({
        region: "us-east-1",
        endpoint: "http://localhost:4566",
        credentials: {
            accessKeyId: "test",
            secretAccessKey: "test"
        },
        forcePathStyle: true
    })
    const localstackS3Config = {
        s3: localstackS3,
        bucket: "audius-clm-data",
        keyPrefix: "Audius_CLM_"
    }

    await createBucket(localstackS3Config.bucket)

    const s3s = [localstackS3Config]

    const job = CronJob.from({
        // run at 10 AM PST every day
        cronTime: '00 00 10 * * *',
        onTick: async function () {
            const date = new Date()
            await clm(db, s3s, date)
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
