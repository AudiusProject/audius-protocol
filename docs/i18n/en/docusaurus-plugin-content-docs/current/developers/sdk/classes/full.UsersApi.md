---
id: "full.UsersApi"
title: "Users"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### getFavorites

**getFavorites**(`requestParameters`): `Promise`<[`ActivityFull`](../interfaces/full.ActivityFull.md)[]\>

Gets a user's favorite tracks
Fetch favorited tracks for a user

Example:

```typescript

const favorites = await audiusSdk.users.getFavorites({
    id: "eAZl3"
})

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetFavoritesRequest`](../interfaces/full.GetFavoritesRequest.md) |

#### Returns

`Promise`<[`ActivityFull`](../interfaces/full.ActivityFull.md)[]\>

___

### getFollowers

**getFollowers**(`requestParameters`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

All users that follow the provided user

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetFollowersRequest`](../interfaces/full.GetFollowersRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

___

### getFollowings

**getFollowings**(`requestParameters`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

All users that the provided user follows

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetFollowingsRequest`](../interfaces/full.GetFollowingsRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

___

### getRelatedUsers

**getRelatedUsers**(`requestParameters`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

Gets a list of users that might be of interest to followers of this user.

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetRelatedUsersRequest`](../interfaces/full.GetRelatedUsersRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

___

### getReposts

**getReposts**(`requestParameters`): `Promise`<[`ActivityFull`](../interfaces/full.ActivityFull.md)[]\>

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
| `requestParameters` | [`GetRepostsRequest`](../interfaces/full.GetRepostsRequest.md) |

#### Returns

`Promise`<[`ActivityFull`](../interfaces/full.ActivityFull.md)[]\>

___

### getRepostsByHandle

**getRepostsByHandle**(`requestParameters`): `Promise`<[`ActivityFull`](../interfaces/full.ActivityFull.md)[]\>

Gets the user's reposts by the user handle

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetRepostsByHandleRequest`](../interfaces/full.GetRepostsByHandleRequest.md) |

#### Returns

`Promise`<[`ActivityFull`](../interfaces/full.ActivityFull.md)[]\>

___

### getSupporter

**getSupporter**(`requestParameters`): `Promise`<[`FullSupporter`](../interfaces/full.FullSupporter.md)\>

Gets the specified supporter of the given user

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetSupporterRequest`](../interfaces/full.GetSupporterRequest.md) |

#### Returns

`Promise`<[`FullSupporter`](../interfaces/full.FullSupporter.md)\>

___

### getSupporters

**getSupporters**(`requestParameters`): `Promise`<[`FullSupporter`](../interfaces/full.FullSupporter.md)[]\>

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
| `requestParameters` | [`GetSupportersRequest`](../interfaces/full.GetSupportersRequest.md) |

#### Returns

`Promise`<[`FullSupporter`](../interfaces/full.FullSupporter.md)[]\>

___

### getSupporting

**getSupporting**(`requestParameters`): `Promise`<[`FullSupporting`](../interfaces/full.FullSupporting.md)\>

Gets the support from the given user to the supported user

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetSupportingRequest`](../interfaces/full.GetSupportingRequest.md) |

#### Returns

`Promise`<[`FullSupporting`](../interfaces/full.FullSupporting.md)\>

___

### getSupportings

**getSupportings**(`requestParameters`): `Promise`<[`FullSupporting`](../interfaces/full.FullSupporting.md)\>

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
| `requestParameters` | [`GetSupportingsRequest`](../interfaces/full.GetSupportingsRequest.md) |

#### Returns

`Promise`<[`FullSupporting`](../interfaces/full.FullSupporting.md)\>

___

### getTopUsers

**getTopUsers**(`requestParameters?`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

Get the Top Users having at least one track by follower count

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTopUsersRequest`](../interfaces/full.GetTopUsersRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

___

### getTopUsersInGenre

**getTopUsersInGenre**(`requestParameters?`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

Get the Top Users for a Given Genre

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTopUsersInGenreRequest`](../interfaces/full.GetTopUsersInGenreRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

___

### getTracksByUser

**getTracksByUser**(`requestParameters`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

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
| `requestParameters` | [`GetTracksByUserRequest`](../interfaces/full.GetTracksByUserRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getTracksByUserHandle

**getTracksByUserHandle**(`requestParameters`): `Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

Gets the tracks created by a user using the user's handle

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTracksByUserHandleRequest`](../interfaces/full.GetTracksByUserHandleRequest.md) |

#### Returns

`Promise`<[`TrackFull`](../interfaces/full.TrackFull.md)[]\>

___

### getUser

**getUser**(`requestParameters`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

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
| `requestParameters` | [`GetUserRequest`](../interfaces/full.GetUserRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

___

### getUserByHandle

**getUserByHandle**(`requestParameters`): `Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

Gets a single user by their handle

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUserByHandleRequest`](../interfaces/full.GetUserByHandleRequest.md) |

#### Returns

`Promise`<[`UserFull`](../interfaces/full.UserFull.md)[]\>

___

### getUsersTrackHistory

**getUsersTrackHistory**(`requestParameters`): `Promise`<[`ActivityFull`](../interfaces/full.ActivityFull.md)[]\>

Get the tracks the user recently listened to.

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUsersTrackHistoryRequest`](../interfaces/full.GetUsersTrackHistoryRequest.md) |

#### Returns

`Promise`<[`ActivityFull`](../interfaces/full.ActivityFull.md)[]\>
