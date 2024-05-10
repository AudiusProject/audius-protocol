import {
  GetObjectCommand,
  ListObjectsCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3'
import { mkdir, readFile, stat, writeFile } from 'fs/promises'
import { basename, dirname, join, resolve } from 'path'
import { s3markerRepo } from './db'
import { parseDdexXml } from './parseDelivery'
import { SourceConfig, sources } from './sources'

type AccessKey = string

const s3clients: Record<AccessKey, S3Client> = {}

export function dialS3(sourceConfig: SourceConfig) {
  const { awsKey, awsSecret, awsRegion } = sourceConfig
  if (!s3clients[awsKey]) {
    const config: S3ClientConfig = {
      credentials: {
        accessKeyId: awsKey,
        secretAccessKey: awsSecret,
      },
      region: awsRegion,
    }
    s3clients[awsKey] = new S3Client(config)
  }
  return s3clients[awsKey]
}

export async function pollS3(reset?: boolean) {
  for (const sourceConfig of sources.all()) {
    if (!sourceConfig.awsBucket) {
      console.log(`skipping non-s3 source: ${sourceConfig.name}`)
      continue
    }

    const client = dialS3(sourceConfig)
    const bucket = sourceConfig.awsBucket
    const sourceName = sourceConfig.name

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
      await scanS3Prefix(sourceName, client, bucket, prefix)
      Marker = prefix
    }

    // save marker
    if (Marker) {
      console.log('update marker', { bucket, Marker })
      s3markerRepo.upsert(bucket, Marker)
    }
  }
}

// recursively scan a prefix for xml files
async function scanS3Prefix(
  source: string,
  client: S3Client,
  bucket: string,
  prefix: string
) {
  const result = await client.send(
    new ListObjectsCommand({
      Bucket: bucket,
      Prefix: prefix,
    })
  )
  if (!result.Contents?.length) {
    return
  }

  for (const c of result.Contents) {
    if (!c.Key) continue

    if (c.Key.toLowerCase().endsWith('.xml')) {
      const xmlUrl = `s3://` + join(bucket, c.Key)
      const { Body } = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: c.Key,
        })
      )
      const xml = await Body?.transformToString()
      if (xml) {
        console.log('parsing', xmlUrl)
        parseDdexXml(source, xmlUrl, xml)
      }
    }
  }
}

//
// s3 file helper
//
export async function readAssetWithCaching(
  xmlUrl: string,
  filePath: string,
  fileName: string
) {
  // read from s3 + cache to local disk
  if (xmlUrl.startsWith('s3:')) {
    const cacheBaseDir = `/tmp/ddex_cache`
    const s3url = new URL(`${filePath}${fileName}`, xmlUrl)
    const Bucket = s3url.host
    const Key = s3url.pathname.substring(1)
    const destinationPath = join(cacheBaseDir, Bucket, Key)

    // fetch if needed
    const exists = await fileExists(destinationPath)
    if (!exists) {
      const source = sources.findByXmlUrl(xmlUrl)
      const s3 = dialS3(source)
      await mkdir(dirname(destinationPath), { recursive: true })
      const { Body } = await s3.send(new GetObjectCommand({ Bucket, Key }))
      await writeFile(destinationPath, Body as any)
    }

    return readFileToBuffer(destinationPath)
  }

  // read from local disk
  const fileUrl = resolve(xmlUrl, '..', filePath, fileName)
  return readFileToBuffer(fileUrl)
}

// sdk helpers
async function readFileToBuffer(filePath: string) {
  const buffer = await readFile(filePath)
  const name = basename(filePath)
  return { buffer, name }
}

async function fileExists(path: string) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}
