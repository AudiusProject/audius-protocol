# Trending rewards plugin

Plugin to handle distribution of rewards for trending challenges.

## Run the plugin by itself

```
audius_db_url=... \
run_now=true \
dry_run=true \
npm run dev
```

or make a .env file with the appropriate values and run
```
npm run dev
```

## Slack config

Add the following to your .env file:

```
slack_bot_token=...
slack_signing_secret=...
slack_app_token=...
slack_channel=...
```

## Slack commands

```
/disburse 2024-01-01
/disbursetest 2024-01-01
/trending
```
