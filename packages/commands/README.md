# audius-cmd

```
audius-cmd --help
audius-cmd <command> --help
```

`audius-cmd` is a command line tool to perform actions against the Audius protocol. It is especially useful to seed data on an instance of the protocol running locally

## Building

This tool needs to be built at least once before running.

`npm run build:dist` will issue a turbo-enabled build and write the output to `dist`.

If you plan on developing commands, you can run `npm run watch:dist` to start a watcher, which will rebuild any time the files in `src` change.

## Examples

**create-user**

```
audius-cmd create-user freddie_mercury
```

**edit-user**

```
audius-cmd edit-user freddie_mercury --bio "easy come easy go"
```

**upload-track**

```
audius-cmd upload-track --from freddie_mercury --title "Bohemian Rhapsody"
```

**edit-track**

```
audius-cmd edit-track <track-id> --title "Bohemian Rhapsody (Reprise)"
```

**create-playlist**

```
audius-cmd create-playlist <track-ids> --from freddie_mercury
```

**edit-playlist**

```
audius-cmd edit-playlist <playlist-id> --name "A Night at the Opera"
```

**favorite-track**

```
audius-cmd favorite-track <track-id>
```

**unfavorite-track**

```
audius-cmd unfavorite-track <track-id>
```

**favorite-playlist**

```
audius-cmd favorite-playlist <playlist-id>
```

**unfavorite-playlist**

```
audius-cmd unfavorite-playlist <playlist-id>
```

**repost-track**

```
audius-cmd repost-track <track-id>
```

**unrepost-track**

```
audius-cmd unrepost-track <track-id>
```

**repost-playlist**

```
audius-cmd repost-playlist <playlist-id>
```

**unrepost-playlist**

```
audius-cmd unrepost-playlist <playlist-id>
```

**mint-audio**

```
audius-cmd mint-audio @freddie_mercury 10
```

**get-audio-balance**

```
audius-cmd get-audio-balance @freddie_mercury
```

**tip-audio**

```
audius-cmd tip-audio @brian_may 10 --from freddie_mercury
```

**purchase-track**

```
audius-cmd upload-track --from freddie_mercury --title "Bohemian Rhapsody" --price 100

audius-cmd create-user-bank --mint usdc freddie_mercury
audius-cmd mint-tokens --from freddie_mercury --mint usdc 10000000

audius-cmd purchase-content <track-id> --type track --from freddie_mercury
```

**Managed accounts**

```
# Add a manager
audius-cmd add-manager --from freddie_mercury jim_beach

# Accept request from manager's account
audius-cmd approve-manager-request --from jim_beach freddie_mercury

# (OR) Reject request from manager's account
audius-cmd reject-manager-request --from jim_beach freddie_mercury

# Remove manager
audius-cmd remove-manager --from freddie_mercury jim_beach
```
