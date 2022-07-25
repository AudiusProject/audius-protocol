---
id: "full.TracksApi"
title: "Tracks"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### bestNewReleases

**bestNewReleases**(): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Gets the tracks found on the \"Best New Releases\" smart playlist

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getBulkTracks

**getBulkTracks**(`requestParameters?`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)\>

Gets a list of tracks using their IDs or permalinks

Example:

```typescript

const tracks = await audiusSdk.tracks.getBulkTracks();

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetBulkTracksRequest`](../interfaces/full.GetBulkTracksRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)\>

___

### getMostLovedTracks

**getMostLovedTracks**(`requestParameters?`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Gets the tracks found on the \"Most Loved\" smart playlist

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetMostLovedTracksRequest`](../interfaces/full.GetMostLovedTracksRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getRecommendedTracks

**getRecommendedTracks**(`requestParameters?`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Get recommended tracks

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetRecommendedTracksRequest`](../interfaces/full.GetRecommendedTracksRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getRecommendedTracksWithVersion

**getRecommendedTracksWithVersion**(`requestParameters`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Get recommended tracks using the given trending strategy version

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetRecommendedTracksWithVersionRequest`](../interfaces/full.GetRecommendedTracksWithVersionRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getRemixableTracks

**getRemixableTracks**(`requestParameters?`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)\>

Gets a list of tracks that have stems available for remixing

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetRemixableTracksRequest`](../interfaces/full.GetRemixableTracksRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)\>

___

### getTrack

**getTrack**(`requestParameters`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)\>

Gets a track by ID. If `show_unlisted` is true, then `handle` and `url_title` are required.

Example:

```typescript

const track = await audiusSdk.tracks.getTrack({
    trackId: "D7KyD",
});

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrackRequest`](../interfaces/full.GetTrackRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)\>

___

### getTrackRemixParents

**getTrackRemixParents**(`requestParameters`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Gets all the tracks that the given track remixes

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrackRemixParentsRequest`](../interfaces/full.GetTrackRemixParentsRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getTrackRemixes

**getTrackRemixes**(`requestParameters`): `Promise`<[`RemixesResponse`](../interfaces/full.RemixesResponse.md)\>

Get all tracks that remix the given track

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrackRemixesRequest`](../interfaces/full.GetTrackRemixesRequest.md) |

#### Returns

`Promise`<[`RemixesResponse`](../interfaces/full.RemixesResponse.md)\>

___

### getTrackStems

**getTrackStems**(`requestParameters`): `Promise`<[`StemFull`](../interfaces/full.StemFull.md)[]\>

Get the remixable stems of a track

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrackStemsRequest`](../interfaces/full.GetTrackStemsRequest.md) |

#### Returns

`Promise`<[`StemFull`](../interfaces/full.StemFull.md)[]\>

___

### getTrendingTrackIDs

**getTrendingTrackIDs**(`requestParameters?`): `Promise`<[`TrendingTimesIds`](../interfaces/full.TrendingTimesIds.md)\>

Gets the track IDs of the top trending tracks on Audius

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingTrackIDsRequest`](../interfaces/full.GetTrendingTrackIDsRequest.md) |

#### Returns

`Promise`<[`TrendingTimesIds`](../interfaces/full.TrendingTimesIds.md)\>

___

### getTrendingTracks

**getTrendingTracks**(`requestParameters?`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Gets the top 100 trending (most popular) tracks on Audius

Example:

```typescript

const tracks = await audiusSdk.tracks.getTrendingTracks();

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingTracksRequest`](../interfaces/full.GetTrendingTracksRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getTrendingTracksIDsWithVersion

**getTrendingTracksIDsWithVersion**(`requestParameters`): `Promise`<[`TrendingTimesIds`](../interfaces/full.TrendingTimesIds.md)\>

Gets the track IDs of the top trending tracks on Audius based on the given trending strategy version

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingTracksIDsWithVersionRequest`](../interfaces/full.GetTrendingTracksIDsWithVersionRequest.md) |

#### Returns

`Promise`<[`TrendingTimesIds`](../interfaces/full.TrendingTimesIds.md)\>

___

### getTrendingTracksWithVersion

**getTrendingTracksWithVersion**(`requestParameters`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Gets the top 100 trending (most popular tracks on Audius using a given trending strategy version

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingTracksWithVersionRequest`](../interfaces/full.GetTrendingTracksWithVersionRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getUnderTheRadarTracks

**getUnderTheRadarTracks**(`requestParameters?`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Gets the tracks found on the \"Under the Radar\" smart playlist

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUnderTheRadarTracksRequest`](../interfaces/full.GetUnderTheRadarTracksRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getUndergroundTrendingTracks

**getUndergroundTrendingTracks**(`requestParameters?`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Gets the top 100 trending underground tracks on Audius

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUndergroundTrendingTracksRequest`](../interfaces/full.GetUndergroundTrendingTracksRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getUndergroundTrendingTracksWithVersion

**getUndergroundTrendingTracksWithVersion**(`requestParameters`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Gets the top 100 trending underground tracks on Audius using a given trending strategy version

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUndergroundTrendingTracksWithVersionRequest`](../interfaces/full.GetUndergroundTrendingTracksWithVersionRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getUsersFromFavorites

**getUsersFromFavorites**(`requestParameters`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

Get users that favorited a track

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUsersFromFavoritesRequest`](../interfaces/full.GetUsersFromFavoritesRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

___

### getUsersFromReposts

**getUsersFromReposts**(`requestParameters`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

Get the users that reposted a track

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUsersFromRepostsRequest`](../interfaces/full.GetUsersFromRepostsRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>
