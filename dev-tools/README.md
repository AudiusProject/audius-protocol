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

## Port Forwarding Instructions

To use the client from a mac, we need to setup a transparent proxy server to interact with the machine running the backend

To setup the transparent proxy server from a mac:
```
sshuttle --dns -N -r sshuttle@<server-machine-ip>:2222
```

Then on your local machine you can go to http://discovery-provider:5000/health_check
