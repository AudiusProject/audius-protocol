---
id: "Middleware"
title: "Interface: Middleware"
sidebar_label: "Middleware"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### onError

`Optional` **onError**(`context`): `Promise`<`void` \| `Response`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`ErrorContext`](ErrorContext.md) |

#### Returns

`Promise`<`void` \| `Response`\>

___

### post

`Optional` **post**(`context`): `Promise`<`void` \| `Response`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`ResponseContext`](ResponseContext.md) |

#### Returns

`Promise`<`void` \| `Response`\>

___

### pre

`Optional` **pre**(`context`): `Promise`<`void` \| [`FetchParams`](FetchParams.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`RequestContext`](RequestContext.md) |

#### Returns

`Promise`<`void` \| [`FetchParams`](FetchParams.md)\>
