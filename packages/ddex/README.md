# Audius DDEX

Processes and uploads DDEX releases to Audius.

## Local Dev
DDEX requires these services: `ddex-webapp`, `ddex-crawler`, `ddex-indexer`, `ddex-parser`, `ddex-publisher`, `ddex-mongo`.

### Env configuration
All services read from `.env`.

To use stage envs: `cp .env.stage .env`

To use dev envs: `cp .env.dev .env`

Fill in all missing values. See the `Creating a bucket in S3` section below for how to set up S3.

For docker compose to work: (At monorepo root) `cat packages/ddex/.env >> dev-tools/compose/.env`

### Setup
1. (At the monorepo root) Generate a keyfile for mongodb:
```
openssl rand -base64 756 > packages/ddex/mongo-keyfile
chmod 400 packages/ddex/mongo-keyfile
```
2. `audius-compose connect` to update your /etc/hosts
3. `audius-compose up --ddex`
4. Once the `ddex-mongo` container is running: manually intiate the mongodb replica set with `docker exec -it ddex-mongo mongosh -u mongo -p mongo --authenticationDatabase admin --eval 'rs.initiate({_id:"rs0", members:[{_id:0, host:"ddex-mongo:27017"}]})'`. The other ddex containers will be blocked from starting until this command succeeds.

### Bring up the ddex stack subsequently
`audius-compose up --ddex`

Note: `audius-compose down` removes the `ddex-mongo-db` volume, so if you run this, you will need to initiate the mongodb replica set again the next time you bring up the `ddex-mongo` container. See step 4 in the Setup section above.

To access the ddex db via the mongo shell: `docker exec -it ddex-mongo mongosh -u mongo -p mongo --authenticationDatabase admin` then `use ddex`

### Develop with hot reloading
Each service can be run independently as long as `ddex-mongo` is up (from `audius-compose up --ddex`` or `docker compose --project-directory=dev-tools/compose --file=dev-tools/compose/docker-compose.yml --profile=ddex up ddex-mongo -d`). See the respective subdirectories' READMEs.

### Creating a bucket in S3
1. Create a new bucket in the S3 console with the name `ddex-[dev|staging]-<label/distributor>-raw`. Use all the defaults, including "ACLs disabled"
2. Do the same for a bucket named `ddex-[dev|staging]-<label/distributor>-indexed`. Use all the defaults, including "ACLs disabled"
3. Create an IAM Policy (here](https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-west-2#/policies/create) (or search IAM and click Policies > Create Policy). Select S3.
    * Under `Read` choose `GetObject` and `GetObjectAttributes`.
    * Under `Write` choose `DeleteObject` and `PutObject`.
    * Under `List` choose `ListBucket`.
    * Click `Add Arn` for object actions, enter the bucket name ending with `raw`, and check the box for `Any object name`.
    * Click `Add Arn` for object actions again, enter the bucket name ending with `indexed`, and check the box for `Any object name`.
    * Click `Add Arn` for bucket actions and enter the bucket name ending with `raw`.
    * Click `Add Arn` for bucket actions again and enter the bucket name ending with `indexed`.
    * Click Next, and then name the policy `ddex-[dev|staging]-<label/distributor>-policy`.
4. Create an IAM User [here](https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-west-2#/users/create) (or search IAM and click Users > Create User).
    * Name the user `ddex-[dev|staging]-<label/distributor>-user` and press Next.
    * Select "Attach policies directly," and search for the policy you created (`ddex-[dev|staging]-<label/distributor>-policy`). Check the box next to it and press Next and then Create User.
5. Search for your new user and press "Create access key" and then "Third-party service." Copy the access key and secret access key into your .env file (assuming you've already done `cp .env.dev .env`).
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
