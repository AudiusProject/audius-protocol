---
id: "StorageNodeSelector"
title: "StorageNodeSelector"
sidebar_position: 0
custom_edit_url: null
---

## Implements

- [`StorageNodeSelectorService`](../modules.md#storagenodeselectorservice)

## Methods

### checkIfDiscoveryNodeAlreadyAvailable

`Private` **checkIfDiscoveryNodeAlreadyAvailable**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

___

### getNodes

**getNodes**(`cid`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `cid` | `string` |

#### Returns

`string`[]

#### Implementation of

StorageNodeSelectorService.getNodes

___

### getSelectedNode

**getSelectedNode**(): `Promise`<``null`` \| `string`\>

#### Returns

`Promise`<``null`` \| `string`\>

#### Implementation of

StorageNodeSelectorService.getSelectedNode

___

### info

`Private` **info**(...`args`): `void`

console.info proxy utility to add a prefix

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

#### Returns

`void`

___

### onChangeDiscoveryNode

`Private` **onChangeDiscoveryNode**(`endpoint`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `endpoint` | `string` |

#### Returns

`Promise`<`void`\>

___

### orderNodes

`Private` **orderNodes**(`key`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`string`[]

___

### select

`Private` **select**(): `Promise`<``null`` \| `string`\>

#### Returns

`Promise`<``null`` \| `string`\>

___

### warn

`Private` **warn**(...`args`): `void`

console.warn proxy utility to add a prefix

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

#### Returns

`void`
