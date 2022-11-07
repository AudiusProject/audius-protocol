## Setup Instructions

```
# initial setup
curl "https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/dev-tools/setup.sh" | bash

# refresh terminal for docker
exit

# build and pull
audius-compose build # About 10 minutes
audius-compose up # About 20 seconds
```

## Port Forwarding Instructions

To use the client from a mac, we need to setup a transparent proxy server to interact with the machine running the backend

To setup the transparent proxy server from a mac:
```
brew install sshuttle
sshuttle --dns -N -r sshuttle@<server-machine-ip>:2222 -e 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
```

The password is `sshuttle`

Then on your local machine you can go to http://audius-protocol-discovery-provider-1:5000/health_check
