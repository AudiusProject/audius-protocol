---
id: "full.GetUnderTheRadarTracksRequest"
title: "Interface: GetUnderTheRadarTracksRequest"
sidebar_label: "GetUnderTheRadarTracksRequest"
custom_edit_url: null
---

[full](../namespaces/full.md).GetUnderTheRadarTracksRequest

## Properties

### filter

 `Optional` **filter**: [`GetUnderTheRadarTracksFilterEnum`](../enums/full.GetUnderTheRadarTracksFilterEnum.md)

Filters for activity that is original vs reposts

___

### limit

 `Optional` **limit**: `number`

The number of items to fetch

___

### offset

 `Optional` **offset**: `number`

The number of items to skip. Useful for pagination (page number * limit)

___

### tracksOnly

 `Optional` **tracksOnly**: `boolean`

Whether to only include tracks

___

### userId

 `Optional` **userId**: `string`

The user ID of the user making the request

___

### withUsers

 `Optional` **withUsers**: `boolean`

Boolean to include user info with tracks
