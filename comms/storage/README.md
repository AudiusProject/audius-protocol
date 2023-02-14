# Storage V2

This project is a ground up re-write of the Audius distributed storage system.

Storage V2 is responsible for the even distribution, replication and transcoding of content across as many nodes in the network as possible. The project values simplicity and robustness in its design and implementation.

#### Features
- [Replicated Sharding](#replicated-sharding)
- [Transcoding Pipeline](#transcoding)
- [Configurable Blob Storage](#blob-storage)
- [Backup and Restore Tooling](#backup-and-restore)
- [HTTP API](#http-api)
- [NATS Gateway](#nats-gateway)
- [Content Access Control](#access-control)

---

## Quickstart

To get started with a lightweight multi node cluster and test uploads.

![upload-dashboard](../docs/uploads.png)

```shell
# build and run
docker compose -f docker-compose.v2.yml up -d --build

# to test an upload visit the storage node webui at
open http://0.0.0.0:9924/storage

# grep logs for success i.e. 
docker compose logs storage1 | grep -i storing

# to check nats stream status
docker exec -ti com1 nats stream ls -a

# teardown
docker compose -f docker-compose.v2.yml down -v
```

**DEVELOP**

To get started with development, you can run a single node cluster. Hot reloading will be enabled on the `storage1` container.

```
docker compose -f docker-compose.v2.dev.yml up -d --build
```

---

### Replicated Sharding

[rendevous hashing](https://en.wikipedia.org/wiki/Rendezvous_hashing) is used to ensure all nodes in the network agree on **who** should store **what** data.

### Visibility

For visibility and troubleshooting, a storage [weathermap](./storageserver/weather-map/README.md) at `/storage/weather/` provides visualization and introspection into the location of files within the network. As well as each node's view of the hash ring.

![upload-dashboard](../docs/weather.png)

### Transcoding

An integrated normalization pipeline exists to encode input audio and image files into nominal output formats and compression ratios.

```
## WIP                           +-------+                    ## WIP
                        +------->| NATS  |
                        |        |       |
                        |        +-------+
                        |
+-------+         +-----+--+     +-------+         +---------------+
|       |         |STORAGE |     | NATS  |         |JOBS MANAGER   |
| CLIENT+-------->|SERVER  +---->|       |<--------+               |
+-------+         +-----+--+     +-------+         +---------------+
                        |
                        |        +-------+
                        |        | NATS  |
                        +------->|       |
                                 +-------+
```

### Blob Storage

The system uses [blob storage](https://gocloud.dev/howto/blob/) to abstract a file system interface across local storage and cloud storage setups.

**Storage Location**

The default storage driver url is `file:///tmp/audius_storage`.
This is the directory on your node where files will stored post transcoding.

To update the local storage location set the `storage_driver_url` environment variable

```
storage_driver_url="file:///my/directory"
```

**Cloud Storage**

To use cloud object storage instead of local storage, you will need to:

- create either an s3 bucket, gcs bucket or azure storage container
- your bucket access policy must <u>NOT BE PUBLIC</u>
- provision credentials that allow access to your bucket

[S3 storage](https://aws.amazon.com/s3/)
```
AWS_ACCESS_KEY_ID="<my-access-key-id>"
AWS_SECRET_ACCESS_KEY="<my-secret-access-key>"
storage_driver_url="s3://my-bucket?region=us-west-1"
```

[GCS storage](https://cloud.google.com/storage/docs/creating-buckets)
```
GOOGLE_APPLICATION_CREDENTIALS=""
storage_driver_url="gcs://my-bucket"
```

[Azure storage](https://azure.microsoft.com/en-us/products/storage/blobs)
```
AZURE_CLIENT_ID=""
AZURE_CLIENT_SECRET=""
AZURE_TENANT_ID=""
storage_driver_url="azblob://my-container"
```

### Backup and Restore

Tooling exists to allow a node operator to backup and restore their storage node data.

```
docker run audius/storage-archiver -e "MODE=BACKUP"  -e "<AUTHORIZATION>" -e "<BUCKET_NAME>" -d
docker run audius/storage-archiver -e "MODE=RESTORE" -e "<AUTHORIZATION>" -e "<BUCKET_NAME>" -d
```

### HTTP API

An HTTP API exists to allow clients to inteface with storage v2.

#### WIP

```
POST /file
GET  /jobs
GET  /jobs/:id
GET  /tmp-obj/:bucket/:key
GET  /long-term/shard/:shard
GET  /long-term/file/:fileName
GET  /job-results/:id
```

#### POST /file

Upload a track from the command line

```shell
$ curl -v -F "files=@/private/var/orion/Music/mp3Archive/dub.mp3" -F "template=audio" http://0.0.0.0:9924/storage/file

...

[
  {
    "id": "cle4h8b1g000101q8l4tz2mkx",
    "template": "audio",
    "status": "pending",
    "created_at": "2023-02-14T16:46:44.66288267Z",
    "source_info": {
      "name": "cle4h8b1g000101q8l4tz2mkx",
      "description": "dub.mp3",
      "options": {
        "max_chunk_size": 131072
      },
      "bucket": "temp_14",
      "nuid": "yAyElmI9R40Zjuqp7YuGgg",
      "size": 17804422,
      "mtime": "2023-02-14T16:46:44.66287517Z",
      "chunks": 136,
      "digest": "SHA-256=JxJGxEhuS7Gp9qnCRhs_CCYpHWZ7cL5HzeP0sPje0Iw="
    }
  }
]
```

### NATS Gateway

The project uses [NATS](https://nats.io) as a connective substrate between nodes.

### Access Control

Signature validation.

---

## Infrastructure

> This section is specific to Tiki Labs

---

## License

Distributed under the Apache Version 2.0 license found in the [LICENSE](../../LICENSE) file
