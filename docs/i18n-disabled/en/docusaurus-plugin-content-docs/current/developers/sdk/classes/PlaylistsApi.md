---
id: "PlaylistsApi"
title: "Playlists"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### getPlaylist

**getPlaylist**(`params`, `initOverrides?`): `Promise`<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>

Get a playlist by ID

1 Example:

```typescript

const playlistResponse = await audiusSdk.playlists.getPlaylist({
    playlistId: "AxRP0",
});

const playlist = playlistReponse.data?.[0];

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetPlaylistRequest`](../interfaces/GetPlaylistRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>

___

### getPlaylistTracks

**getPlaylistTracks**(`params`, `initOverrides?`): `Promise`<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>

Fetch tracks within a playlist.

1 Example:

```typescript

const playlistResponse = await audiusSdk.playlists.getPlaylistTracks({
    playlistId: "AxRP0",
});

const playlistTracks = playlistResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetPlaylistTracksRequest`](../interfaces/GetPlaylistTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>

___

### getTrendingPlaylists

**getTrendingPlaylists**(`params?`, `initOverrides?`): `Promise`<[`TrendingPlaylistsResponse`](../interfaces/TrendingPlaylistsResponse.md)\>

Gets trending playlists for a time period

1 Example:

```typescript

const playlistsResponse = await audiusSdk.playlists.getTrendingPlaylists();

const trendingPlaylists = playlistsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetTrendingPlaylistsRequest`](../interfaces/GetTrendingPlaylistsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TrendingPlaylistsResponse`](../interfaces/TrendingPlaylistsResponse.md)\>

___

### searchPlaylists

**searchPlaylists**(`params`, `initOverrides?`): `Promise`<[`PlaylistSearchResult`](../interfaces/PlaylistSearchResult.md)\>

Search for a playlist

1 Example:

```typescript

const playlistsResponse = await audiusSdk.playlists.searchPlaylists({
    query: 'lo-fi',
});

const playlists = playlistsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`SearchPlaylistsRequest`](../interfaces/SearchPlaylistsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`PlaylistSearchResult`](../interfaces/PlaylistSearchResult.md)\>
