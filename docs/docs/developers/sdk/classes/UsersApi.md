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

___

### getAIAttributedTracksByUserHandleRaw

**getAIAttributedTracksByUserHandleRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`TracksResponse`](../interfaces/TracksResponse.md)\>\>

Gets the AI generated tracks attributed to a user using the user's handle

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetAIAttributedTracksByUserHandleRequest`](../interfaces/GetAIAttributedTracksByUserHandleRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`TracksResponse`](../interfaces/TracksResponse.md)\>\>

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

___

### getAuthorizedAppsRaw

**getAuthorizedAppsRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`AuthorizedApps`](../interfaces/AuthorizedApps.md)\>\>

Get the apps that user has authorized to write to their account

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetAuthorizedAppsRequest`](../interfaces/GetAuthorizedAppsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`AuthorizedApps`](../interfaces/AuthorizedApps.md)\>\>

___

### getConnectedWallets

**getConnectedWallets**(`requestParameters`, `initOverrides?`): `Promise`<[`ConnectedWalletsResponse`](../interfaces/ConnectedWalletsResponse.md)\>

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
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ConnectedWalletsResponse`](../interfaces/ConnectedWalletsResponse.md)\>

___

### getConnectedWalletsRaw

**getConnectedWalletsRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`ConnectedWalletsResponse`](../interfaces/ConnectedWalletsResponse.md)\>\>

Get the User's ERC and SPL connected wallets

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetConnectedWalletsRequest`](../interfaces/GetConnectedWalletsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`ConnectedWalletsResponse`](../interfaces/ConnectedWalletsResponse.md)\>\>

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

___

### getDeveloperAppsRaw

**getDeveloperAppsRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`DeveloperApps`](../interfaces/DeveloperApps.md)\>\>

Gets the developer apps that the user owns

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetDeveloperAppsRequest`](../interfaces/GetDeveloperAppsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`DeveloperApps`](../interfaces/DeveloperApps.md)\>\>

___

### getFavorites

**getFavorites**(`requestParameters`, `initOverrides?`): `Promise`<[`FavoritesResponse`](../interfaces/FavoritesResponse.md)\>

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
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`FavoritesResponse`](../interfaces/FavoritesResponse.md)\>

___

### getFavoritesRaw

**getFavoritesRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`FavoritesResponse`](../interfaces/FavoritesResponse.md)\>\>

Gets a user's favorite tracks

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetFavoritesRequest`](../interfaces/GetFavoritesRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`FavoritesResponse`](../interfaces/FavoritesResponse.md)\>\>

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

___

### getFollowersRaw

**getFollowersRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`FollowersResponse`](../interfaces/FollowersResponse.md)\>\>

All users that follow the provided user

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetFollowersRequest`](../interfaces/GetFollowersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`FollowersResponse`](../interfaces/FollowersResponse.md)\>\>

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

___

### getFollowingRaw

**getFollowingRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`FollowingResponse`](../interfaces/FollowingResponse.md)\>\>

All users that the provided user follows

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetFollowingRequest`](../interfaces/GetFollowingRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`FollowingResponse`](../interfaces/FollowingResponse.md)\>\>

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

___

### getRelatedUsersRaw

**getRelatedUsersRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`RelatedArtistResponse`](../interfaces/RelatedArtistResponse.md)\>\>

Gets a list of users that might be of interest to followers of this user.

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetRelatedUsersRequest`](../interfaces/GetRelatedUsersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`RelatedArtistResponse`](../interfaces/RelatedArtistResponse.md)\>\>

___

### getReposts

**getReposts**(`requestParameters`, `initOverrides?`): `Promise`<[`Reposts`](../interfaces/Reposts.md)\>

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
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`Reposts`](../interfaces/Reposts.md)\>

___

### getRepostsRaw

**getRepostsRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`Reposts`](../interfaces/Reposts.md)\>\>

Gets the given user's reposts

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetRepostsRequest`](../interfaces/GetRepostsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`Reposts`](../interfaces/Reposts.md)\>\>

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

___

### getSubscribersRaw

**getSubscribersRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`SubscribersResponse`](../interfaces/SubscribersResponse.md)\>\>

All users that subscribe to the provided user

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetSubscribersRequest`](../interfaces/GetSubscribersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`SubscribersResponse`](../interfaces/SubscribersResponse.md)\>\>

___

### getSupporters

**getSupporters**(`requestParameters`, `initOverrides?`): `Promise`<[`GetSupporters`](../interfaces/GetSupporters.md)\>

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
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`GetSupporters`](../interfaces/GetSupporters.md)\>

___

### getSupportersRaw

**getSupportersRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`GetSupporters`](../interfaces/GetSupporters.md)\>\>

Gets the supporters of the given user

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetSupportersRequest`](../interfaces/GetSupportersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`GetSupporters`](../interfaces/GetSupporters.md)\>\>

___

### getSupportings

**getSupportings**(`requestParameters`, `initOverrides?`): `Promise`<[`GetSupporting`](../interfaces/GetSupporting.md)\>

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
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`GetSupporting`](../interfaces/GetSupporting.md)\>

___

### getSupportingsRaw

**getSupportingsRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`GetSupporting`](../interfaces/GetSupporting.md)\>\>

