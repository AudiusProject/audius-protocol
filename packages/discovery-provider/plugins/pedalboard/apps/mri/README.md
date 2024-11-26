# MRI reporting plugin

Plugin to handle various reporting needs based on an Audius RPC database.

## Run the plugin by itself
If you want to test with a remote db and dump out csv files to `/output`
```
audius_db_url=... \
skip_publish=true \
npm run dev
```

If you want to test with S3 publishing to localstack
```
docker compose up -d
audius_db_url=... \
skip_publish=false \
npm run dev
```

If you want to seed your own data into a database
```
docker compose up -d
npm run dev
```

## Manually run a report
```
# Test CLM
curl -X POST "http://localhost:6003/clm/record?date=2024-05-14"

# Test UDR
curl -X POST "http://localhost:6003/udr/record?date=2024-05-14"

# Test MRVR
curl -X POST "http://localhost:6003/mrvr/record?date=2024-05-14"
```
