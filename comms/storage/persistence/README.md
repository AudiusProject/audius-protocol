**Storage Location**

The default storage driver url is `file:///tmp/audius_storage`.
This is the directory on your node where files will stored post transcoding.

To update the local storage location set the `storage_driver_url` environment variable
```
storage_driver_url="file:///my/directory"
```

By default, it tries to determine what storage driver to use based on the `storage_url` (eg `s3://your-bucket`)

It can be manually set to override this behavior with the environment variable `storage_driver` 
This can be useful when using self hosted storage solution such as minio
```
storage_driver=gcs
```

The available drivers are `file`, `s3`, `gcs`, and `azure`

Side note: if the url is https:// it’ll default to s3


**Cloud Storage**

To use cloud object storage instead of local storage, you will need to:

- create either an s3 bucket, gcs bucket or azure storage container
- your bucket access policy should <u>NOT BE PUBLIC</u>
- provision credentials that allow object storage access

[S3 storage](https://aws.amazon.com/s3/)
```
AWS_ACCESS_KEY_ID="<my-access-key-id>"
AWS_SECRET_ACCESS_KEY="<my-secret-access-key>"
storage_driver_url="s3://my-bucket?region=us-west-1"
```

[GCS storage](https://cloud.google.com/storage/docs/creating-buckets)
```
GOOGLE_APPLICATION_CREDENTIALS="/path/to/creds.json"
storage_driver_url="gcs://my-bucket"
```

[Azure storage](https://azure.microsoft.com/en-us/products/storage/blobs)
```
AZURE_CLIENT_ID=""
AZURE_CLIENT_SECRET=""
AZURE_TENANT_ID=""
storage_driver_url="azblob://my-container"
```