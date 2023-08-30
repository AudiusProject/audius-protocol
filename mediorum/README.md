# Mediorum

stores files and stuff

## FOR SERVICE PROVIDERS

### Migrating Providers/Backends
If you want to move data between providers (e.g., from your disk to AWS or GCS), do the following:
1. Set `AUDIUS_STORAGE_DRIVER_URL_MOVE_FROM` (in `audius-docker-compose/creator-node/override.env`) to your current provider (most likely local disk - `"file:///tmp/mediorum/blobs"`).
2. Set `AUDIUS_STORAGE_DRIVER_URL` to the new provider (see below for configuration and to make sure you have the right credentials).
3. Start the server and monitor logs for errors. Once you see the message "Finished moving files between buckets" and the health check responds again, then the migration is complete. NOTE: this may take hours to complete.
4. Remove the `AUDIUS_STORAGE_DRIVER_URL_MOVE_FROM` env var and restart the server. You're good to go!

### Configuring GCS Backend
1. Createa  new Service Account and JSON key for it. `scp` the key onto your server and `mv` the key to `/var/k8s/mediorum/google-application-credentials.json`.
2. Create a GCS bucket:
   * Non-public access (enforce public access prevention)
   * Uniform access control
   * No protection tools
3. In the bucket permissions, grant access for Storage Legacy Bucket Owner and Storage Legacy Object Owner for the Service Account (set the principal to the Service Account’s email).
4. Set these env vars in `audius-docker-compose/creator-node/override.env`:
    * `GOOGLE_APPLICATION_CREDENTIALS="/tmp/mediorum/google-application-credentials.json"`
    * `AUDIUS_STORAGE_DRIVER_URL="gs://<your bucket's name>"`

### Configuring AWS Backend
1. Ensure that you *block public access* for your bucket.
2. Create an IAM policy for the bucket with these minimum permissions:
    * Under `Read` choose `GetObject` and `GetObjectAttributes`.
    * Under `Write` choose `DeleteObject` and `PutObject`.
    * Under `List` choose `ListBucket`.
    * Click `Add Arn`, enter the bucket name, and check the box for `Any object name`.
3. Make an IAM user and group with this policy, and in the user/group click “Create access key” and select “Third-party service.” 
4. Set the environment variables in your node’s `audius-docker-compose/creator-node/override.env` file accordingly:
   * `AWS_ACCESS_KEY_ID`
   * `AWS_SECRET_ACCESS_KEY`
   * `AWS_REGION`
   * `AUDIUS_STORAGE_DRIVER_URL="s3://<your_bucket_name>"`

## Status + Run it

* `make tools` - install tools (make sure `~/go/bin` is in path)
* `make pg.bounce` - starts postgres via docker-compose
* `make` - starts single process dev cluster

* `make test`

visit `http://localhost:1991/`

with `make dev2` you can use `goreman` to start and stop servers:

* `make dev2` - starts servers as separate processes
* `goreman run stop m2`
* `goreman run start m2`

## Docker

```
docker build . -t mediorum
docker run -it -p 1991:1991 mediorum
```

## Deploy

* `make build.fast`
