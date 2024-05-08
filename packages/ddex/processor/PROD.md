```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# source ~/.bashrc
# clone audius repo

cd audius-protocol
nvm install

sudo apt install -y python3 make g++ curl bash git

CI=true npm i

npm run sdk

cd packages/ddex/procesor

npx tsx cli server

# or
# npx pm2 start 'npm start'

# also setup pm2 to run on boot:
# https://pm2.keymetrics.io/docs/usage/startup/

```


setup `/etc/caddy/Caddyfile` like:

```
{
    servers :443 {
        protocols h1
    }
}

ddex2.staging.audius.co

reverse_proxy "localhost:8989"
```


setup .env with:

```
DDEX_URL='https://ddex2.staging.audius.co'
```