Gets the users that the given user supports

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetSupportingsRequest`](../interfaces/GetSupportingsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`GetSupporting`](../interfaces/GetSupporting.md)\>\>

___

### getTopTrackTags

**getTopTrackTags**(`requestParameters`, `initOverrides?`): `Promise`<[`TagsResponse`](../interfaces/TagsResponse.md)\>

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
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TagsResponse`](../interfaces/TagsResponse.md)\>

___

### getTopTrackTagsRaw

**getTopTrackTagsRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`TagsResponse`](../interfaces/TagsResponse.md)\>\>

Gets the most used track tags by a user.
Fetch most used tags in a user's tracks

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTopTrackTagsRequest`](../interfaces/GetTopTrackTagsRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`TagsResponse`](../interfaces/TagsResponse.md)\>\>

___

### getTracksByUser

**getTracksByUser**(`requestParameters`, `initOverrides?`): `Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

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
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`TracksResponse`](../interfaces/TracksResponse.md)\>

___

### getTracksByUserRaw

**getTracksByUserRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`TracksResponse`](../interfaces/TracksResponse.md)\>\>

Gets the tracks created by a user using their user ID

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetTracksByUserRequest`](../interfaces/GetTracksByUserRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`TracksResponse`](../interfaces/TracksResponse.md)\>\>

___

### getUser

**getUser**(`requestParameters`, `initOverrides?`): `Promise`<[`UserResponse`](../interfaces/UserResponse.md)\>

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
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`UserResponse`](../interfaces/UserResponse.md)\>

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

___

### getUserByHandleRaw

**getUserByHandleRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`UserResponse`](../interfaces/UserResponse.md)\>\>

Gets a single user by their handle

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUserByHandleRequest`](../interfaces/GetUserByHandleRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`UserResponse`](../interfaces/UserResponse.md)\>\>

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

___

### getUserIDFromWalletRaw

**getUserIDFromWalletRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`UserAssociatedWalletResponse`](../interfaces/UserAssociatedWalletResponse.md)\>\>

Gets a User ID from an associated wallet address

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUserIDFromWalletRequest`](../interfaces/GetUserIDFromWalletRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`UserAssociatedWalletResponse`](../interfaces/UserAssociatedWalletResponse.md)\>\>

___

### getUserRaw

**getUserRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`UserResponse`](../interfaces/UserResponse.md)\>\>

Gets a single user by their user ID

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`GetUserRequest`](../interfaces/GetUserRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`UserResponse`](../interfaces/UserResponse.md)\>\>

___

### request

`Protected` **request**(`context`, `initOverrides?`): `Promise`<`Response`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`RequestOpts`](../interfaces/RequestOpts.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<`Response`\>

#### Inherited from

[BaseAPI](BaseAPI.md).[request](BaseAPI.md#request)

___

### searchUsers

**searchUsers**(`requestParameters`, `initOverrides?`): `Promise`<[`UserSearch`](../interfaces/UserSearch.md)\>

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
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`UserSearch`](../interfaces/UserSearch.md)\>

___

### searchUsersRaw

**searchUsersRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`UserSearch`](../interfaces/UserSearch.md)\>\>

Search for users that match the given query

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`SearchUsersRequest`](../interfaces/SearchUsersRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`UserSearch`](../interfaces/UserSearch.md)\>\>

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

___

### verifyIDTokenRaw

**verifyIDTokenRaw**(`requestParameters`, `initOverrides?`): `Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`VerifyToken`](../interfaces/VerifyToken.md)\>\>

Verify if the given jwt ID token was signed by the subject (user) in the payload

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestParameters` | [`VerifyIDTokenRequest`](../interfaces/VerifyIDTokenRequest.md) |
| `initOverrides?` | `RequestInit` \| [`InitOverrideFunction`](../modules.md#initoverridefunction) |

#### Returns

`Promise`<[`ApiResponse`](../interfaces/ApiResponse.md)<[`VerifyToken`](../interfaces/VerifyToken.md)\>\>

___

### withMiddleware

**withMiddleware**<`T`\>(`this`, ...`middlewares`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`BaseAPI`](BaseAPI.md)<`T`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `this` | `T` |
| `...middlewares` | [`Middleware`](../interfaces/Middleware.md)[] |

#### Returns

`T`

#### Inherited from

[BaseAPI](BaseAPI.md).[withMiddleware](BaseAPI.md#withmiddleware)

___

### withPostMiddleware

**withPostMiddleware**<`T`\>(`this`, ...`postMiddlewares`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`BaseAPI`](BaseAPI.md)<`T`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `this` | `T` |
| `...postMiddlewares` | (`undefined` \| (`context`: [`ResponseContext`](../interfaces/ResponseContext.md)) => `Promise`<`void` \| `Response`\>)[] |

#### Returns

`T`

#### Inherited from

[BaseAPI](BaseAPI.md).[withPostMiddleware](BaseAPI.md#withpostmiddleware)

___

### withPreMiddleware

**withPreMiddleware**<`T`\>(`this`, ...`preMiddlewares`): `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`BaseAPI`](BaseAPI.md)<`T`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `this` | `T` |
| `...preMiddlewares` | (`undefined` \| (`context`: [`RequestContext`](../interfaces/RequestContext.md)) => `Promise`<`void` \| [`FetchParams`](../interfaces/FetchParams.md)\>)[] |

#### Returns

`T`

#### Inherited from

[BaseAPI](BaseAPI.md).[withPreMiddleware](BaseAPI.md#withpremiddleware)
