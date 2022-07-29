---
id: "full.SearchAutocompleteRequest"
title: "Interface: SearchAutocompleteRequest"
sidebar_label: "SearchAutocompleteRequest"
custom_edit_url: null
pagination_prev: null
pagination_next: null
---

[full](../namespaces/full.md).SearchAutocompleteRequest

## Properties

### kind

 `Optional` **kind**: [`SearchAutocompleteKindEnum`](../enums/full.SearchAutocompleteKindEnum.md)

The type of response, one of: all, users, tracks, playlists, or albums

___

### limit

 `Optional` **limit**: `number`

The number of items to fetch

___

### offset

 `Optional` **offset**: `number`

The number of items to skip. Useful for pagination (page number * limit)

___

### query

 **query**: `string`

The search query

___

### userId

 `Optional` **userId**: `string`

The user ID of the user making the request
