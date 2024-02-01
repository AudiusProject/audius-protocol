# Audius DDEX Web App

tRPC server and client for the Audius DDEX control layer (UI for suppliers to do OAuth and to view and manage uploads).

### Local Dev
Setup:
1. `cp .env.dev .env`
2. (only required to upload to S3 from the UI) Follow the instructions below to create a bucket in S3 and add the credentials to your .env file

Run the server:
1. Make sure you can connect to mongo at `mongodb://mongo:mongo@localhost:27017/ddex` by doing: `docker run --name ddex-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=mongo -e MONGO_INITDB_ROOT_PASSWORD=mongo -d mongo`
2. At the monorepo root: `npm i`
3. At packages/ddex/webapp/server: `npm run dev:[stage|prod]`  

Run the client:
If you want to run the frontend locally, you'll need to:
1. At packages/ddex/webapp/client: `npm run start:[stage|prod]`


Notes:
* When running on stage or prod, the backend serves the frontend as static assets at the root path

### Creating a bucket in S3
1. Create a new bucket in the S3 console with the name `ddex-[dev|staging]-<label/distributor>-raw`. Use all the defaults, including "ACLs disabled"
2. Do the same for a bucket named `ddex-[dev|staging]-<label/distributor>-indexed`. Use all the defaults, including "ACLs disabled"
3. Create an IAM Policy (here](https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-west-2#/policies/create) (or search IAM and click Policies > Create Policy).
    * Under `Read` choose `GetObject` and `GetObjectAttributes`.
    * Under `Write` choose `DeleteObject` and `PutObject`.
    * Under `List` choose `ListBucket`.
    * Click `Add Arn`, enter the bucket name ending with `raw`, and check the box for `Any object name`.
    * Click `Add Arn` again, enter the bucket name ending with `indexed`, and check the box for `Any object name`.
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