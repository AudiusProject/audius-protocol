---
id: "RendezvousHash"
title: "RendezvousHash"
sidebar_position: 0
custom_edit_url: null
---

TypeScript equivalent of https://github.com/tysonmote/rendezvous/blob/be0258dbbd3d/rendezvous.go

## Methods

### add

**add**(...`nodes`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...nodes` | `string`[] |

#### Returns

`void`

___

### get

**get**(`key`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`string`

___

### getN

**getN**(`n`, `key`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `n` | `number` |
| `key` | `string` |

#### Returns

`string`[]

___

### getNodes

**getNodes**(): `string`[]

#### Returns

`string`[]

___

### hash

`Private` **hash**(`node`, `key`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | `Buffer` |
| `key` | `Buffer` |

#### Returns

`number`
