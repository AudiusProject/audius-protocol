```
# initial setup
curl "https://raw.githubusercontent.com/AudiusProject/audius-protocol/master/dev-tools/setup.sh" | bash

# refresh terminal for docker
exit

# build and pull
audius-compose build # About 10 minutes
docker compose pull
audius-compose up # About 20 seconds
```
