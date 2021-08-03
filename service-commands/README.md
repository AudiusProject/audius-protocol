# Service Commands

Service Commands presents a high level API for interacting with local Audius Services.
This API allows you to bring services up and down and control your local audius configuration.

**Before you begin:**
- Install tools: `docker`, `docker-compose`, `node`.
- If you are on Linux, it is possible that your kernal might have updated without a reboot. Reboot to ensure that docker does not have kernel related issues.
- Clone the [audius-protocol](https://github.com/AudiusProject/audius-protocol) repo.
- `export` the environment variable `PROTOCOL_DIR` to point to the cloned `protocol` repo.

  set this in your shell config (`.bashrc`), e.g. `export PROTOCOL_DIR=/Users/hareeshnagaraj/Development/audius-protocol`
  Also add `export PATH=$HOME/.local/bin:$PATH` to your shell config.
- Execute `npm install` in `<service-commands>` (audius-tooling/service-commands)
- Run the `<service-commands>/scripts/hosts.js` script with `sudo node hosts.js add`. This script will add mappings to your `/etc/hosts` file.

**First time setup**

- Initialize all the services by executing the following inside `service-commands`:

```
node scripts/setup.js run init-repos up
```

***Linking local libs***
- Link libs to consume changes from your local branch within the system
  - In `<audius-protocol>/libs`, run `npm link`.
  - In `<audius-protocol>/service-commands`, run `npm link @audius/libs`.
  - In `<audius-client>`, run `npm link @audius/libs`.

**Bringing up all services:**
- In `<service-commands>/scripts/`, run `node setup.js up` to bring all services up.
- `-nc, --num-cnodes <number>`, by default set to 4. Adjusts the number of creator nodes initialized within the system. 

```
node setup.js up
node setup.js up -nc 2
node setup.js up --num-cnodes 5
```

For a breakdown of how the `up` operation brings up the entire system, reference [the code here.](src/setup.js#L208)


**Tearing Down all services**
- In `<service-commands>/scripts/`, run `node setup.js down` to bring all services down.



## Structure

All commands to the system are structured as a combination of `service` and `command` - the mapping is stored in [service-commands.json](src/commands/service-commands.json). Any of these service + command combinations are accessible to you through the `node setup.js run` entrypoint detailed below.



### Bringing up services locally
Individual service commands can be executed with: `node setup.js run <service> [command]`


* [List of services](src/setup.js#L94)
* [List of commands](src/setup.js#L79)



Examples:
```
node setup.js run network up
node setup.js run ipfs up
node setup.js run ipfs-2 up
node setup.js run contracts up
```

`creator-node` is the only service that must be run with a corresponding `-i, --instance-num` flag - when the entire system is initialized with `--num-cnodes` set to 4, the commands that are executed to bring them up are as follows:

```
node setup.js run creator-node up -i 1
node setup.js run creator-node up -i 2
node setup.js run creator-node up -i 3
```

### Tearing down services locally

Follows similar syntax as the `up` command:
```
node setup.js run network down
node setup.js run ipfs down
node setup.js run discovery-provider down
node setup.js run contracts down
```


To bring down `creator nodes`, pass `-i` to the `down` function:
```
node setup.js run creator-node down -i 1
```

## API
TODO
