import {
  GetObjectCommand,
  ListObjectsCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3'
import { fromIni } from '@aws-sdk/credential-provider-ini'
import { join } from 'path'
import { s3markerRepo } from './db'
import { parseDdexXml } from './parseDelivery'

export function dialS3() {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error(`AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY required`)
  }

  const config: S3ClientConfig = {
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    // region: process.env.AWS_REGION
  }
  if (process.env.AWS_ENDPOINT) {
    config.endpoint = process.env.AWS_ENDPOINT
    config.forcePathStyle = true
  }
  return new S3Client(config)
}

export function dialS3FromCredentials() {
  const s3Client = new S3Client({
    region: 'us-east-1',
    credentials: fromIni({ profile: 'local' }),
  })
  return s3Client
}

export async function startPoller() {
  while (true) {
    console.log('polling s3...')
    await pollS3()
    await sleep(5_000)
  }
}

export async function pollS3(reset?: boolean) {
  const client = dialS3()

  const bucket = process.env.AWS_BUCKET_RAW
  if (!bucket) {
    throw new Error(`process.env.AWS_BUCKET_RAW is required`)
  }

  let Marker = ''

  // load prior marker
  if (!reset) {
    Marker = s3markerRepo.get(bucket)
  }

  // list top level prefixes after marker
  const result = await client.send(
    new ListObjectsCommand({
      Bucket: bucket,
      Delimiter: '/',
      Marker,
    })
  )
  const prefixes = result.CommonPrefixes?.map((p) => p.Prefix) as string[]
  if (!prefixes) {
    return
  }

  for (const prefix of prefixes) {
    await scanS3Prefix(client, bucket, prefix)
    Marker = prefix
  }

  // save marker
  if (Marker) {
    console.log('update marker', { bucket, Marker })
    s3markerRepo.upsert(bucket, Marker)
  }
}

async function scanS3Prefix(client: S3Client, bucket: string, prefix: string) {
  const result = await client.send(
    new ListObjectsCommand({
      Bucket: bucket,
      Prefix: prefix,
    })
  )
  if (!result.Contents?.length) {
    return
  }

  await Promise.all(
    result.Contents.map(async (c) => {
      if (!c.Key) return

      if (c.Key.toLowerCase().endsWith('.xml')) {
        const xmlUrl = `s3://` + join(bucket, c.Key)
        const { Body } = await client.send(
          new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_RAW,
            Key: c.Key,
          })
        )
        const xml = await Body?.transformToString()
        if (xml) {
          console.log('parsing', xmlUrl)
          await parseDdexXml(xmlUrl, xml)
        }
      }
    })
  )
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
