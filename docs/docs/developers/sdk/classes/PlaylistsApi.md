---
id: "PlaylistsApi"
title: "Playlists"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### getPlaylist

**getPlaylist**(`requestParameters`, `initOverrides?`): `Promise`<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>

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
| `requestParameters` | [`GetPlaylistRequest`](../interfaces/GetPlaylistRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>

___

### getPlaylistRaw

**getPlaylistRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>\>

Get a playlist by ID

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetPlaylistRequest`](../interfaces/GetPlaylistRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>\>

___

### getPlaylistTracks

**getPlaylistTracks**(`requestParameters`, `initOverrides?`): `Promise`<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>

Fetch tracks within a playlist.

Example:

```typescript

const tracks = await audiusSdk.playlists.getPlaylistTracks({
    playlistId: "AxRP0",
});

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetPlaylistTracksRequest`](../interfaces/GetPlaylistTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>

___

### getPlaylistTracksRaw

**getPlaylistTracksRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>\>

Fetch tracks within a playlist.

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetPlaylistTracksRequest`](../interfaces/GetPlaylistTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>\>

___

### getTrendingPlaylists

**getTrendingPlaylists**(`requestParameters?`, `initOverrides?`): `Promise`<[`TrendingPlaylistsResponse`](../interfaces/TrendingPlaylistsResponse.md)\>

Gets trending playlists for a time period

Example:

```typescript

const playlists = await audiusSdk.playlists.getTrendingPlaylists();

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingPlaylistsRequest`](../interfaces/GetTrendingPlaylistsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TrendingPlaylistsResponse`](../interfaces/TrendingPlaylistsResponse.md)\>

___

### getTrendingPlaylistsRaw

**getTrendingPlaylistsRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`TrendingPlaylistsResponse`](../interfaces/TrendingPlaylistsResponse.md)\>\>

Gets trending playlists for a time period

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingPlaylistsRequest`](../interfaces/GetTrendingPlaylistsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`TrendingPlaylistsResponse`](../interfaces/TrendingPlaylistsResponse.md)\>\>

___

### request

`Protected` **request**(`context`, `initOverrides?`): `Promise`<`Response`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`RequestOpts`](../interfaces/RequestOpts.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<`Response`\>

#### Inherited from

[BaseAPI](BaseAPI.md).[request](BaseAPI.md#request)

___

### searchPlaylists

**searchPlaylists**(`requestParameters`, `initOverrides?`): `Promise`<[`PlaylistSearchResult`](../interfaces/PlaylistSearchResult.md)\>

Search for a playlist

Example:

```typescript

const playlists = await audiusSdk.playlists.searchPlaylists({
    query: 'lo-fi',
});

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`SearchPlaylistsRequest`](../interfaces/SearchPlaylistsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`PlaylistSearchResult`](../interfaces/PlaylistSearchResult.md)\>

___

### searchPlaylistsRaw

**searchPlaylistsRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`PlaylistSearchResult`](../interfaces/PlaylistSearchResult.md)\>\>

Search for a playlist

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`SearchPlaylistsRequest`](../interfaces/SearchPlaylistsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`PlaylistSearchResult`](../interfaces/PlaylistSearchResult.md)\>\>

___

### withMiddleware

**withMiddleware**<`T`\>(`this`, ...`middlewares`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`BaseAPI`](BaseAPI.md)<`T`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `this` | `T` |
| `...middlewares` | [`Middleware`](../interfaces/Middleware.md)[] |

#### Returns

`T`

#### Inherited from

[BaseAPI](BaseAPI.md).[withMiddleware](BaseAPI.md#withmiddleware)

___

### withPostMiddleware

**withPostMiddleware**<`T`\>(`this`, ...`postMiddlewares`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`BaseAPI`](BaseAPI.md)<`T`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `this` | `T` |
| `...postMiddlewares` | (`undefined` \| (`context`: [`ResponseContext`](../interfaces/ResponseContext.md)) => `Promise`<`void` \| `Response`\>)[] |

#### Returns

`T`

#### Inherited from

[BaseAPI](BaseAPI.md).[withPostMiddleware](BaseAPI.md#withpostmiddleware)

___

### withPreMiddleware

**withPreMiddleware**<`T`\>(`this`, ...`preMiddlewares`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`BaseAPI`](BaseAPI.md)<`T`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `this` | `T` |
| `...preMiddlewares` | (`undefined` \| (`context`: [`RequestContext`](../interfaces/RequestContext.md)) => `Promise`<`void` \| [`FetchParams`](../interfaces/FetchParams.md)\>)[] |

#### Returns

`T`

#### Inherited from

[BaseAPI](BaseAPI.md).[withPreMiddleware](BaseAPI.md#withpremiddleware)
