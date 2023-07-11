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

___

### manageEntity

**manageEntity**(`__namedParameters`): `Promise`<{ `txReceipt`: `TransactionReceipt`  }\>

Calls the manage entity method on chain to update some data

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `ManageEntityOptions` |

#### Returns

`Promise`<{ `txReceipt`: `TransactionReceipt`  }\>

#### Implementation of

EntityManagerService.manageEntity
