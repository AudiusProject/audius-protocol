---
id: "UsersApi"
title: "Users"
sidebar_position: 0
custom_edit_url: null
---

## Methods

### getAIAttributedTracksByUserHandle

**getAIAttributedTracksByUserHandle**(`requestParameters`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

Gets the AI generated tracks attributed to a user using the user's handle

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetAIAttributedTracksByUserHandleRequest`](../interfaces/GetAIAttributedTracksByUserHandleRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

#### Inherited from

GeneratedUsersApi.getAIAttributedTracksByUserHandle

___

### getAuthorizedApps

**getAuthorizedApps**(`requestParameters`, `initOverrides?`): `Promise`<[`AuthorizedApps`](../interfaces/AuthorizedApps.md)\>

Get the apps that user has authorized to write to their account

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetAuthorizedAppsRequest`](../interfaces/GetAuthorizedAppsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`AuthorizedApps`](../interfaces/AuthorizedApps.md)\>

#### Inherited from

GeneratedUsersApi.getAuthorizedApps

___

### getConnectedWallets

**getConnectedWallets**(`requestParameters`, `initOverrides?`): `Promise`<[`ConnectedWalletsResponse`](../interfaces/ConnectedWalletsResponse.md)\>

Get the User's ERC and SPL connected wallets

Example:

```typescript

const walletsResponse = await audiusSdk.users.getConnectedWallets({
    id: "eAZl3"
});

const wallets = walletsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetConnectedWalletsRequest`](../interfaces/GetConnectedWalletsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ConnectedWalletsResponse`](../interfaces/ConnectedWalletsResponse.md)\>

#### Inherited from

GeneratedUsersApi.getConnectedWallets

___

### getDeveloperApps

**getDeveloperApps**(`requestParameters`, `initOverrides?`): `Promise`<[`DeveloperApps`](../interfaces/DeveloperApps.md)\>

Gets the developer apps that the user owns

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetDeveloperAppsRequest`](../interfaces/GetDeveloperAppsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`DeveloperApps`](../interfaces/DeveloperApps.md)\>

#### Inherited from

GeneratedUsersApi.getDeveloperApps

___

### getFavorites

**getFavorites**(`requestParameters`, `initOverrides?`): `Promise`<[`FavoritesResponse`](../interfaces/FavoritesResponse.md)\>

Gets a user's favorite tracks

Example:

```typescript

const favoritesResponse = await audiusSdk.users.getFavorites({
    id: "eAZl3"
});

const favorites = favoritesResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetFavoritesRequest`](../interfaces/GetFavoritesRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`FavoritesResponse`](../interfaces/FavoritesResponse.md)\>

#### Inherited from

GeneratedUsersApi.getFavorites

___

### getFollowers

**getFollowers**(`requestParameters`, `initOverrides?`): `Promise`<[`FollowersResponse`](../interfaces/FollowersResponse.md)\>

All users that follow the provided user

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetFollowersRequest`](../interfaces/GetFollowersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`FollowersResponse`](../interfaces/FollowersResponse.md)\>

#### Inherited from

GeneratedUsersApi.getFollowers

___

### getFollowing

**getFollowing**(`requestParameters`, `initOverrides?`): `Promise`<[`FollowingResponse`](../interfaces/FollowingResponse.md)\>

All users that the provided user follows

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetFollowingRequest`](../interfaces/GetFollowingRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`FollowingResponse`](../interfaces/FollowingResponse.md)\>

#### Inherited from

GeneratedUsersApi.getFollowing

___

### getRelatedUsers

**getRelatedUsers**(`requestParameters`, `initOverrides?`): `Promise`<[`RelatedArtistResponse`](../interfaces/RelatedArtistResponse.md)\>

Gets a list of users that might be of interest to followers of this user.

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetRelatedUsersRequest`](../interfaces/GetRelatedUsersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`RelatedArtistResponse`](../interfaces/RelatedArtistResponse.md)\>

#### Inherited from

GeneratedUsersApi.getRelatedUsers

___

### getReposts

**getReposts**(`requestParameters`, `initOverrides?`): `Promise`<[`Reposts`](../interfaces/Reposts.md)\>

Gets the given user's reposts

Example:

```typescript

const repostsResponse = await audiusSdk.users.getReposts({
    id: "eAZl3"
});

const resposts = repostsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetRepostsRequest`](../interfaces/GetRepostsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`Reposts`](../interfaces/Reposts.md)\>

#### Inherited from

GeneratedUsersApi.getReposts

___

### getSubscribers

**getSubscribers**(`requestParameters`, `initOverrides?`): `Promise`<[`SubscribersResponse`](../interfaces/SubscribersResponse.md)\>

All users that subscribe to the provided user

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetSubscribersRequest`](../interfaces/GetSubscribersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`SubscribersResponse`](../interfaces/SubscribersResponse.md)\>

