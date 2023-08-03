---
id: "ConfigurationParameters"
title: "Interface: ConfigurationParameters"
sidebar_label: "ConfigurationParameters"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### accessToken

 `Optional` **accessToken**: `string` \| `Promise`<`string`\> \| (`name?`: `string`, `scopes?`: `string`[]) => `string` \| `Promise`<`string`\>

___

### apiKey

 `Optional` **apiKey**: `string` \| (`name`: `string`) => `string`

___

### basePath

 `Optional` **basePath**: `string`

___

### credentials

 `Optional` **credentials**: `RequestCredentials`

___

### fetchApi

 `Optional` **fetchApi**: (`input`: `RequestInfo`, `init?`: `RequestInit`) => `Promise`<`Response`\>

#### Type declaration

(`input`, `init?`): `Promise`<`Response`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `RequestInfo` |
| `init?` | `RequestInit` |

##### Returns

`Promise`<`Response`\>

___

### headers

 `Optional` **headers**: [`HTTPHeaders`](../modules.md#httpheaders)

___

### middleware

 `Optional` **middleware**: [`Middleware`](Middleware.md)[]

___

### password

 `Optional` **password**: `string`

___

### username

 `Optional` **username**: `string`

## Methods

### queryParamsStringify

`Optional` **queryParamsStringify**(`params`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`HTTPQuery`](../modules.md#httpquery) |

#### Returns

`string`
