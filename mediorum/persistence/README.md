**Storage Location**

The default storage driver url is `file:///tmp/mediorum/blobs`.
This is the directory on your node where files will stored post transcoding.

To update the local storage location set the `AUDIUS_STORAGE_DRIVER_URL` environment variable
```
AUDIUS_STORAGE_DRIVER_URL="file:///my/directory"
```

The driver is determined based on the `storage_url` (eg `s3://your-bucket` uses the s3 driver)

💡 Note: URLs beginning with https:// will default to s3

**Cloud Storage**

To use cloud object storage instead of local storage, you will need to:

- create either an s3 bucket, gcs bucket or azure storage container
- your bucket access policy should <u>NOT BE PUBLIC</u>
- provision credentials that allow object storage access

[S3 storage](https://aws.amazon.com/s3/)
```
AWS_ACCESS_KEY_ID="<my-access-key-id>"
AWS_SECRET_ACCESS_KEY="<my-secret-access-key>"
AWS_REGION="<my-aws-region>"
AUDIUS_STORAGE_DRIVER_URL="s3://my-bucket?region=us-west-1"
```

[GCS storage](https://cloud.google.com/storage/docs/creating-buckets)
```
GOOGLE_APPLICATION_CREDENTIALS="/path/to/creds.json"
AUDIUS_STORAGE_DRIVER_URL="gs://my-bucket"
```

[Azure storage](https://azure.microsoft.com/en-us/products/storage/blobs)
```
AZURE_STORAGE_ACCOUNT="<storage-account-name>"
AZURE_STORAGE_KEY="<storage-key>"
AUDIUS_STORAGE_DRIVER_URL="azblob://my-container"
```