#### Inherited from

GeneratedUsersApi.getSubscribers

___

### getSupporters

**getSupporters**(`requestParameters`, `initOverrides?`): `Promise`<[`GetSupporters`](../interfaces/GetSupporters.md)\>

Gets the supporters of the given user

Example:

```typescript

const supportersResponse = await audiusSdk.users.getSupporters({
    id: "eAZl3"
});

const supporters = supportersResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetSupportersRequest`](../interfaces/GetSupportersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`GetSupporters`](../interfaces/GetSupporters.md)\>

#### Inherited from

GeneratedUsersApi.getSupporters

___

### getSupportings

**getSupportings**(`requestParameters`, `initOverrides?`): `Promise`<[`GetSupporting`](../interfaces/GetSupporting.md)\>

Gets the users that the given user supports

Example:

```typescript

const supportingsResponse = await audiusSdk.users.getSupportings({
    id: "eAZl3"
});

const supportings = supportingsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetSupportingsRequest`](../interfaces/GetSupportingsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`GetSupporting`](../interfaces/GetSupporting.md)\>

#### Inherited from

GeneratedUsersApi.getSupportings

___

### getTopTrackTags

**getTopTrackTags**(`requestParameters`, `initOverrides?`): `Promise`<[`TagsResponse`](../interfaces/TagsResponse.md)\>

Gets the most used track tags by a user.
Fetch most used tags in a user's tracks

Example:

```typescript

const tagsResponse = await audiusSdk.users.getTopTrackTags({
    id: "eAZl3"
});

const tags = tagsResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTopTrackTagsRequest`](../interfaces/GetTopTrackTagsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TagsResponse`](../interfaces/TagsResponse.md)\>

#### Inherited from

GeneratedUsersApi.getTopTrackTags

___

### getTracksByUser

**getTracksByUser**(`requestParameters`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

Gets the tracks created by a user using their user ID

Example:

```typescript

const tracksResponse = await audiusSdk.users.getTracksByUser({
    id: "eAZl3"
});

const tracks = tracksResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTracksByUserRequest`](../interfaces/GetTracksByUserRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

#### Inherited from

GeneratedUsersApi.getTracksByUser

___

### getUser

**getUser**(`requestParameters`, `initOverrides?`): `Promise`<[`UserResponse`](../interfaces/UserResponse.md)\>

Gets a single user by their user ID

Example:

```typescript

const userResponse = await audiusSdk.users.getUser({
    id: "eAZl3"
});

const user = userResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUserRequest`](../interfaces/GetUserRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`UserResponse`](../interfaces/UserResponse.md)\>

#### Inherited from

GeneratedUsersApi.getUser

___

### getUserByHandle

**getUserByHandle**(`requestParameters`, `initOverrides?`): `Promise`<[`UserResponse`](../interfaces/UserResponse.md)\>

Gets a single user by their handle

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUserByHandleRequest`](../interfaces/GetUserByHandleRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`UserResponse`](../interfaces/UserResponse.md)\>

#### Inherited from

GeneratedUsersApi.getUserByHandle

___

### getUserIDFromWallet

**getUserIDFromWallet**(`requestParameters`, `initOverrides?`): `Promise`<[`UserAssociatedWalletResponse`](../interfaces/UserAssociatedWalletResponse.md)\>

Gets a User ID from an associated wallet address

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUserIDFromWalletRequest`](../interfaces/GetUserIDFromWalletRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`UserAssociatedWalletResponse`](../interfaces/UserAssociatedWalletResponse.md)\>

#### Inherited from

GeneratedUsersApi.getUserIDFromWallet

___

### searchUsers

**searchUsers**(`requestParameters`, `initOverrides?`): `Promise`<[`UserSearch`](../interfaces/UserSearch.md)\>

Search for users that match the given query

Example:

```typescript

const usersResponse = await audiusSdk.users.searchUsers({
    query: 'skrillex'
})

const users = usersResponse.data;

```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`SearchUsersRequest`](../interfaces/SearchUsersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`UserSearch`](../interfaces/UserSearch.md)\>

#### Inherited from

GeneratedUsersApi.searchUsers

___

### verifyIDToken

**verifyIDToken**(`requestParameters`, `initOverrides?`): `Promise`<[`VerifyToken`](../interfaces/VerifyToken.md)\>

Verify if the given jwt ID token was signed by the subject (user) in the payload

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`VerifyIDTokenRequest`](../interfaces/VerifyIDTokenRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`VerifyToken`](../interfaces/VerifyToken.md)\>

#### Inherited from

GeneratedUsersApi.verifyIDToken
