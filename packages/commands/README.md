# audius-cmd

```
audius-cmd --help
audius-cmd <command> --help
```

`audius-cmd` is a command line tool to perform actions against the Audius protocol. It is especially useful to seed data on an instance of the protocol running locally

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
