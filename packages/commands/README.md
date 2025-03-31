# audius-cmd

```
audius-cmd help
audius-cmd <command> help
```

`audius-cmd` is a command line tool to perform actions against the Audius protocol. It is especially useful to seed data on an instance of the protocol running locally

## Building

This tool needs to be built at least once before running.

`npm run build:dist` will issue a turbo-enabled build and write the output to `dist`.

If you plan on developing commands, you can run `npm run watch:dist` to start a watcher, which will rebuild any time the files in `src` change.

## Commands

```
Usage: audius-cmd [options] [command]

CLI interface for interacting with a local Audius network.

Options:
  -h, --help                                     display help for command

Commands:
  user                                           Commands that create or target a specific user
  track                                          Commands that create or target a specific track
  playlist                                       Commands that create or target a specific playlist
  album                                          Commands that create or target a specific album
  manager                                        Commands for managing account managers
  auth-headers [options]                         Output auth headers (for use with curl: `curl -H @<(audius-cmd auth-headers)`)
  claim-reward [options] <challengeId> <amount>  Claim a challenge reward
  reward-specifier [options] <challengeId>       Get the specifier for a challenge
  create-user-bank [options] [handle]            Create userbank for a user
  mint [options] <amount>                        Mint $AUDIO or $USDC tokens
  tip-reaction [options] <signature>             Send a tip reaction
  withdraw-tokens [options] <account> <amount>   Send tokens from a user bank to an external address
  help [command]                                 display help for command
```

### User subcommands

```
Usage: audius-cmd user [options] [command]

Commands that create or target a specific user

Options:
  -h, --help                               display help for command

Commands:
  create [options] [handle]                Create a new user
  edit [options] <handle>                  Update an existing user
  follow [options] <followeeUserId>        Follow user
  get [options] <id>                       Get a user by ID
  tip [options] <receiverUserId> <amount>  Tip $AUDIO to a user
  unfollow [options] <followeeUserId>      Unfollow user
  help [command]                           display help for command
```

### Track subcommands

```
Usage: audius-cmd track [options] [command]

Commands that create or target a specific track

Options:
  -h, --help                            display help for command

Commands:
  edit [options] <trackId>              Update an existing track
  favorite [options] <trackId>          Favorite track
  get [options] <trackId>               Get a track by ID
  purchase [options] <trackId> <price>  Buys a track using USDC
  repost [options] <trackId>            Repost track
  unfavorite [options] <trackId>        Unfavorite track
  unrepost [options] <trackId>          Unrepost track
  upload [options] [track]              Upload a new track
  help [command]                        display help for command
```

### Playlist subcommands

```
Usage: audius-cmd playlist [options] [command]

Commands that create or target a specific playlist

Options:
  -h, --help                         display help for command

Commands:
  create [options] <trackIds...>     Create playlist
  edit [options] <playlistId>        Update an existing playlist
  favorite [options] <playlistId>    Favorite playlist
  repost [options] <playlistId>      Repost playlist
  unfavorite [options] <playlistId>  Unfavorite playlist
  unrepost [options] <playlistId>    Unrepost playlist
  help [command]                     display help for command
```

### Album subcommands

```
Usage: audius-cmd album [options] [command]

Commands that create or target a specific album

Options:
  -h, --help                                  display help for command

Commands:
  purchase-album [options] <albumId> <price>  Buys an album using USDC
  help [command]                              display help for command
```

### Manager subcommands

```
Usage: audius-cmd manager [options] [command]

Commands for managing account managers

Options:
  -h, --help                  display help for command

Commands:
  add [options] <handle>      Create a pending manager request for a user
  remove [options] <handle>   Remove a manager
  approve [options] <handle>  Approve a pending manager request
  reject [options] <handle>   Reject a pending manager request
  help [command]              display help for command
```
