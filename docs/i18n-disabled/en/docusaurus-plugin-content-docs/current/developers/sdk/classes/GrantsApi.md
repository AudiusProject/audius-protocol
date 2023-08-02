---
id: "GrantsApi"
title: "Grants"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### createGrant

**createGrant**(`params`): `Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

When user authorizes app to perform actions on their behalf

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `params` | `Object` | `undefined` |
| `params.appApiKey` | `string` | `undefined` |
| `params.userId` | `string` | `HashId` |

#### Returns

`Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

___

### revokeGrant

**revokeGrant**(`params`): `Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

When user revokes an app's authorization to perform actions on their behalf

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `params` | `Object` | `undefined` |
| `params.appApiKey` | `string` | `undefined` |
| `params.userId` | `string` | `HashId` |

#### Returns

`Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>
