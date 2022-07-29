---
id: "full.PlaylistsApi"
title: "Playlists"
sidebar_position: 0
custom_edit_url: null
pagination_prev: null
pagination_next: null
---

## Methods

### getPlaylist

**getPlaylist**(`requestParameters`): `Promise`<[`PlaylistFull`](../interfaces/full.PlaylistFull.md)[]\>

Get a playlist by ID

Example:

```typescript

const playlist = await audiusSdk.playlists.getPlaylist({
    playlistId: "AxRP0",
});

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetPlaylistRequest`](../interfaces/full.GetPlaylistRequest.md) |

#### Returns

`Promise`<[`PlaylistFull`](../interfaces/full.PlaylistFull.md)[]\>

___

### getTrendingPlaylists

**getTrendingPlaylists**(`requestParameters?`): `Promise`<[`PlaylistFull`](../interfaces/full.PlaylistFull.md)[]\>

Returns trending playlists for a time period

Example:

```typescript

const playlists = await audiusSdk.playlists.getTrendingPlaylists();

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingPlaylistsRequest`](../interfaces/full.GetTrendingPlaylistsRequest.md) |

#### Returns

`Promise`<[`PlaylistFull`](../interfaces/full.PlaylistFull.md)[]\>

___

### getTrendingPlaylistsWithVersion

**getTrendingPlaylistsWithVersion**(`requestParameters`): `Promise`<[`PlaylistFull`](../interfaces/full.PlaylistFull.md)[]\>

Returns trending playlists for a time period based on the given trending version

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingPlaylistsWithVersionRequest`](../interfaces/full.GetTrendingPlaylistsWithVersionRequest.md) |

#### Returns

`Promise`<[`PlaylistFull`](../interfaces/full.PlaylistFull.md)[]\>

___

### getUsersFromPlaylistFavorites

**getUsersFromPlaylistFavorites**(`requestParameters`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

Get users that favorited a playlist

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUsersFromPlaylistFavoritesRequest`](../interfaces/full.GetUsersFromPlaylistFavoritesRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

___

### getUsersFromPlaylistReposts

**getUsersFromPlaylistReposts**(`requestParameters`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

Get users that reposted a playlist

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUsersFromPlaylistRepostsRequest`](../interfaces/full.GetUsersFromPlaylistRepostsRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>
