---
id: "UsersApi"
title: "Users"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### getAIAttributedTracksByUserHandle

**getAIAttributedTracksByUserHandle**(`params`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

Gets the AI generated tracks attributed to a user using the user's handle

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetAIAttributedTracksByUserHandleRequest`](../interfaces/GetAIAttributedTracksByUserHandleRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

___

### getAuthorizedApps

**getAuthorizedApps**(`params`, `initOverrides?`): `Promise`<[`AuthorizedApps`](../interfaces/AuthorizedApps.md)\>

Get the apps that user has authorized to write to their account

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetAuthorizedAppsRequest`](../interfaces/GetAuthorizedAppsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`AuthorizedApps`](../interfaces/AuthorizedApps.md)\>

___

### getConnectedWallets

**getConnectedWallets**(`params`, `initOverrides?`): `Promise`<[`ConnectedWalletsResponse`](../interfaces/ConnectedWalletsResponse.md)\>

Get the User's ERC and SPL connected wallets

1 Example:

```typescript

const walletsResponse = await audiusSdk.users.getConnectedWallets({
    id: "eAZl3"
});

const wallets = walletsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetConnectedWalletsRequest`](../interfaces/GetConnectedWalletsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ConnectedWalletsResponse`](../interfaces/ConnectedWalletsResponse.md)\>

___

### getDeveloperApps

**getDeveloperApps**(`params`, `initOverrides?`): `Promise`<[`DeveloperApps`](../interfaces/DeveloperApps.md)\>

Gets the developer apps that the user owns

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetDeveloperAppsRequest`](../interfaces/GetDeveloperAppsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`DeveloperApps`](../interfaces/DeveloperApps.md)\>

___

### getFavorites

**getFavorites**(`params`, `initOverrides?`): `Promise`<[`FavoritesResponse`](../interfaces/FavoritesResponse.md)\>

Gets a user's favorite tracks

1 Example:

```typescript

const favoritesResponse = await audiusSdk.users.getFavorites({
    id: "eAZl3"
});

const favorites = favoritesResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetFavoritesRequest`](../interfaces/GetFavoritesRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`FavoritesResponse`](../interfaces/FavoritesResponse.md)\>

___

### getFollowers

**getFollowers**(`params`, `initOverrides?`): `Promise`<[`FollowersResponse`](../interfaces/FollowersResponse.md)\>

All users that follow the provided user

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetFollowersRequest`](../interfaces/GetFollowersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`FollowersResponse`](../interfaces/FollowersResponse.md)\>

___

### getFollowing

**getFollowing**(`params`, `initOverrides?`): `Promise`<[`FollowingResponse`](../interfaces/FollowingResponse.md)\>

All users that the provided user follows

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetFollowingRequest`](../interfaces/GetFollowingRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`FollowingResponse`](../interfaces/FollowingResponse.md)\>

___

### getRelatedUsers

**getRelatedUsers**(`params`, `initOverrides?`): `Promise`<[`RelatedArtistResponse`](../interfaces/RelatedArtistResponse.md)\>

Gets a list of users that might be of interest to followers of this user.

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetRelatedUsersRequest`](../interfaces/GetRelatedUsersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`RelatedArtistResponse`](../interfaces/RelatedArtistResponse.md)\>

___

### getReposts

**getReposts**(`params`, `initOverrides?`): `Promise`<[`Reposts`](../interfaces/Reposts.md)\>

Gets the given user's reposts

1 Example:

```typescript

const repostsResponse = await audiusSdk.users.getReposts({
    id: "eAZl3"
});

const resposts = repostsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetRepostsRequest`](../interfaces/GetRepostsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`Reposts`](../interfaces/Reposts.md)\>

___

### getSubscribers

**getSubscribers**(`params`, `initOverrides?`): `Promise`<[`SubscribersResponse`](../interfaces/SubscribersResponse.md)\>

All users that subscribe to the provided user

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetSubscribersRequest`](../interfaces/GetSubscribersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`SubscribersResponse`](../interfaces/SubscribersResponse.md)\>

