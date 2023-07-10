---
id: "ResolveApi"
title: "Resolve"
sidebar_position: 0
custom_edit_url: null
---

## Methods

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

### resolve

**resolve**(`requestParameters`): `Promise`<[`TrackResponse`](../interfaces/TrackResponse.md) \| [`PlaylistResponse`](../interfaces/PlaylistResponse.md) \| [`UserResponse`](../interfaces/UserResponse.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`ResolveRequest`](../interfaces/ResolveRequest.md) |

#### Returns

`Promise`<[`TrackResponse`](../interfaces/TrackResponse.md) \| [`PlaylistResponse`](../interfaces/PlaylistResponse.md) \| [`UserResponse`](../interfaces/UserResponse.md)\>

___

### resolveRaw

**resolveRaw**(`requestParameters`): `Promise`<[`JSONResponse`](JSONApiResponse.md)<[`TrackResponse`](../interfaces/TrackResponse.md) \| [`PlaylistResponse`](../interfaces/PlaylistResponse.md) \| [`UserResponse`](../interfaces/UserResponse.md)\>\>

Resolves a provided Audius app URL to the API resource it represents

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`ResolveRequest`](../interfaces/ResolveRequest.md) |

#### Returns

`Promise`<[`JSONResponse`](JSONApiResponse.md)<[`TrackResponse`](../interfaces/TrackResponse.md) \| [`PlaylistResponse`](../interfaces/PlaylistResponse.md) \| [`UserResponse`](../interfaces/UserResponse.md)\>\>

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
