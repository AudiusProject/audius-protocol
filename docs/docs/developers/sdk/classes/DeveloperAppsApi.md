---
id: "DeveloperAppsApi"
title: "DeveloperApps"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### createDeveloperApp

**createDeveloperApp**(`requestParameters`, `writeOptions?`): `Promise`<{ `apiKey`: `string` ; `apiSecret`: `string` ; `blockHash`: `string` ; `blockNumber`: `number`  }\>

Create a developer app

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `requestParameters` | `Object` | `undefined` |
| `requestParameters.description` | `undefined` \| `string` | `undefined` |
| `requestParameters.name` | `string` | `undefined` |
| `requestParameters.userId` | `string` | `HashId` |
| `writeOptions?` | `WriteOptions` | `undefined` |

#### Returns

`Promise`<{ `apiKey`: `string` ; `apiSecret`: `string` ; `blockHash`: `string` ; `blockNumber`: `number`  }\>

___

### deleteDeveloperApp

**deleteDeveloperApp**(`requestParameters`): `Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

Delete a developer app

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `requestParameters` | `Object` | `undefined` |
| `requestParameters.appApiKey` | `string` | `undefined` |
| `requestParameters.userId` | `string` | `HashId` |

#### Returns

`Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

___

### getDeveloperApp

**getDeveloperApp**(`requestParameters`, `initOverrides?`): `Promise`<[`DeveloperAppResponse`](../interfaces/DeveloperAppResponse.md)\>

Gets developer app matching given address (API key)

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetDeveloperAppRequest`](../interfaces/GetDeveloperAppRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`DeveloperAppResponse`](../interfaces/DeveloperAppResponse.md)\>

#### Inherited from

GeneratedDeveloperAppsApi.getDeveloperApp
