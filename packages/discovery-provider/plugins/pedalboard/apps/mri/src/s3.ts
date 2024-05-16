import { S3Client, CreateBucketCommand, ListBucketsCommand } from "@aws-sdk/client-s3"

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

export const listBuckets = async () => {
    try {
      const data = await s3Client.send(new ListBucketsCommand({}));
      console.log("Success", data.Buckets);
    } catch (err) {
      console.log("Error", err);
    }
  };

export const publishFile = async (file: string): Promise<void> => {

}
