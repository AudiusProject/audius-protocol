import { S3Client, GetObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3'

export default function createS3() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not found')
  }

  const config: S3ClientConfig = {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
  }
  if (process.env.AWS_ENDPOINT) {
    config.endpoint = process.env.AWS_ENDPOINT
    config.forcePathStyle = true
  }
  const crawledBucket = process.env.AWS_BUCKET_CRAWLED
  const client = new S3Client(config)

  const downloadFromS3Crawled = async (key: string) => {
    if (key.startsWith(`s3://${crawledBucket}/`)) {
      key = key.slice(`s3://${crawledBucket}/`.length)
    } else {
      throw new Error(`Invalid key '${key}' (not in crawled bucket)`)
    }

    const command = new GetObjectCommand({
      Bucket: crawledBucket,
      Key: key,
    })
    try {
      const response = await client.send(command)

      // Audius SDK expects a Buffer not a stream (Readable)
      const byteArr = await response.Body!.transformToByteArray()
      return Buffer.from(byteArr)
    } catch (err) {
      console.error(err)
    }
  }

  return { downloadFromS3Crawled }
}
