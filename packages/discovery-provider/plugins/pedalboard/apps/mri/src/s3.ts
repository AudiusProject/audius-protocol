import { S3Client, CreateBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { formatDate } from "./date"

export type ClmS3Config = {
  s3: S3Client
  bucket: string
  keyPrefix: string
}

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:4566",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test"
  },
  forcePathStyle: true
})

export const createBucket = async (bucketName: string) => {
  try {
    const data = await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket "${bucketName}" created successfully`, data);
  } catch (err) {
    console.log("Error", err);
  }
};

export const publishToS3 = async (config: ClmS3Config, date: Date, csv: string): Promise<string> => {
  const { s3, keyPrefix, bucket } = config
  // Audius_CLM_
  const key = `${keyPrefix}${formatDate(date)}.csv`
  const uploadParams = {
    Bucket: bucket,
    Key: key,
    Body: csv,
    ContentType: "text/csv"
  }

  await s3.send(new PutObjectCommand(uploadParams))
  const objectUrl = `http://localhost:4566/${bucket}/${key}`
  return objectUrl
}
