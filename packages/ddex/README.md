# Audius DDEX

Processes and uploads DDEX releases to Audius.

## Production setup
Use audius-docker-compose to run a production DDEX instance. After you've installed audius-docker-compose, set the following required environment variables in override.env (in the audius-docker-compose repository, not here).

### Creating a bucket in S3
1. Create a new bucket in the S3 console with the name `ddex-[dev|staging]-<label/distributor>-raw`. Use all the defaults, including "ACLs disabled"
2. Do the same for a bucket named `ddex-[dev|staging]-<label/distributor>-crawled`. Use all the defaults, including "ACLs disabled"
3. Create an IAM Policy (here](https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-west-2#/policies/create) (or search IAM and click Policies > Create Policy). Select S3.
    * Under `Read` choose `GetObject` and `GetObjectAttributes`.
    * Under `Write` choose `DeleteObject` and `PutObject`.
    * Under `List` choose `ListBucket`.
    * Click `Add Arn` for object actions, enter the bucket name ending with `raw`, and check the box for `Any object name`.
    * Click `Add Arn` for object actions again, enter the bucket name ending with `crawled`, and check the box for `Any object name`.
    * Click `Add Arn` for bucket actions and enter the bucket name ending with `raw`.
    * Click `Add Arn` for bucket actions again and enter the bucket name ending with `crawled`.
    * Click Next, and then name the policy `ddex-[dev|staging]-<label/distributor>-policy`.
4. Create an IAM User [here](https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-west-2#/users/create) (or search IAM and click Users > Create User).
    * Name the user `ddex-[dev|staging]-<label/distributor>-user` and press Next.
    * Select "Attach policies directly," and search for the policy you created (`ddex-[dev|staging]-<label/distributor>-policy`). Check the box next to it and press Next and then Create User.
5. Search for your new user and press "Create access key" and then "Third-party service." Copy the access key and secret access key into your `.env` file (assuming you've already done `cp .env.[dev|stage] .env`).
6. Go back to the bucket ending with `raw`, and add CORS at the bottom of the Permissions tab. Here's an example for dev, but for a prod environment you'll wnat to replace "*" in "AllowedOrigins" with the DNS that the frontend will be served from:
```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": []
    }
]
```

### AWS environment variables:
Set up your buckets by following the "Creating a bucket in S3" section below. Then, set these environment variables:
- `AWS_ACCESS_KEY_ID`: the access key for the IAM user you created
- `AWS_SECRET_ACCESS_KEY`: the secret access key for the IAM user you created
- `AWS_REGION`: the region where your buckets were created (e.g., 'us-west-2' or 'us-east-1')
- `AWS_BUCKET_RAW`: the name of the bucket you created (likely the format of `ddex-[dev|staging]-<label/distributor>-raw`)
- `AWS_BUCKET_CRAWLED`: the name of the bucket you created (likely the format of `ddex-[dev|staging]-<label/distributor>-crawled`)

### App environment variables:
Create an app by following the 2 steps [here](https://docs.audius.org/developers/sdk/#set-up-your-developer-app), and then set these environment variables:
- `DDEX_KEY`: the key created for your Audius app
- `DDEX_SECRET`: the secret created for your Audius app
- `DDEX_CHOREOGRAPHY`: the type of choreography you're using: "[ERNReleaseByRelease](https://ernccloud.ddex.net/electronic-release-notification-message-suite-part-3%253A-choreographies-for-cloud-based-storage/5-release-by-release-profile/5.1-choreography/)" or "[ERNBatched](https://ernccloud.ddex.net/electronic-release-notification-message-suite-part-3%253A-choreographies-for-cloud-based-storage/6-batch-profile/6.1-choreography/)." If you want another option, you'll have to implement the code for it

### Auth-related environment variables:
- `DDEX_ADMIN_ALLOWLIST`: a comma-separated list of **decoded** user IDs that are allowed to act as admins on your DDEX website. You can decode your user ID by going to `https://discoveryprovider.audius.co/v1/full/users/handle/<your audius handle>`, looking at the `id` field, and then decoding it by pasting it into the "Encoded" textbox [here](https://healthz.audius.co/#/utils/id) and copying the "Integer" value
- `SESSION_SECRET`: enter something random and unique. This is important for the security of user sessions

## Local dev
DDEX requires these services: `ddex-webapp`, `ddex-crawler`, `ddex-parser`, `ddex-publisher`, `ddex-mongo`.

### Env configuration
All services read from `packages/ddex/.env`.

To use stage envs: `cp packages/ddex/.env.stage packages/ddex/.env`

To use dev envs: `cp packages/ddex/.env.dev packages/ddex/.env`

Fill in all missing values. See the `Creating a bucket in S3` section below for how to set up S3.

For docker compose to work: `cat packages/ddex/.env >> dev-tools/compose/.env`

### One-time setup
1. `audius-compose connect` to update your `/etc/hosts`
2. Install the AWS cli and configure it for local dev:
    ```sh
    pip install awscli && \
    aws configure set aws_access_key_id test && \
    aws configure set aws_secret_access_key test && \
    aws configure set region us-west-2
    ```
3. To use the DDEX webapp as an admin, add your decoded staging user ID to `extra-env.DDEX_ADMIN_ALLOWLIST` in `../../dev-tools/config.json`
  - Find your user ID by going to `https://discoveryprovider.staging.audius.co/v1/full/users/handle/<your staging handle>`, searching for `id`, and then decoding it by pasting it into the "Encoded" textbox [here](https://healthz.audius.co/#/utils/id) and copying the "Integer" value
  - Note that this requires a restart if the app is already running (`audius-compose down && audius-compose up -ddex-only`)


### Bring up the ddex stack locally
Run `audius-compose up -ddex-only` and navigate to `http://localhost:9000` to view the DDEX webapp

To upload a delivery to be processed:
  1. Create buckets: `aws --endpoint=http://localhost:4566 s3 mb s3://audius-test-raw && aws --endpoint=http://localhost:4566 s3 mb s3://audius-test-crawled`
  2. Upload your file: `aws --endpoint=http://localhost:4566 s3 cp <file from your computer> s3://audius-test-raw`. Example: `aws --endpoint=http://localhost:4566 s3 cp ./ingester/e2e_test/fixtures/release_by_release/ern381/sony1.zip s3://audius-test-raw`
  3. Wait 3 minutes and it'll be processed and display in the UI (localhost:9000)

To access the ddex db via the mongo shell: `docker exec -it ddex-mongo mongosh -u mongo -p mongo --authenticationDatabase admin`, and then `use ddex`.  

### Develop with hot reloading
Each service can be run independently as long as `ddex-mongo` is up (from `audius-compose up --ddex-only` and then optionally stopping individual services). See the respective subdirectories' READMEs.

### Running / debugging the e2e test
* Run `audius-compose test down && audius-compose test run ddex-e2e-release-by-release` to start the ddex stack and run the e2e test for the Release-By-Release choreography. You can replace `ddex-e2e-release-by-release` with `ddex-e2e-batched` to run the e2e test for the Batched choreography.
* To debug S3:
  1. Exec into `ddex-s3-release-by-release` (or `ddex-s3-batched`)
  2. Run `pip install awscli`
  3. Run `aws configure` and enter `test` as both credentials and `us-west-2` as the region when prompted
  4. You can now run `aws --endpoint=http://localhost:4566 s3 ls` and other commands to debug the S3 state

## App architecture and flows
1. A distributor uploads a ZIP file to the "raw" AWS S3 bucket.
2. The Crawler periodically checks this bucket for new uploads. It downloads+unzips the file and crawls it for one or more "releases" (ie, metadata and assets for a track -- or collection of tracks -- to upload to Audius). The assets are uploaded to the "crawled" AWS S3 bucket, and metadata is stored in MongoDB.
3. The Parser app watches for new releases and processes each one into a format that the Publisher app can use to upload to Audius.
4. When the release date is reached for a release, the Publisher app uploads the release to Audius.

## Glossary
- **DDEX**: Digital Data Exchange, a standard for music metadata exchange
- **ERN**: Electronic Release Notification, a DDEX message that contains metadata about a release
- **Choreography**: A DDEX term for the way that ERNs are sent and received. There are two main choreographies: Release-By-Release and Batched
  - **Release-By-Release**: A choreography where releases are sent via a folder containing `<ReleaseID>.xml` and a resources folder containing the release's assets
  - **Batched**: A choreography where releases are are sent in a batch. IE, a folder with `BatchComplete_<batchID>.xml` at its root and and one or more folders which each contain a release (with each release having the same structure as Release-By-Release)
- **Delivery**: A ZIP file that a distributor uploads to S3. It contains one or more ERNs.
- **Release**: A set of metadata and assets for one or more tracks/albums to upload to Audius. A release is created from an ERN.