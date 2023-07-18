---
id: "TracksApi"
title: "Tracks"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### deleteTrack

**deleteTrack**(`requestParameters`, `writeOptions?`): `Promise`<`TransactionReceipt`\>

Delete a track

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `requestParameters` | `Object` | `undefined` |
| `requestParameters.trackId` | `string` | `HashId` |
| `requestParameters.userId` | `string` | `HashId` |
| `writeOptions?` | `WriteOptions` | `undefined` |

#### Returns

`Promise`<`TransactionReceipt`\>

___

### repostTrack

**repostTrack**(`requestParameters`, `writeOptions?`): `Promise`<`TransactionReceipt`\>

Repost a track

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `requestParameters` | `Object` | `undefined` |
| `requestParameters.metadata` | `undefined` \| { `isRepostOfRepost`: `boolean`  } | `undefined` |
| `requestParameters.trackId` | `string` | `HashId` |
| `requestParameters.userId` | `string` | `HashId` |
| `writeOptions?` | `WriteOptions` | `undefined` |

#### Returns

`Promise`<`TransactionReceipt`\>

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

TracksApiWithoutStream.request

___

### saveTrack

**saveTrack**(`requestParameters`, `writeOptions?`): `Promise`<`TransactionReceipt`\>

Favorite a track

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `requestParameters` | `Object` | `undefined` |
| `requestParameters.metadata` | `undefined` \| { `isSaveOfRepost`: `boolean`  } | `undefined` |
| `requestParameters.trackId` | `string` | `HashId` |
| `requestParameters.userId` | `string` | `HashId` |
| `writeOptions?` | `WriteOptions` | `undefined` |

#### Returns

`Promise`<`TransactionReceipt`\>

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

___

### unrepostTrack

**unrepostTrack**(`requestParameters`, `writeOptions?`): `Promise`<`TransactionReceipt`\>

Unrepost a track

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `requestParameters` | `Object` | `undefined` |
| `requestParameters.trackId` | `string` | `HashId` |
| `requestParameters.userId` | `string` | `HashId` |
| `writeOptions?` | `WriteOptions` | `undefined` |

#### Returns

`Promise`<`TransactionReceipt`\>

___

### unsaveTrack

**unsaveTrack**(`requestParameters`, `writeOptions?`): `Promise`<`TransactionReceipt`\>

Unfavorite a track

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `requestParameters` | `Object` | `undefined` |
| `requestParameters.trackId` | `string` | `HashId` |
| `requestParameters.userId` | `string` | `HashId` |
| `writeOptions?` | `WriteOptions` | `undefined` |

#### Returns

`Promise`<`TransactionReceipt`\>

___

### updateTrack

**updateTrack**(`requestParameters`, `writeOptions?`): `Promise`<{ `blockHash`: `string` = txReceipt.blockHash; `blockNumber`: `number` = txReceipt.blockNumber }\>

Update a track

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`UpdateTrackRequest`](../modules.md#updatetrackrequest) |
| `writeOptions?` | `WriteOptions` |

#### Returns

`Promise`<{ `blockHash`: `string` = txReceipt.blockHash; `blockNumber`: `number` = txReceipt.blockNumber }\>

___

### uploadTrack

**uploadTrack**(`requestParameters`, `writeOptions?`): `Promise`<{ `blockHash`: `string` = txReceipt.blockHash; `blockNumber`: `number` = txReceipt.blockNumber; `trackId`: `number`  }\>

Upload a track

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`UploadTrackRequest`](../modules.md#uploadtrackrequest) |
| `writeOptions?` | `WriteOptions` |

#### Returns

`Promise`<{ `blockHash`: `string` = txReceipt.blockHash; `blockNumber`: `number` = txReceipt.blockNumber; `trackId`: `number`  }\>

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

TracksApiWithoutStream.withMiddleware

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

TracksApiWithoutStream.withPostMiddleware

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

TracksApiWithoutStream.withPreMiddleware
