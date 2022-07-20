---
id: "full.GetTrendingPlaylistsWithVersionRequest"
title: "Interface: GetTrendingPlaylistsWithVersionRequest"
sidebar_label: "GetTrendingPlaylistsWithVersionRequest"
custom_edit_url: null
---

[full](../namespaces/full.md).GetTrendingPlaylistsWithVersionRequest

## Properties

### limit

 `Optional` **limit**: `number`

The number of items to fetch

___

### offset

 `Optional` **offset**: `number`

The number of items to skip. Useful for pagination (page number * limit)

___

### time

 `Optional` **time**: [`GetTrendingPlaylistsWithVersionTimeEnum`](../enums/full.GetTrendingPlaylistsWithVersionTimeEnum.md)

Calculate trending over a specified time range

___

### userId

 `Optional` **userId**: `string`

The user ID of the user making the request

___

### version

 **version**: `string`

The strategy version of trending to use
