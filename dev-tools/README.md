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

### Localhost

If running protocol and client on localhost

```
sshuttle -N -H -r sshuttle@localhost:2222 -e 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
# the password is sshuttle
```

### Remote Machine

If running protocol on remote instance and client on localhost

```
sshuttle --dns -N -r sshuttle@<server-machine-ip>:2222 -e 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
# the password is sshuttle
```

Then on your local machine you can go to http://audius-protocol-discovery-provider-1:5000/health_check

### Examples

#### audius-compose

View a list of commands
```
audius-compose --help
```

Periodically prune docker cache
```
audius-compose prune
```

Get logs
```
audius-compose logs discovery-provider-1
```

Set environment variables
```
audius-compose set-env discovery-provider-1 audius_discprov_url https://discoveryprovider.testing.com/
```

Load environment variables
```
audius-compose load-env discovery-provider prod
```

#### audius-cloud

View a list of commands
```
audius-cloud --help
```

#### audius-cmd

This requires services to be running

View a list of commands
```
audius-cmd --help
```
