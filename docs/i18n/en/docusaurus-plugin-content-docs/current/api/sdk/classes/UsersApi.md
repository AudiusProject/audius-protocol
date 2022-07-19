---
id: "UsersApi"
title: "Users"
sidebar_position: 0
custom_edit_url: null
pagination_prev: null
pagination_next: null
---

## Methods

### getConnectedWallets

**getConnectedWallets**(`requestParameters`): `Promise`<[`ConnectedWallets`](../interfaces/ConnectedWallets.md)\>

Get the User's ERC and SPL connected wallets

Example:

```typescript

const wallets = await audiusSdk.users.getConnectedWallets({
    id: "eAZl3"
})

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetConnectedWalletsRequest`](../interfaces/GetConnectedWalletsRequest.md) |

#### Returns

`Promise`<[`ConnectedWallets`](../interfaces/ConnectedWallets.md)\>

___

### getFavorites

**getFavorites**(`requestParameters`): `Promise`<[`Favorite`](../interfaces/Favorite.md)[]\>

Gets a user's favorite tracks

Example:

```typescript

const favorites = await audiusSdk.users.getFavorites({
    id: "eAZl3"
})

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetFavoritesRequest`](../interfaces/GetFavoritesRequest.md) |

#### Returns

`Promise`<[`Favorite`](../interfaces/Favorite.md)[]\>

___

### getReposts

**getReposts**(`requestParameters`): `Promise`<[`Activity`](../interfaces/Activity.md)[]\>

Gets the given user's reposts

Example:

```typescript

const reposts = await audiusSdk.users.getReposts({
    id: "eAZl3"
})

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetRepostsRequest`](../interfaces/GetRepostsRequest.md) |

#### Returns

`Promise`<[`Activity`](../interfaces/Activity.md)[]\>

___

### getSupporters

**getSupporters**(`requestParameters`): `Promise`<[`Supporter`](../interfaces/Supporter.md)[]\>

Gets the supporters of the given user

Example:

```typescript

const supporters = await audiusSdk.users.getSupporters({
    id: "eAZl3"
})

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetSupportersRequest`](../interfaces/GetSupportersRequest.md) |

#### Returns

`Promise`<[`Supporter`](../interfaces/Supporter.md)[]\>

___

### getSupportings

**getSupportings**(`requestParameters`): `Promise`<[`Supporting`](../interfaces/Supporting.md)[]\>

Gets the users that the given user supports

Example:

```typescript

const supportings = await audiusSdk.users.getSupportings({
    id: "eAZl3"
})

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetSupportingsRequest`](../interfaces/GetSupportingsRequest.md) |

#### Returns

`Promise`<[`Supporting`](../interfaces/Supporting.md)[]\>

___

### getTopTrackTags

**getTopTrackTags**(`requestParameters`): `Promise`<`string`[]\>

Gets the most used track tags by a user.
Fetch most used tags in a user's tracks

Example:

```typescript

const tags = await audiusSdk.users.getTopTrackTags({
    id: "eAZl3"
})

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTopTrackTagsRequest`](../interfaces/GetTopTrackTagsRequest.md) |

#### Returns

`Promise`<`string`[]\>

___

### getTracksByUser

**getTracksByUser**(`requestParameters`): `Promise`<[`Track`](../interfaces/Track.md)[]\>

Gets the tracks created by a user using their user ID

Example:

```typescript

const tracks = await audiusSdk.users.getTracksByUser({
    id: "eAZl3"
})

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTracksByUserRequest`](../interfaces/GetTracksByUserRequest.md) |

#### Returns

`Promise`<[`Track`](../interfaces/Track.md)[]\>

___

### getUser

**getUser**(`requestParameters`): `Promise`<[`User`](../interfaces/User.md)\>

Gets a single user by their user ID

Example:

```typescript

const user = await audiusSdk.users.getUser({
    id: "eAZl3"
})

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUserRequest`](../interfaces/GetUserRequest.md) |

#### Returns

`Promise`<[`User`](../interfaces/User.md)\>

___

### getUserIDFromWallet

**getUserIDFromWallet**(`requestParameters`): `Promise`<[`EncodedUserId`](../interfaces/EncodedUserId.md)\>

Gets a User ID from an associated wallet address

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUserIDFromWalletRequest`](../interfaces/GetUserIDFromWalletRequest.md) |

#### Returns

`Promise`<[`EncodedUserId`](../interfaces/EncodedUserId.md)\>

___

### searchUsers

**searchUsers**(`requestParameters`): `Promise`<[`User`](../interfaces/User.md)[]\>

Search for users that match the given query

Example:

```typescript

const users = await audiusSdk.users.searchUsers({
    query: 'skrillex'
})

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`SearchUsersRequest`](../interfaces/SearchUsersRequest.md) |

#### Returns

`Promise`<[`User`](../interfaces/User.md)[]\>

___

### verifyIDToken

**verifyIDToken**(`requestParameters`): `Promise`<[`DecodedUserToken`](../interfaces/DecodedUserToken.md)\>

Verify if the given jwt ID token was signed by the subject (user) in the payload

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`VerifyIDTokenRequest`](../interfaces/VerifyIDTokenRequest.md) |

#### Returns

`Promise`<[`DecodedUserToken`](../interfaces/DecodedUserToken.md)\>
