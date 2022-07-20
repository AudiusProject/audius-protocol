---
id: "full.SearchRequest"
title: "Interface: SearchRequest"
sidebar_label: "SearchRequest"
custom_edit_url: null
---

[full](../namespaces/full.md).SearchRequest

## Properties

### kind

 `Optional` **kind**: [`SearchKindEnum`](../enums/full.SearchKindEnum.md)

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
