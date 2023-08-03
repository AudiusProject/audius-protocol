---
id: "DeveloperAppsApi"
title: "DeveloperApps"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### createDeveloperApp

**createDeveloperApp**(`params`, `advancedOptions?`): `Promise`<{ `apiKey`: `string` ; `apiSecret`: `string` ; `blockHash`: `string` ; `blockNumber`: `number`  }\>

Create a developer app

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `params` | `Object` | `undefined` |
| `params.description` | `undefined` \| `string` | `undefined` |
| `params.name` | `string` | `undefined` |
| `params.userId` | `string` | `HashId` |
| `advancedOptions?` | `AdvancedOptions` | `undefined` |

#### Returns

`Promise`<{ `apiKey`: `string` ; `apiSecret`: `string` ; `blockHash`: `string` ; `blockNumber`: `number`  }\>

___

### deleteDeveloperApp

**deleteDeveloperApp**(`params`): `Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

Delete a developer app

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `params` | `Object` | `undefined` |
| `params.appApiKey` | `string` | `undefined` |
| `params.userId` | `string` | `HashId` |

#### Returns

`Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

___

### getDeveloperApp

**getDeveloperApp**(`params`, `initOverrides?`): `Promise`<[`DeveloperAppResponse`](../interfaces/DeveloperAppResponse.md)\>

Gets developer app matching given address (API key)

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetDeveloperAppRequest`](../interfaces/GetDeveloperAppRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`DeveloperAppResponse`](../interfaces/DeveloperAppResponse.md)\>
