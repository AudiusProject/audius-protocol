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

### Provisioning a brand-new dev box!
You can provision a brand-new dev instance with:
* dependencies and tooling installed
* Docker images cached
* at commit hashes/branches of your choosing for protocol + client!

You can ssh right in after and run `A up` - no other setup involved.

```bash
  $ A setup remote-dev --fast <instance-name> [--protocol-git-ref <branch-name-or-commit-hash>] [--client-git-ref <branch-name-or-commit-hash>]
```

Note that you will need to manually confirm the instance creation as well as ssh connection upon startup. Once you've confirmed the ssh connection, that's it -- you can walk away and make a pie and wait for your dev environment to finish provisioning!

Here's an example of how to provision a gcloud instance called `pietocol-team` at protocol branch `cj-quickfix` and client git hash `7cf17667972d4c5d6bc25d08ce1f626c37f9abb7`:

```bash
  $ A setup remote-dev --fast pietocol-team --protocol-git-ref cj-quickfix --client-git-ref 7cf17667972d4c5d6bc25d08ce1f626c37f9abb7
```

Don't forget to delete your instance once you're finished using it with `gcloud compute instances delete <instance-name>`.

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

### Seed
#### Prerequisites
* Provision a local stack via `A up`.
* `cd $PROTOCOL_DIR/service-commands`. All seed CLI service commands must be run from this working dir.

#### Usage
* `A seed help` or `A seed [command] -h` (example: `A seed create-user -h`) for API docs.
* You must run `A seed create-user` at least once to access any other actions.
* For easy reference, user details for login are recorded locally in `~/.audius/seed-cache.json`.
* Because libs is stateful, each action must be performed by a user ("active" user in seed cache). To control this you can pass in a user ID via the `-u` or `--user-id` flag to set the user performing the action.
* To facilitate seeding - when you don't provide certain params (e.g. metadata), random input will be generated for you. Additionally, when you don't provide a user or track ID, for single-user/single-track actions a random ID from current seed cache will be selected. This includes setting active user randomly from cached users.
* The exception for this is destructive actions such as `unfollow-user` and `unrepost-track`, for which you must explicitly specify IDs.
* When you are done seeding (or simply done with a set of actions) you can clear your current cache via `A seed clear`.

#### Troubleshooting
* In general you can have two types of errors here - errors with user input (e.g. you're trying to reference something not in cache, or providing values in the wrong format), and errors with the network requests (e.g. )
* Ensure that your local environment is set up correctly.
* If relying on random user/track ID selection from cache, ensure that you have enough unique values in your seed cache file located in your ~/.audius folder. For actions involving multiple users, ensure that your users are unique.
* If passing in user/track/playlist ID(s) ensure that the IDs exist in current seed cache (for user) / in the DB (for tracks/playlists).
* Slack @christine for help and ideas for improvement.

#### Contributing
* Additional API methods supported by libs classes may be added easily via declaring the API class, method, parameters, and instructions for parsing the parameters/providing default values.
* See [src/commands/seed/cliToCommandMap.js](src/commands/seed/cliToCommandMap.js) for details.

#### Unsupported functionality/TODO
* Uploading images for users/tracks at creation time
* Batch seed for actions beyond `create-user`
* `A seed update-user`
* `A seed remove-playlist-track`
* `--reset-state` flag to clear DB for `A seed clear`
* (maybe?) Read actions e.g. `A seed get-users`
