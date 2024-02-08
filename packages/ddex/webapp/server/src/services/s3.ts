import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3Client, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3'

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
  const bucket = process.env.AWS_BUCKET_RAW
  const client = new S3Client(config)

  async function getSignedFileUrl(
    fileName: string,
    expiresInSeconds = 60 * 60 * 3
  ) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
    })

    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds })
  }

  return { getSignedFileUrl }
}
