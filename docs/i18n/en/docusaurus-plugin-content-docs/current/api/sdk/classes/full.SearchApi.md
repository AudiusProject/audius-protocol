---
id: "full.SearchApi"
title: "Search"
sidebar_position: 0
custom_edit_url: null
pagination_prev: null
pagination_next: null
---

## Methods

### search

**search**(`requestParameters`): `Promise`<[`SearchModel`](../interfaces/full.SearchModel.md)\>

Get Users/Tracks/Playlists/Albums that best match the search query

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`SearchRequest`](../interfaces/full.SearchRequest.md) |

#### Returns

`Promise`<[`SearchModel`](../interfaces/full.SearchModel.md)\>

___

### searchAutocomplete

**searchAutocomplete**(`requestParameters`): `Promise`<[`SearchModel`](../interfaces/full.SearchModel.md)\>

Same as search but optimized for quicker response at the cost of some entity information.
Get Users/Tracks/Playlists/Albums that best match the search query

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`SearchAutocompleteRequest`](../interfaces/full.SearchAutocompleteRequest.md) |

#### Returns

`Promise`<[`SearchModel`](../interfaces/full.SearchModel.md)\>