___

### getSupporters

**getSupporters**(`params`, `initOverrides?`): `Promise`<[`GetSupporters`](../interfaces/GetSupporters.md)\>

Gets the supporters of the given user

1 Example:

```typescript

const supportersResponse = await audiusSdk.users.getSupporters({
    id: "eAZl3"
});

const supporters = supportersResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetSupportersRequest`](../interfaces/GetSupportersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`GetSupporters`](../interfaces/GetSupporters.md)\>

___

### getSupportings

**getSupportings**(`params`, `initOverrides?`): `Promise`<[`GetSupporting`](../interfaces/GetSupporting.md)\>

Gets the users that the given user supports

1 Example:

```typescript

const supportingsResponse = await audiusSdk.users.getSupportings({
    id: "eAZl3"
});

const supportings = supportingsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetSupportingsRequest`](../interfaces/GetSupportingsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`GetSupporting`](../interfaces/GetSupporting.md)\>

___

### getTopTrackTags

**getTopTrackTags**(`params`, `initOverrides?`): `Promise`<[`TagsResponse`](../interfaces/TagsResponse.md)\>

Gets the most used track tags by a user.
Fetch most used tags in a user's tracks

1 Example:

```typescript

const tagsResponse = await audiusSdk.users.getTopTrackTags({
    id: "eAZl3"
});

const tags = tagsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetTopTrackTagsRequest`](../interfaces/GetTopTrackTagsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TagsResponse`](../interfaces/TagsResponse.md)\>

___

### getTracksByUser

**getTracksByUser**(`params`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

Gets the tracks created by a user using their user ID

1 Example:

```typescript

const tracksResponse = await audiusSdk.users.getTracksByUser({
    id: "eAZl3"
});

const tracks = tracksResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetTracksByUserRequest`](../interfaces/GetTracksByUserRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

___

### getUser

**getUser**(`params`, `initOverrides?`): `Promise`<[`UserResponse`](../interfaces/UserResponse.md)\>

Gets a single user by their user ID

1 Example:

```typescript

const userResponse = await audiusSdk.users.getUser({
    id: "eAZl3"
});

const user = userResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetUserRequest`](../interfaces/GetUserRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`UserResponse`](../interfaces/UserResponse.md)\>

___

### getUserByHandle

**getUserByHandle**(`params`, `initOverrides?`): `Promise`<[`UserResponse`](../interfaces/UserResponse.md)\>

Gets a single user by their handle

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetUserByHandleRequest`](../interfaces/GetUserByHandleRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`UserResponse`](../interfaces/UserResponse.md)\>

___

### getUserIDFromWallet

**getUserIDFromWallet**(`params`, `initOverrides?`): `Promise`<[`UserAssociatedWalletResponse`](../interfaces/UserAssociatedWalletResponse.md)\>

Gets a User ID from an associated wallet address

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`GetUserIDFromWalletRequest`](../interfaces/GetUserIDFromWalletRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`UserAssociatedWalletResponse`](../interfaces/UserAssociatedWalletResponse.md)\>

___

### searchUsers

**searchUsers**(`params`, `initOverrides?`): `Promise`<[`UserSearch`](../interfaces/UserSearch.md)\>

Search for users that match the given query

1 Example:

```typescript

const usersResponse = await audiusSdk.users.searchUsers({
    query: 'skrillex'
})

const users = usersResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`SearchUsersRequest`](../interfaces/SearchUsersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`UserSearch`](../interfaces/UserSearch.md)\>

___

### verifyIDToken

**verifyIDToken**(`params`, `initOverrides?`): `Promise`<[`VerifyToken`](../interfaces/VerifyToken.md)\>

Verify if the given jwt ID token was signed by the subject (user) in the payload

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`VerifyIDTokenRequest`](../interfaces/VerifyIDTokenRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`VerifyToken`](../interfaces/VerifyToken.md)\>
