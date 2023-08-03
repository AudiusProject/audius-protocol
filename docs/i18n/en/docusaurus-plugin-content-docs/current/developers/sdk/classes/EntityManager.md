---
id: "EntityManager"
title: "EntityManager"
sidebar_position: 0
custom_edit_url: null
---

## Implements

- [`EntityManagerService`](../modules.md#entitymanagerservice)

## Methods

### confirmWrite

**confirmWrite**(`__namedParameters`): `Promise`<`boolean`\>

Confirms a write by polling for the block to be indexed by the selected
discovery node

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Object` |
| `__namedParameters.blockHash` | `string` |
| `__namedParameters.blockNumber` | `number` |
| `__namedParameters.confirmationPollingInterval?` | `number` |
| `__namedParameters.confirmationTimeout?` | `number` |

#### Returns

`Promise`<`boolean`\>

#### Implementation of

EntityManagerService.confirmWrite

___

### getCurrentBlock

**getCurrentBlock**(): `Promise`<{ `timestamp`: `number`  }\>

#### Returns

`Promise`<{ `timestamp`: `number`  }\>

#### Implementation of

EntityManagerService.getCurrentBlock

___

### getRelayEndpoint

**getRelayEndpoint**(): `Promise`<`string`\>

#### Returns

`Promise`<`string`\>

___

### manageEntity

**manageEntity**(`__namedParameters`): `Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

Calls the manage entity method on chain to update some data

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `ManageEntityOptions` |

#### Returns

`Promise`<`Pick`<`TransactionReceipt`, ``"blockHash"`` \| ``"blockNumber"``\>\>

#### Implementation of

EntityManagerService.manageEntity
