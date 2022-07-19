---
id: "full.GetTrendingTracksWithVersionRequest"
title: "Interface: GetTrendingTracksWithVersionRequest"
sidebar_label: "GetTrendingTracksWithVersionRequest"
custom_edit_url: null
pagination_prev: null
pagination_next: null
---

[full](../namespaces/full.md).GetTrendingTracksWithVersionRequest

## Properties

### genre

 `Optional` **genre**: `string`

Filter trending to a specified genre

___

### limit

 `Optional` **limit**: `number`

The number of items to fetch

___

### offset

 `Optional` **offset**: `number`

The number of items to skip. Useful for pagination (page number * limit)

___

### time

 `Optional` **time**: [`GetTrendingTracksWithVersionTimeEnum`](../enums/full.GetTrendingTracksWithVersionTimeEnum.md)

Calculate trending over a specified time range

___

### userId

 `Optional` **userId**: `string`

The user ID of the user making the request

___

### version

 **version**: `string`

The strategy version of trending to use
