import {
  S3Client,
  CreateBucketCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'
import { readConfig } from './config'
import { logger } from './logger'
import { Logger } from 'pino'
import fs from 'fs'
import path from 'path'

export type S3Config = {
  s3: S3Client
  bucket: string
  keyPrefix: string
}

const config = readConfig()
const isDev = config.env === 'dev'

// creates s3 instance objects for later use, if in dev it will automatically create buckets
export const createS3Instances = async (): Promise<{
  clmS3s: S3Config[]
  udrS3s: S3Config[]
  mrvrS3s: S3Config[]
}> => {
  try {
    const clmS3s = await Promise.all(
      config.s3ClmConfigs.map(
        async ({
          bucket,
          keyPrefix,
          region,
          endpoint,
          accessKeyId,
          secretAccessKey
        }) => {
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
            const data = await s3.send(
              new CreateBucketCommand({ Bucket: bucket })
            )
            logger.info(`Bucket "${bucket}" created successfully`, data)
          }

          return {
            s3,
            bucket,
            keyPrefix
          }
        }
      )
    )
    const udrS3s = await Promise.all(
      config.s3UdrConfigs.map(
        async ({
          bucket,
          keyPrefix,
          region,
          endpoint,
          accessKeyId,
          secretAccessKey
        }) => {
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
            const data = await s3.send(
              new CreateBucketCommand({ Bucket: bucket })
            )
            logger.info(`Bucket "${bucket}" created successfully`, data)
          }

          return {
            s3,
            bucket,
            keyPrefix
          }
        }
      )
    )
    const mrvrS3s = await Promise.all(
      config.s3MrvrConfigs.map(
        async ({
          bucket,
          keyPrefix,
          region,
          endpoint,
          accessKeyId,
          secretAccessKey
        }) => {
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
            const data = await s3.send(
              new CreateBucketCommand({ Bucket: bucket })
            )
            logger.info(`Bucket "${bucket}" created successfully`, data)
          }

          return {
            s3,
            bucket,
            keyPrefix
          }
        }
      )
    )
    return { clmS3s, udrS3s, mrvrS3s }
  } catch (e) {
    if (isDev) return { clmS3s: [], udrS3s: [], mrvrS3s: [] }
    throw e
  }
}

export const publishToFile = (csv: string, fileName: string) => {
  const outputDir = path.join(process.cwd(), 'output')

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, `${fileName}.csv`)
  fs.writeFileSync(outputPath, csv)
  logger.info({ path: outputPath }, 'wrote file to output directory')
  return outputPath
}

const publishToS3 = async (
  logger: Logger,
  s3Config: S3Config,
  csv: string,
  fileName: string
): Promise<string> => {
  const { s3, keyPrefix, bucket } = s3Config

  const key = `${keyPrefix}${fileName}.csv`
  const contentLength = Buffer.byteLength(csv, 'utf8')

  logger.info({ contentLength, key, bucket }, 'uploading')

  if (contentLength === 0) {
    logger.info({}, 'no content to publish, no file being uploaded')
    return ''
  }

  const uploadParams = {
    Bucket: bucket,
    Key: key,
    Body: csv,
    ContentType: 'text/csv',
    ContentLength: contentLength
  }

  await s3.send(new PutObjectCommand(uploadParams))
  const objectUrl = `http://localhost:4566/${bucket}/${key}`
  return objectUrl
}

export const publish = async(
  logger: Logger,
  s3Configs: S3Config[],
  csv: string,
  fileName: string
): Promise<PromiseSettledResult<string>[] | string[]> => {
  console.log('publishing', typeof config.skipPublish, config.skipPublish)
  if (config.skipPublish) {
    const result = await publishToFile(csv, fileName)
    return [result]
  }
  const uploads = s3Configs.map((s3config) =>
    publishToS3(logger, s3config, csv, fileName)
  )
  const results = await Promise.allSettled(uploads)
  return results
}

