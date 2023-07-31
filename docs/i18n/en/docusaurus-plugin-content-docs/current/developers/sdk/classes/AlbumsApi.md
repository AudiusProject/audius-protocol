---
id: "AlbumsApi"
title: "Albums"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### getAlbum

**getAlbum**(`requestParameters`): `Promise`<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | `Object` |
| `requestParameters.albumId` | `string` |
| `requestParameters.userId` | `string` |

#### Returns

`Promise`<[`PlaylistResponse`](../interfaces/PlaylistResponse.md)\>

___

### getAlbumTracks

**getAlbumTracks**(`requestParameters`): `Promise`<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | `Object` |
| `requestParameters.albumId` | `string` |

#### Returns

`Promise`<[`PlaylistTracksResponse`](../interfaces/PlaylistTracksResponse.md)\>
