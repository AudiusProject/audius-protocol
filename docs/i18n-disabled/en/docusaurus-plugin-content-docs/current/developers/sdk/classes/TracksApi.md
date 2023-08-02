---
id: "TracksApi"
title: "Tracks"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### getBulkTracks

**getBulkTracks**(`params?`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

Gets a list of tracks using their IDs or permalinks

1 Example:

```typescript

const tracksResponse = await audiusSdk.tracks.getBulkTracks({ id: ['D7KyD', 'PjdWN', 'Jwo2A'] });
const tracks = tracksResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetBulkTracksRequest`](../interfaces/GetBulkTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

___

### getTrack

**getTrack**(`params`, `initOverrides?`): `Promise`<[`TrackResponse`](../interfaces/TrackResponse.md)\>

Gets a track by ID

1 Example:

```typescript

const trackResponse = await audiusSdk.tracks.getTrack({
    trackId: "D7KyD",
});

const track = trackResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetTrackRequest`](../interfaces/GetTrackRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TrackResponse`](../interfaces/TrackResponse.md)\>

___

### getTrendingTracks

**getTrendingTracks**(`params?`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

Gets the top 100 trending (most popular) tracks on Audius

1 Example:

```typescript

const tracksResponse = await audiusSdk.tracks.getTrendingTracks();
const tracks = tracksResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetTrendingTracksRequest`](../interfaces/GetTrendingTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

___

### getUndergroundTrendingTracks

**getUndergroundTrendingTracks**(`params?`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

Gets the top 100 trending underground tracks on Audius

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetUndergroundTrendingTracksRequest`](../interfaces/GetUndergroundTrendingTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

___

### searchTracks

**searchTracks**(`params`, `initOverrides?`): `Promise`<[`TrackSearch`](../interfaces/TrackSearch.md)\>

Search for a track or tracks

1 Example:

```typescript

const searchResponse = await audiusSdk.tracks.searchTracks({
    query: "skrillex",
});
const searchResults = searchResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`SearchTracksRequest`](../interfaces/SearchTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TrackSearch`](../interfaces/TrackSearch.md)\>

___

### streamTrack

**streamTrack**(`params`): `Promise`<`string`\>

Get the url of the track's streamable mp3 file

1 Example:

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
| `params` | [`StreamTrackRequest`](../interfaces/StreamTrackRequest.md) |

#### Returns

`Promise`<`string`\>

#### Overrides

GeneratedTracksApi.streamTrack
