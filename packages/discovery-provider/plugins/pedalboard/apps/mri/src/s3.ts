import { S3Client, CreateBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { formatDate } from "./date"
import { readConfig } from "./config"
import { logger } from "./logger"
import { Logger } from "pino"

export type ClmS3Config = {
  s3: S3Client
  bucket: string
  keyPrefix: string
}

const config = readConfig()
const isDev = config.env === "dev"

// creates s3 instance objects for later use, if in dev it will automatically create buckets
export const createS3Instances = async (): Promise<ClmS3Config[]> => {
  try {
    return await Promise.all(config.s3Configs.map(async ({ bucket, keyPrefix, region, endpoint, accessKeyId, secretAccessKey }) => {
      const s3 = new S3Client({
        region,
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey
        },
        forcePathStyle: true
      })

      if (isDev) {
        const data = await s3.send(new CreateBucketCommand({ Bucket: bucket }));
        logger.info(`Bucket "${bucket}" created successfully`, data);
      }

      return {
        s3,
        bucket,
        keyPrefix
      }
    }))
  } catch (e) {
    if (isDev) return []
    throw e
  }
}

export const publishToS3 = async (logger: Logger, config: ClmS3Config, date: Date, csv: string): Promise<string> => {
  const { s3, keyPrefix, bucket } = config

  const key = `${keyPrefix}${formatDate(date)}.csv`
  const contentLength = Buffer.byteLength(csv, 'utf8')

  logger.info({ contentLength, key, bucket }, "uploading")

  if (contentLength === 0) {
    logger.info({}, "no content to publish, no file being uploaded")
    return ""
  }

  const uploadParams = {
    Bucket: bucket,
    Key: key,
    Body: csv,
    ContentType: "text/csv",
    ContentLength: contentLength
  }

  await s3.send(new PutObjectCommand(uploadParams))
  const objectUrl = `http://localhost:4566/${bucket}/${key}`
  return objectUrl
}
