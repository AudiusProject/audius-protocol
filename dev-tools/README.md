# Summary

Use these CLI tools for Audius dev. Currently there are 3 tools available:

`audius-cloud`: create a pre-configured GCP VM for dev
`audius-compose`: start, stop, and manage Audius service containers
`audius-cmd`: perform user actions, e.g. `create-user`, `upload-track`, `repost-playlist`

View all available commands for any of these tools with `--help`, e.g.
```
> audius-cloud --help
> audius-compose --help
> audius-cmd --help
```

# Setup Instructions

## Resource Requirements

Increase `docker` resource allocations to avoid OOM kills and your local docker image repository running out of space.
Below are suggested minimum values.
```
Docker > Preferences > Resources > Advanced
- CPUs 4
- Memory 12 GB
- Disk Image Size 80 GB
```

If you still run into issues, you may execute a `docker system prune` to free additional space.

### Install dev-tools (this repo)

This step only needs to be run once

```
curl "https://raw.githubusercontent.com/AudiusProject/audius-protocol/main/dev-tools/setup.sh" | bash

# refresh terminal for docker
exit

# In new terminal
audius-compose build # takes about 10 min
```

### Bring up protocol stack

```
audius-compose up
```
This command completes in 1-2 min, but use `watch docker ps -a` to ensure that all servicees report "Status" as Healthy. It currently takes ~10min for this to happen.

### Perform actions with `audius-cmd`

You can confirm that things are wired up correctly by running `audius-cmd create-user`.
Note that `audius-cmd` requires the stack to be up and healthy, per [Bring up protocol stack](#bring-up-protocol-stack)

## Port Forwarding Instructions

To use the client from a mac, we need to setup a transparent proxy server to interact with the machine running the backend
```
brew install sshuttle
```

### Local Machine

If running protocol and client on localhost

```
audius-compose connect
```

### Remote Machine

If running protocol on remote instance and client on localhost

```
audius-compose connect -r
```

Then on your local machine you can go to http://audius-protocol-discovery-provider-1:5000/health_check

# Helpful Commands

Periodically prune docker cache
```
audius-compose prune
```

Get service logs
```
audius-compose logs discovery-provider-1 # get name from `docker ps`
```

Set environment variables
```
audius-compose set-env discovery-provider-1 audius_discprov_url https://discoveryprovider.testing.com/
```

Load environment variables
```
audius-compose load-env discovery-provider prod
```
