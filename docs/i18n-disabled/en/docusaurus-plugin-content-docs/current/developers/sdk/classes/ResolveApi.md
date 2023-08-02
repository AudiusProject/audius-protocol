---
id: "ResolveApi"
title: "Resolve"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### resolve

**resolve**(`params`): `Promise`<[`TrackResponse`](../interfaces/TrackResponse.md) \| [`PlaylistResponse`](../interfaces/PlaylistResponse.md) \| [`UserResponse`](../interfaces/UserResponse.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`ResolveRequest`](../interfaces/ResolveRequest.md) |

#### Returns

`Promise`<[`TrackResponse`](../interfaces/TrackResponse.md) \| [`PlaylistResponse`](../interfaces/PlaylistResponse.md) \| [`UserResponse`](../interfaces/UserResponse.md)\>

___

### resolveRaw

**resolveRaw**(`params`): `Promise`<[`JSONResponse`](JSONApiResponse.md)<[`TrackResponse`](../interfaces/TrackResponse.md) \| [`PlaylistResponse`](../interfaces/PlaylistResponse.md) \| [`UserResponse`](../interfaces/UserResponse.md)\>\>

Resolves a provided Audius app URL to the API resource it represents

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`ResolveRequest`](../interfaces/ResolveRequest.md) |

#### Returns

`Promise`<[`JSONResponse`](JSONApiResponse.md)<[`TrackResponse`](../interfaces/TrackResponse.md) \| [`PlaylistResponse`](../interfaces/PlaylistResponse.md) \| [`UserResponse`](../interfaces/UserResponse.md)\>\>
