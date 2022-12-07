# Setup Instructions

```
# initial setup
curl "https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/dev-tools/setup.sh" | bash

# refresh terminal for docker
exit
```
```
# build and run
audius-compose build # About 10 minutes
audius-compose up
```

## Port Forwarding Instructions

To use the client from a mac, we need to setup a transparent proxy server to interact with the machine running the backend
```
brew install sshuttle
```

### localhost

If running protocol and client on localhost

```
sshuttle -N -H -r sshuttle@localhost:2222 -e 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
# the password is sshuttle
```

### GCP

If running protocol on remote instance and client on localhost

```
sshuttle --dns -N -r sshuttle@<server-machine-ip>:2222 -e 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
# the password is sshuttle
```

Then on your local machine you can go to http://audius-protocol-discovery-provider-1:5000/health_check
