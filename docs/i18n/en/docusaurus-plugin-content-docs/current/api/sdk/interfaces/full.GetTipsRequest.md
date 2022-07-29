---
id: "full.GetTipsRequest"
title: "Interface: GetTipsRequest"
sidebar_label: "GetTipsRequest"
custom_edit_url: null
pagination_prev: null
pagination_next: null
---

[full](../namespaces/full.md).GetTipsRequest

## Properties

### currentUserFollows

 `Optional` **currentUserFollows**: [`GetTipsCurrentUserFollowsEnum`](../enums/full.GetTipsCurrentUserFollowsEnum.md)

Only include tips involving the user\&#39;s followers in the given capacity. Requires user_id to be set.

___

### limit

 `Optional` **limit**: `number`

The number of items to fetch

___

### maxSlot

 `Optional` **maxSlot**: `number`

The maximum Solana slot to pull tips from

___

### minSlot

 `Optional` **minSlot**: `number`

The minimum Solana slot to pull tips from

___

### offset

 `Optional` **offset**: `number`

The number of items to skip. Useful for pagination (page number * limit)

___

### receiverIsVerified

 `Optional` **receiverIsVerified**: `boolean`

Only include tips to recipients that are verified

___

### receiverMinFollowers

 `Optional` **receiverMinFollowers**: `number`

Only include tips to recipients that have this many followers

___

### txSignatures

 `Optional` **txSignatures**: `string`[]

A list of transaction signatures of tips to fetch

___

### uniqueBy

 `Optional` **uniqueBy**: [`GetTipsUniqueByEnum`](../enums/full.GetTipsUniqueByEnum.md)

Only include the most recent tip for a user was involved in the given capacity.  Eg. \&#39;sender\&#39; will ensure that each tip returned has a unique sender, using the most recent tip sent by a user if that user has sent multiple tips.

___

### userId

 `Optional` **userId**: `string`

The user ID of the user making the request
