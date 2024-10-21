# DDEX Processor

## hello ddex

Firstly, parse + print a local XML file to confirm all good:

```
npx tsx cli.ts parse ../ingester/e2e_test/fixtures/batch/fuga/20240305090206405/8718857546047/8718857546047.xml
```

## Run server

Create `.env` file like:

```
NODE_ENV = 'staging | production'
DDEX_URL = 'https://localhost:8989'
ADMIN_HANDLES = 'user1,user2'
SKIP_SDK_PUBLISH='true | false'
```

Create `data/sources.json` file like:

```
{
  "sources": [
    {
      "env": "staging",
      "name": "sourceA",
      "ddexKey": "",
      "ddexSecret": "",
      "awsKey": "",
      "awsSecret": "",
      "awsRegion": "",
      "awsBucket": ""
    }
  ]
}
```

```bash
npm run dev
```

* Visit http://localhost:8989/
* do oauth
* visit http://localhost:8989/releases - see two releases from initial CLI run above

## simulate rematch

```bash
sqlite3 data/dev.db "insert into users (id, handle, name) values ('2fuga', '2FUGA', '2FUGA') on conflict do nothing; insert into users (id, handle, name) values ('FUGARIAN', 'FUGARIAN', 'FUGARIAN') on conflict do nothing;"
```

* visit http://localhost:8989/releases
* click rematch
* confirm releases ready to publish

## simulate publish

> This will skip actual SDK writes if you set `SKIP_SDK_PUBLISH='true'` in `.env`

```bash
npx tsx cli.ts publish
```


## Other stuff

```bash
# reset sqlite state
rm data/dev.db*
```

### set up local s3 cli
```bash
aws configure --profile local
# enter these details
# AWS Access Key ID [None]: test
# AWS Secret Access Key [None]: test
# Default region name [None]: us-west-2
# Default output format [None]: json
```

edit `~/.aws/config` and add
```
[profile local]
endpoint_url = http://ingress:4566
```

Pull remote s3 into local s3
```bash
audius-compose up ddex-s3

npx tsx cli.ts sync-s3 s3://ddex-prod-raw/20240305090456555

aws s3 ls s3://ddex-prod-raw/20240305090456555 --profile local
```
