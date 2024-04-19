import {
  GetObjectCommand,
  ListObjectsCommand,
  S3Client,
  S3ClientConfig
} from '@aws-sdk/client-s3'
import { mkdir, stat } from 'fs/promises'
import { dirname, join } from 'path'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { parseDelivery } from './parseDelivery'

function dialS3() {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error(`AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY required`)
  }
  const config: S3ClientConfig = {
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
    // region: process.env.AWS_REGION
  }
  if (process.env.AWS_ENDPOINT) {
    config.endpoint = process.env.AWS_ENDPOINT
    config.forcePathStyle = true
  }
  return new S3Client(config)
}

export async function startPoller() {
  while (true) {
    console.log('polling s3...')
    await pollS3()
    await sleep(5_000)
  }
}

export async function pollS3() {
  const client = dialS3()
  const bucket = process.env.AWS_BUCKET_RAW
  if (!bucket) {
    throw new Error(`process.env.AWS_BUCKET_RAW is required`)
  }

  // list top level prefixes
  const result = await client.send(
    new ListObjectsCommand({
      Bucket: bucket,
      Delimiter: '/'
    })
  )
  const prefixes = result.CommonPrefixes?.map((p) => p.Prefix) as string[]

  for (const prefix of prefixes) {
    // todo: skip dir if we did it already (track state in the sqlite)
    const key = join(bucket, prefix)

    const localDir = await syncToLocalFs(client, prefix)
    if (localDir) {
      console.log('........ processing', localDir)
      await parseDelivery(localDir)
    }
  }
}

async function syncToLocalFs(client: S3Client, prefix: string) {
  const localDirectory = 's3stuff'

  const result = await client.send(
    new ListObjectsCommand({
      Bucket: process.env.AWS_BUCKET_RAW,
      Prefix: prefix
    })
  )
  if (!result.Contents?.length) {
    return
  }

  // for each key under prefix, download to local dir
  await Promise.all(
    result.Contents.map(async (c) => {
      if (!c.Key) return

      const destinationPath = join(localDirectory, c.Key)

      // skip if already have
      const exists = await fileExists(destinationPath)
      if (exists) {
        console.log('exists locally...', destinationPath)
        return
      }

      // ensure parent dir
      await mkdir(dirname(destinationPath), { recursive: true })

      // get it
      const { Body } = await client.send(
        new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_RAW,
          Key: c.Key
        })
      )
      const fileStream = createWriteStream(destinationPath)
      const readableStream = Readable.from(Body as any)
      readableStream.pipe(fileStream)
      console.log('downloaded to', destinationPath)
    })
  )

  return join(localDirectory, prefix)
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fileExists(path: string) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}
