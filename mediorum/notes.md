## TODO

* middleware to check that internal api calls come from a wallet in the peer list
* peer list providers (file, url, The Graph, eth mainnet) + dynamic peer list with refresh interval
* Dedicated endpionts for images vs audio... audio has JWT access control... signer list (like peer list of servers who can make a JWT to access a mp3 i.e. discovery nodes)
* cli to start single client + pmgo file to start a local dev network

**transcode + replication improvements**

* instead of special suffixes (like `abc123_320kbps`)... make all blobs content addressable.
  transcode store the hash association in the `TranscodeResults` map like `{"320kpbs": "def789"}`
* instead of ReadSeeker... write results to a file... this way we don't have to do `Seek(0,0)` which will make it easier to replicate to peers in parallel.
* replicate to peers in parallel

## Concerns

* crud sync + backfill code might loose events: I tried to carefully code the crudr client to try to backfill on boot and stream updates after that... but I didn't exactly run a jepsen test on it and it would most surely fail.  This is a valid concern.  I think we can add a "full sync" operation that can run periodically similar to blob repair that sends all the known op ulid values from one server to another... the other server responds with the ulids it has and it wants and then those missing records are syncronized.
* out of order update events could clobber newer records:  This is a valid concern and is also a concern with jetstream KV (if you don't use their provision for providing a version number to update).  I think we should add a `ulid` field to all models that are managed by `crudr` and update will only proceed if op ulid is greater than stored ulid.
* bad actor could clobber data: this is probably an even greater concern with NATS... but is present in crudr too... I think we can also add some rules to create + delete such that you can only do it for your `host` and not others.  Things are trickeir in the "update" case.  Probably the best bet is to have some code that can delete all ops from a host after a given point in time and then re-construct the tables... similar to revert logic.


