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

export const publishToFile = (csv: string, fileName: string) => {
  const outputPath = path.join(process.cwd(), 'output', fileName)
  const outputDir = path.dirname(outputPath)

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, csv)
  logger.info({ path: outputPath }, 'wrote file to output directory')
  return outputPath
}

const publishToS3 = async (
  logger: Logger,
  csv: string,
  fileName: string
): Promise<string[]> => {
  const results = []

  for (const prefix of ['mri_s3', 'mri_s3_debug']) {
    const s3config = dialS3(prefix)
    if (!s3config) {
      logger.info(
        { prefix },
        'skipping S3 publish: incomplete s3 config for prefix'
      )
      continue
    }

    const { client, bucket } = s3config

    const key = fileName
    const contentLength = Buffer.byteLength(csv, 'utf8')

    logger.info({ contentLength, key, bucket }, 'uploading')

    if (contentLength === 0) {
      logger.info({}, 'no content to publish, no file being uploaded')
      return ['']
    }

    const uploadParams = {
      Bucket: bucket,
      Key: key,
      Body: csv,
      ContentType: 'text/csv',
      ContentLength: contentLength
    }

    await client.send(new PutObjectCommand(uploadParams))
    const objectUrl = `http://localhost:4566/${bucket}/${key}`
    results.push(objectUrl)
  }

  return results
}

const dialS3 = (prefix: string) => {
  const endpoint = process.env[`${prefix}_endpoint`]
  const region = process.env[`${prefix}_region`]
  const accessKeyId = process.env[`${prefix}_access_key_id`]
  const secretAccessKey = process.env[`${prefix}_secret_access_key`]
  const bucket = process.env[`${prefix}_bucket`]
  if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
    return
  }
  const client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    forcePathStyle: true
  })
  return { client, bucket }
}

export const publish = async (
  logger: Logger,
  csv: string,
  fileName: string
) => {
  console.log('publishing', typeof config.skipPublish, config.skipPublish)
  if (config.skipPublish) {
    const result = await publishToFile(csv, fileName)
    return [result]
  }
  const results = await publishToS3(logger, csv, fileName)
  return results
}
