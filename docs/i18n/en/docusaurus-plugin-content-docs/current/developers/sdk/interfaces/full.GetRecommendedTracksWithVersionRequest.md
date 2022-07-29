---
id: "full.GetRecommendedTracksWithVersionRequest"
title: "Interface: GetRecommendedTracksWithVersionRequest"
sidebar_label: "GetRecommendedTracksWithVersionRequest"
custom_edit_url: null
---

[full](../namespaces/full.md).GetRecommendedTracksWithVersionRequest

## Properties

### exclusionList

 `Optional` **exclusionList**: `number`[]

List of track ids to exclude

___

### genre

 `Optional` **genre**: `string`

Filter trending to a specified genre

___

### limit

 `Optional` **limit**: `number`

The number of items to fetch

___

### time

 `Optional` **time**: [`GetRecommendedTracksWithVersionTimeEnum`](../enums/full.GetRecommendedTracksWithVersionTimeEnum.md)

Calculate trending over a specified time range

___

### userId

 `Optional` **userId**: `string`

The user ID of the user making the request

___

### version

 **version**: `string`

The strategy version of trending to use
