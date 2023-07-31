---
id: "TracksApi"
title: "Tracks"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### getBulkTracks

**getBulkTracks**(`requestParameters?`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

Gets a list of tracks using their IDs or permalinks

Example:

```typescript

const tracksResponse = await audiusSdk.tracks.getBulkTracks({ id: ['D7KyD', 'PjdWN', 'Jwo2A'] });
const tracks = tracksResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetBulkTracksRequest`](../interfaces/GetBulkTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

#### Inherited from

GeneratedTracksApi.getBulkTracks

___

### getTrack

**getTrack**(`requestParameters`, `initOverrides?`): `Promise`<[`TrackResponse`](../interfaces/TrackResponse.md)\>

Gets a track by ID

Example:

```typescript

const trackResponse = await audiusSdk.tracks.getTrack({
    trackId: "D7KyD",
});

const track = trackResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrackRequest`](../interfaces/GetTrackRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TrackResponse`](../interfaces/TrackResponse.md)\>

#### Inherited from

GeneratedTracksApi.getTrack

___

### getTrendingTracks

**getTrendingTracks**(`requestParameters?`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

Gets the top 100 trending (most popular) tracks on Audius

Example:

```typescript

const tracksResponse = await audiusSdk.tracks.getTrendingTracks();
const tracks = tracksResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingTracksRequest`](../interfaces/GetTrendingTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

#### Inherited from

GeneratedTracksApi.getTrendingTracks

___

### getUndergroundTrendingTracks

**getUndergroundTrendingTracks**(`requestParameters?`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

Gets the top 100 trending underground tracks on Audius

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUndergroundTrendingTracksRequest`](../interfaces/GetUndergroundTrendingTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

#### Inherited from

GeneratedTracksApi.getUndergroundTrendingTracks

___

### searchTracks

**searchTracks**(`requestParameters`, `initOverrides?`): `Promise`<[`TrackSearch`](../interfaces/TrackSearch.md)\>

Search for a track or tracks

Example:

```typescript

const searchResponse = await audiusSdk.tracks.searchTracks({
    query: "skrillex",
});
const searchResults = searchResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`SearchTracksRequest`](../interfaces/SearchTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TrackSearch`](../interfaces/TrackSearch.md)\>

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

#### Overrides

GeneratedTracksApi.streamTrack
