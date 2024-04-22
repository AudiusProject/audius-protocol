# scratch

## hello ddex

Firstly, parse + print a local XML file to confirm all good:

```
npx tsx scratch/cli.ts parse ../ingester/e2e_test/fixtures/batch/fuga/20240305090206405/8718857546047/8718857546047.xml
```

## run server

Create a `.env` file like:

```
DDEX_KEY = ''
DDEX_SECRET = ''
NODE_ENV = 'staging'

AWS_ACCESS_KEY_ID=''
AWS_SECRET_ACCESS_KEY=''
AWS_REGION='us-west-2'
AWS_BUCKET_RAW=''

SKIP_SDK_PUBLISH='true'

COOKIE_SECRET='openssl rand -hex 16'
```

Run server:

```
npx tsx watch scratch/server.ts
```

* Visit http://localhost:8989/
* do oauth
* visit http://localhost:8989/releases - see two releases from initial CLI run above

## simulate rematch

```
sqlite3 scratchy.db

insert into users values ('2fuga', '2FUGA', '2FUGA');
insert into users values ('FUGARIAN', 'FUGARIAN', 'FUGARIAN');
```

* visit http://localhost:8989/releases
* click rematch
* confirm releases ready to publish

## simulate publish

> This will skip actual SDK writes if you set `SKIP_SDK_PUBLISH='true'` in `.env`

```
npx tsx scratch/cli.ts publish
```


## Other stuff

```bash
# reset sqlite state
rm scratchy.db*
```
