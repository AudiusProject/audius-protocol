---
id: "TracksApi"
title: "Tracks"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### getBulkTracks

**getBulkTracks**(`requestParameters?`): `Promise`<[`Track`](../interfaces/Track.md)[]\>

Gets a list of tracks using their IDs or permalinks

Example:

```typescript

const tracks = await audiusSdk.tracks.getBulkTracks();

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetBulkTracksRequest`](../interfaces/GetBulkTracksRequest.md) |

#### Returns

`Promise`<[`Track`](../interfaces/Track.md)[]\>

#### Inherited from

GeneratedTracksApi.getBulkTracks

___

### getTrack

**getTrack**(`requestParameters`): `Promise`<[`Track`](../interfaces/Track.md)\>

Gets a track by ID

Example:

```typescript

const track = await audiusSdk.tracks.getTrack({
    trackId: "D7KyD",
});

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrackRequest`](../interfaces/GetTrackRequest.md) |

#### Returns

`Promise`<[`Track`](../interfaces/Track.md)\>

#### Inherited from

GeneratedTracksApi.getTrack

___

### getTrendingTracks

**getTrendingTracks**(`requestParameters?`): `Promise`<[`Track`](../interfaces/Track.md)[]\>

Gets the top 100 trending (most popular) tracks on Audius

Example:

```typescript

const tracks = await audiusSdk.tracks.getTrendingTracks();

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingTracksRequest`](../interfaces/GetTrendingTracksRequest.md) |

#### Returns

`Promise`<[`Track`](../interfaces/Track.md)[]\>

#### Inherited from

GeneratedTracksApi.getTrendingTracks

___

### searchTracks

**searchTracks**(`requestParameters`): `Promise`<[`Track`](../interfaces/Track.md)[]\>

Search for a track or tracks

Example:

```typescript

const searchResult = await audiusSdk.tracks.searchTracks({
    query: "skrillex",
});

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`SearchTracksRequest`](../interfaces/SearchTracksRequest.md) |

#### Returns

`Promise`<[`Track`](../interfaces/Track.md)[]\>

#### Inherited from

GeneratedTracksApi.searchTracks

___

### streamTrack

**streamTrack**(`requestParameters`): `Promise`<`string`\>

Get the url of the track's streamable mp3 file

Example:

```typescript

const url = await audiusSdk.tracks.streamTrack({
    trackId: "PjdWN",
});
const audio = new Audio(url);
audio.play();

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`StreamTrackRequest`](../interfaces/StreamTrackRequest.md) |

#### Returns

`Promise`<`string`\>
