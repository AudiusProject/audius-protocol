---
id: "full.GetTrendingTracksRequest"
title: "Interface: GetTrendingTracksRequest"
sidebar_label: "GetTrendingTracksRequest"
custom_edit_url: null
---

[full](../namespaces/full.md).GetTrendingTracksRequest

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

 `Optional` **time**: [`GetTrendingTracksTimeEnum`](../enums/full.GetTrendingTracksTimeEnum.md)

Calculate trending over a specified time range

___

### userId

 `Optional` **userId**: `string`

The user ID of the user making the request
