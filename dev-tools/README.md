## Setup Instructions

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

## Proxy Instructions

To use the client from a mac, we need to setup a local proxy to interact with the box running the server

To setup the proxy from a mac:

networksetup -setautoproxyurl "Wi-Fi" "http://<instance ip>:8080/proxy.pac"
Change "Wi-Fi" to network interface name you find in system settings

Then on your local machine you can go to http://audius-protocol-creator-node-2:4000/health_check

TODO: Please be careful, as unintended traffic might be proxied
