---
id: "AlbumsApi"
title: "Albums"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### getAlbum

**getAlbum**(`params`): `Promise`<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.albumId` | `string` |
| `params.userId` | `string` |

#### Returns

`Promise`<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>

___

### getAlbumTracks

**getAlbumTracks**(`params`): `Promise`<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.albumId` | `string` |

#### Returns

`Promise`<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>
