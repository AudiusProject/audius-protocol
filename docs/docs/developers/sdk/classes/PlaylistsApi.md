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

const playlistResponse = await audiusSdk.playlists.getPlaylist({
    playlistId: "AxRP0",
});

const playlist = playlistReponse.data?.[0];

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetPlaylistRequest`](../interfaces/GetPlaylistRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>

#### Inherited from

GeneratedPlaylistsApi.getPlaylist

___

### getPlaylistTracks

**getPlaylistTracks**(`requestParameters`, `initOverrides?`): `Promise`<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>

Fetch tracks within a playlist.

Example:

```typescript

const playlistResponse = await audiusSdk.playlists.getPlaylistTracks({
    playlistId: "AxRP0",
});

const playlistTracks = playlistResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetPlaylistTracksRequest`](../interfaces/GetPlaylistTracksRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>

#### Inherited from

GeneratedPlaylistsApi.getPlaylistTracks

___

### getTrendingPlaylists

**getTrendingPlaylists**(`requestParameters?`, `initOverrides?`): `Promise`<[`TrendingPlaylistsResponse`](../interfaces/TrendingPlaylistsResponse.md)\>

Gets trending playlists for a time period

Example:

```typescript

const playlistsResponse = await audiusSdk.playlists.getTrendingPlaylists();

const trendingPlaylists = playlistsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTrendingPlaylistsRequest`](../interfaces/GetTrendingPlaylistsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TrendingPlaylistsResponse`](../interfaces/TrendingPlaylistsResponse.md)\>

#### Inherited from

GeneratedPlaylistsApi.getTrendingPlaylists

___

### searchPlaylists

**searchPlaylists**(`requestParameters`, `initOverrides?`): `Promise`<[`PlaylistSearchResult`](../interfaces/PlaylistSearchResult.md)\>

Search for a playlist

Example:

```typescript

const playlistsResponse = await audiusSdk.playlists.searchPlaylists({
    query: 'lo-fi',
});

const playlists = playlistsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`SearchPlaylistsRequest`](../interfaces/SearchPlaylistsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`PlaylistSearchResult`](../interfaces/PlaylistSearchResult.md)\>

#### Inherited from

GeneratedPlaylistsApi.searchPlaylists

___

### updatePlaylistInternal

**updatePlaylistInternal**<`Metadata`\>(`__namedParameters`, `writeOptions?`): `Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

Method to update a playlist with already parsed inputs
This is used for both playlists and albums

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Metadata` | extends `Partial`<{ `description`: `undefined` \| `string` ; `genre`: `Genre` ; `license`: `undefined` \| `string` ; `mood`: `undefined` \| [`Mood`](../enums/Mood.md) ; `playlistName`: `string` ; `releaseDate`: `undefined` \| `Date` ; `tags`: `undefined` \| `string` ; `upc`: `undefined` \| `string`  }\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | { `coverArtFile`: `undefined` \| { `buffer`: `Buffer` ; `name`: `undefined` \| `string`  } \| `File` ; `metadata`: { description?: string \| undefined; mood?: Mood \| undefined; tags?: string \| undefined; genre?: Genre \| undefined; license?: string \| undefined; releaseDate?: Date \| undefined; playlistName?: string \| undefined; upc?: string \| undefined; isPrivate?: boolean \| undefined; playlistContents?: { ...; }[] \| undefined; } ; `onProgress`: `undefined` \| (...`args`: [`number`, ...unknown[]]) => `unknown` ; `playlistId`: `number` = HashId; `userId`: `number` = HashId } & { `metadata`: `Metadata`  } |
| `writeOptions?` | `WriteOptions` |

#### Returns

`Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

___

### uploadPlaylistInternal

**uploadPlaylistInternal**<`Metadata`\>(`__namedParameters`, `writeOptions?`): `Promise`<{ `blockHash`: `string` ; `blockNumber`: `number` ; `playlistId`: ``null`` \| `string`  }\>

Method to upload a playlist with already parsed inputs
This is used for both playlists and albums

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Metadata` | extends `Object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | { `coverArtFile`: { `buffer`: `Buffer` ; `name`: `undefined` \| `string`  } & `File` & { `buffer`: `Buffer` ; `name`: `undefined` \| `string`  } & `File` & `File` & { `buffer`: `Buffer` ; `name`: `undefined` \| `string`  } = ImageFile; `metadata`: { genre: Genre; playlistName: string; description?: string \| undefined; license?: string \| undefined; mood?: Mood \| undefined; releaseDate?: Date \| undefined; tags?: string \| undefined; upc?: string \| undefined; } ; `onProgress`: `undefined` \| (...`args`: [`number`, ...unknown[]]) => `unknown` ; `trackFiles`: ({ `buffer`: `Buffer` ; `name`: `undefined` \| `string`  } \| `File`)[] ; `trackMetadatas`: { title: string; aiAttributionUserId?: number \| undefined; description?: string \| undefined; download?: { cid: string; isDownloadable: boolean; requiresFollow: boolean; } \| undefined; fieldVisibility?: { ...; } \| undefined; ... 13 more ...; previewCid?: string \| undefined; }[] ; `userId`: `number` = HashId } & { `metadata`: `Metadata`  } |
| `writeOptions?` | `WriteOptions` |

#### Returns

`Promise`<{ `blockHash`: `string` ; `blockNumber`: `number` ; `playlistId`: ``null`` \| `string`  }\>
