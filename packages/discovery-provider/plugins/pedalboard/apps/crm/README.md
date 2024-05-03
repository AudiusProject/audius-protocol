# crm

## Setup

To set up env vars:

1. Create an app here https://api-console.zoho.com and write down client id and secret
2. Visit this URL in your browser:

`https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=<CLIENT-ID>&scope=ZohoCRM.modules.ALL,ZohoSearch.securesearch.READ&redirect_uri=<REDIRECT-URI>&access_type=offline>`

1. Send this request to get a refresh token, using the access code from the above

```
curl -X POST \
-d 'grant_type=authorization_code' \
-d 'client_id=<CLIENT-ID>' \
-d 'client_secret=<CLIENT-SECRET>' \
-d 'redirect_uri=<REDIRECT-URI>>' \
-d 'code=<ACCESS-CODE>' \
https://accounts.zoho.com/oauth/v2/token
```

   
Set env vars for the crm plugin:

```
zoho_refresh_token=
zoho_client_id=
zoho_client_secret=
```

## Dev

```
# Up stack to get a database
audius-compose up

# Up the plugin
docker compose -f dev-tools/compose/docker-compose.pedalboard.dev.yml up crm --build -d
```

Add a user and a purchase
```
audius-cmd create-user katoproducer
audius-cmd create-user-bank --mint usdc katoproducer
audius-cmd create-user buyer
audius-cmd create-user-bank --mint usdc buyer

audius-cmd upload-track --from katoproducer --title lit --price 100
audius-cmd mint-tokens --from buyer --mint usdc 10000000

audius-cmd purchase-content <track-id> --type track --from buyer
```

You should see logs about updating the revenue numbers