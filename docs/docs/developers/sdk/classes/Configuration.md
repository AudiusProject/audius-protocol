---
id: "Configuration"
title: "Configuration"
sidebar_position: 0
custom_edit_url: null
---

## Accessors

### accessToken

`get` **accessToken**(): `undefined` \| (`name?`: `string`, `scopes?`: `string`[]) => `string` \| `Promise`<`string`\>

#### Returns

`undefined` \| (`name?`: `string`, `scopes?`: `string`[]) => `string` \| `Promise`<`string`\>

___

### apiKey

`get` **apiKey**(): `undefined` \| (`name`: `string`) => `string`

#### Returns

`undefined` \| (`name`: `string`) => `string`

___

### basePath

`get` **basePath**(): `string`

#### Returns

`string`

___

### config

`set` **config**(`configuration`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `configuration` | [`Configuration`](Configuration.md) |

#### Returns

`void`

___

### credentials

`get` **credentials**(): `undefined` \| `RequestCredentials`

#### Returns

`undefined` \| `RequestCredentials`

___

### fetchApi

`get` **fetchApi**(): `undefined` \| (`input`: `RequestInfo`, `init?`: `RequestInit`) => `Promise`<`Response`\>

#### Returns

`undefined` \| (`input`: `RequestInfo`, `init?`: `RequestInit`) => `Promise`<`Response`\>

___

### headers

`get` **headers**(): `undefined` \| [`HTTPHeaders`](../modules.md#httpheaders)

#### Returns

`undefined` \| [`HTTPHeaders`](../modules.md#httpheaders)

___

### middleware

`get` **middleware**(): [`Middleware`](../interfaces/Middleware.md)[]

#### Returns

[`Middleware`](../interfaces/Middleware.md)[]

___

### password

`get` **password**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

___

### queryParamsStringify

`get` **queryParamsStringify**(): (`params`: [`HTTPQuery`](../modules.md#httpquery)) => `string`

#### Returns

`fn`

(`params`): `string`

##### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`HTTPQuery`](../modules.md#httpquery) |

##### Returns

`string`

___

### username

`get` **username**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`
