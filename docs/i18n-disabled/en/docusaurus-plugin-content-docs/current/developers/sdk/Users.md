### getUser

#### getUser(`params`)

Get a user.

Example:

```typescript
const { data: user } = await audiusSdk.users.getUser({
  id: "eAZl3",
});

console.log(user);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name | Type     | Description        | Required?    |
| :--- | :------- | :----------------- | :----------- |
| `id` | `string` | The ID of the user | **Required** |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` contains information about the user as described below.

Return type:

```ts
Promise<{
  data: {
    albumCount: number;
    artistPickTrackId?: string;
    bio?: string;
    coverPhoto?: {
      _2000?: string;
      _640?: string;
    };
    doesFollowCurrentUser?: boolean;
    ercWallet: string;
    followeeCount: number;
    followerCount: number;
    handle: string;
    id: string;
    isAvailable: boolean;
    isDeactivated: boolean;
    isVerified: boolean;
    location?: string;
    name: string;
    playlistCount: number;
    profilePicture?: {
      _1000x1000?: string;
      _150x150?: string;
      _480x480?: string;
    };
    repostCount: number;
    splWallet: string;
    supporterCount: number;
    supportingCount: number;
    totalAudioBalance: number;
    trackCount: number;
  };
}>;
```

---

### getAIAttributedTracksByUserHandle

#### getAIAttributedTracksByUserHandle(`params`)

Get the AI generated tracks attributed to a user using the user's handle.

Example:

```typescript
const { data: tracks } =
  await audiusSdk.users.getAIAttributedTracksByUserHandle({
    handle: "skrillex",
  });

console.log(tracks);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name            | Type                                                                                               | Description                                                                                                                     | Required?    |
| :-------------- | :------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :----------- |
| `handle`        | `string`                                                                                           | The handle of the user                                                                                                          | **Required** |
| `limit`         | `number`                                                                                           | The maximum number of tracks to return. Default value is **10**                                                                 | _Optional_   |
| `offset`        | `number`                                                                                           | The offset to apply to the list of results. Default value is **0**                                                              | _Optional_   |
| `filterTracks`  | `GetAIAttributedTracksByUserHandleFilterTracksEnum` (can be imported from `@audius/sdk`)           | A filter to apply to the returned tracks. Default value is **GetAIAttributableTracksByUserHandleFilterTracksEnum.All**          | _Optional_   |
| `query`         | `string`                                                                                           | A query to search for in a user's tracks                                                                                        | _Optional_   |
| `sortDirection` | `GetAIAttributedTracksByUserHandleSortDirectionEnum` (can be imported from `@audius/sdk`)          | A sort direction to apply to the returned tracks. Default value is **GetAIAttributableTracksByUserHandleSortDirectionEnum.Asc** | _Optional_   |
| `sortMethod`    | `GetAIAttributedTracksByUserTracksByUserHandleSortMethodEnum` (can be imported from `@audius/sdk`) | A sort method to apply to the returned tracks                                                                                   | _Optional_   |

#### Returns

The return type is the same as [`getBulkTracks`](Tracks#getbulktracks)

---

### getAuthorizedApps

#### getAuthorizedApps(`params`)

Get the apps that a user has authorized to write to their account.

Example:

```typescript
const { data: apps } = await audiusSdk.users.getAuthorizedApps({
  id: "eAZl3",
});

console.log(apps);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name | Type     | Description        | Required?    |
| :--- | :------- | :----------------- | :----------- |
| `id` | `string` | The ID of the user | **Required** |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` is an array of items containing information about the authorized apps as described below.

Return type:

```ts
Promise<{
  data: {
    address: string;
    description?: string;
    grantCreatedAt: string;
    grantUpdatedAt: string;
    grantorUserId: string;
    name: string;
  }[];
}>;
```

---

### getConnectedWallets

#### getConnectedWallets(`params`)

Get a user's connected ERC and SPL wallets.

Example:

```typescript
const { data: wallets } = await audiusSdk.users.getConnectedWallets({
  id: "eAZl3",
});

console.log(wallets);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name | Type     | Description        | Required?    |
| :--- | :------- | :----------------- | :----------- |
| `id` | `string` | The ID of the user | **Required** |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` is an object containing information about the wallets as described below.

Return type:

```ts
Promise<{
  data: {
    ercWallets: string[];
    splWallets: string[];
  };
}>;
```

---

### getDeveloperApps

#### getDeveloperApps(`params`)

Get the developer apps a user owns.

Example:

```typescript
const { data: developerApps } = await audiusSdk.users.getDeveloperApps({
  id: "eAZl3",
});

console.log(developerApps);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name | Type     | Description        | Required?    |
| :--- | :------- | :----------------- | :----------- |
| `id` | `string` | The ID of the user | **Required** |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` is an array of items containing information about the developer apps as described below.

Return type:

```ts
Promise<{
  data: {
    address: string;
    description?: string;
    name: string;
    userId: string;
  }[];
}>;
```

---

### getFavorites

#### getFavorites(`params`)

Get a user's favorites.

Example:

```typescript
const { data: favorites } = await audiusSdk.users.getFavorites({
  id: "eAZl3",
});

console.log(favorites);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name | Type     | Description        | Required?    |
| :--- | :------- | :----------------- | :----------- |
| `id` | `string` | The ID of the user | **Required** |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` is an array of items containing information about the favorites as described below.

Return type:

```ts
Promise<{
  data: {
    createdAt: string;
    favoriteItemId: string; // The ID of the track, playlist, or album
    favoriteType: string; // The type of favorite ("track", "playlist", or "album")
    userId: string;
  }[];
}>;
```

---

### getFollowers

#### getFollowers(`params`)

Get a user's followers

Example:

```typescript
const { data: followers } = await audiusSdk.users.getFollowers({
  id: "eAZl3",
});

console.log(followers);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name     | Type     | Description                                                        | Required?    |
| :------- | :------- | :----------------------------------------------------------------- | :----------- |
| `id`     | `string` | The ID of the user                                                 | **Required** |
| `limit`  | `number` | The maximum number of followers to return. Default value is **10** | _Optional_   |
| `offset` | `number` | The offset to apply to the list of results. Default value is **0** | _Optional_   |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` is an array of items containing information about the followers as described below.

Return type:

```ts
Promise<{
  data: {
    albumCount: number;
    artistPickTrackId?: string;
    bio?: string;
    coverPhoto?: {
      _2000?: string;
      _640?: string;
    };
    doesFollowCurrentUser?: boolean;
    ercWallet: string;
    followeeCount: number;
    followerCount: number;
    handle: string;
    id: string;
    isAvailable: boolean;
    isDeactivated: boolean;
    isVerified: boolean;
    location?: string;
    name: string;
    playlistCount: number;
    profilePicture?: {
      _1000x1000?: string;
      _150x150?: string;
      _480x480?: string;
    };
    repostCount: number;
    splWallet: string;
    supporterCount: number;
    supportingCount: number;
    totalAudioBalance: number;
    trackCount: number;
  }[];
}>;
```

---

### getFollowing

#### getFollowing(`params`)

Get users that a user is following

Example:

```typescript
const { data: following } = await audiusSdk.users.getFollowing({
  id: "eAZl3",
});

console.log(following);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name     | Type     | Description                                                        | Required?    |
| :------- | :------- | :----------------------------------------------------------------- | :----------- |
| `id`     | `string` | The ID of the user                                                 | **Required** |
| `limit`  | `number` | The maximum number of users to return. Default value is **10**     | _Optional_   |
| `offset` | `number` | The offset to apply to the list of results. Default value is **0** | _Optional_   |

#### Returns

The return type is the same as [`getFollowers`](#getfollowers)

---

### getRelatedUsers

#### getRelatedUsers(`params`)

Get a list of users that might be of interest to followers of this user.

Example:

```typescript
const { data: relatedUsers } = await audiusSdk.users.getRelatedUsers({
  id: "eAZl3",
});

console.log(relatedUsers);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name     | Type     | Description                                                        | Required?    |
| :------- | :------- | :----------------------------------------------------------------- | :----------- |
| `id`     | `string` | The ID of the user                                                 | **Required** |
| `limit`  | `number` | The maximum number of users to return. Default value is **10**     | _Optional_   |
| `offset` | `number` | The offset to apply to the list of results. Default value is **0** | _Optional_   |

#### Returns

The return type is the same as [`getFollowers`](#getfollowers)

---

#### getReposts(`params`)

Get a user's reposts.

Example:

```typescript
const { data: reposts } = await audiusSdk.users.getReposts({
  id: "eAZl3",
});

console.log(reposts);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name     | Type     | Description                                                        | Required?    |
| :------- | :------- | :----------------------------------------------------------------- | :----------- |
| `id`     | `string` | The ID of the user                                                 | **Required** |
| `limit`  | `number` | The maximum number of reposts to return. Default value is **100**  | _Optional_   |
| `offset` | `number` | The offset to apply to the list of results. Default value is **0** | _Optional_   |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` is an array of items containing information about the reposts as described below.

Return type:

```ts
Promise<{
  data: {
    item?: {
      id: string;
    }; // The entire item is returned, always contains id
    itemType?: string; // The type of the item ("track", "playlist", or "album")
    timestamp?: string;
  }[];
}>;
```

---

### getSubscribers

#### getSubscribers(`params`)

Get users that are subscribed to a user.

Example:

```typescript
const { data: subscribers } = await audiusSdk.users.getSubscribers({
  id: "eAZl3",
});

console.log(subscribers);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name     | Type     | Description                                                        | Required?    |
| :------- | :------- | :----------------------------------------------------------------- | :----------- |
| `id`     | `string` | The ID of the user                                                 | **Required** |
| `limit`  | `number` | The maximum number of users to return. Default value is **10**     | _Optional_   |
| `offset` | `number` | The offset to apply to the list of results. Default value is **0** | _Optional_   |

#### Returns

The return type is the same as [`getFollowers`](#getfollowers)

---

### getSupporters

#### getSupporters(`params`)

Get users that are supporting a user (they have sent them a tip).

Example:

```typescript
const { data: supporters } = await audiusSdk.users.getSupporters({
  id: "eAZl3",
});

console.log(supporters);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name     | Type     | Description                                                        | Required?    |
| :------- | :------- | :----------------------------------------------------------------- | :----------- |
| `id`     | `string` | The ID of the user                                                 | **Required** |
| `limit`  | `number` | The maximum number of users to return. Default value is **10**     | _Optional_   |
| `offset` | `number` | The offset to apply to the list of results. Default value is **0** | _Optional_   |

#### Returns

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` is an array of items containing information about the supporters as described below.

Return type:

```ts
Promise<{
  data: {
    amount: string;
    rank: number;
    sender: {
      albumCount: number;
      artistPickTrackId?: string;
      bio?: string;
      coverPhoto?: {
        _2000?: string;
        _640?: string;
      };
      doesFollowCurrentUser?: boolean;
      ercWallet: string;
      followeeCount: number;
      followerCount: number;
      handle: string;
      id: string;
      isAvailable: boolean;
      isDeactivated: boolean;
      isVerified: boolean;
      location?: string;
      name: string;
      playlistCount: number;
      profilePicture?: {
        _1000x1000?: string;
        _150x150?: string;
        _480x480?: string;
      };
      repostCount: number;
      splWallet: string;
      supporterCount: number;
      supportingCount: number;
      totalAudioBalance: number;
      trackCount: number;
    };
  }[];
}>;
```

---

### getSupportings

#### getSupportings(`params`)

Get users that a user is supporting (they have sent them a tip).

Example:

```typescript
const { data: supportings } = await audiusSdk.users.getSupportings({
  id: "eAZl3",
});

console.log(supportings);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name     | Type     | Description                                                        | Required?    |
| :------- | :------- | :----------------------------------------------------------------- | :----------- |
| `id`     | `string` | The ID of the user                                                 | **Required** |
| `limit`  | `number` | The maximum number of users to return. Default value is **10**     | _Optional_   |
| `offset` | `number` | The offset to apply to the list of results. Default value is **0** | _Optional_   |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` is an array of items containing information about the supportings as described below.

Return type:

```ts
Promise<{
  data: {
    amount: string;
    rank: number;
    receiver: {
      albumCount: number;
      artistPickTrackId?: string;
      bio?: string;
      coverPhoto?: {
        _2000?: string;
        _640?: string;
      };
      doesFollowCurrentUser?: boolean;
      ercWallet: string;
      followeeCount: number;
      followerCount: number;
      handle: string;
      id: string;
      isAvailable: boolean;
      isDeactivated: boolean;
      isVerified: boolean;
      location?: string;
      name: string;
      playlistCount: number;
      profilePicture?: {
        _1000x1000?: string;
        _150x150?: string;
        _480x480?: string;
      };
      repostCount: number;
      splWallet: string;
      supporterCount: number;
      supportingCount: number;
      totalAudioBalance: number;
      trackCount: number;
    };
  }[];
}>;
```

---

### getTopTrackTags

#### getTopTrackTags(`params`)

Get the most used track tags by a user.

Example:

```typescript
const { data: tags } = await audiusSdk.users.getTopTrackTags({
  id: "eAZl3",
});

console.log(tags);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name     | Type     | Description                                                        | Required?    |
| :------- | :------- | :----------------------------------------------------------------- | :----------- |
| `id`     | `string` | The ID of the user                                                 | **Required** |
| `limit`  | `number` | The maximum number of users to return. Default value is **10**     | _Optional_   |
| `offset` | `number` | The offset to apply to the list of results. Default value is **0** | _Optional_   |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` is an array of strings representing the tags

Return type:

```ts
Promise<{
  data: string[]
>
```

---

### getTracksByUser

#### getTracksByUser(`params`)

Get a user's tracks.

Example:

```typescript
const { data: tracks } = await audiusSdk.users.getTracksByUser({
  id: "eAZl3",
});

console.log(tracks);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name            | Type                                                                    | Description                                                                                                 | Required?    |
| :-------------- | :---------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- | :----------- |
| `id`            | `string`                                                                | The ID of the user                                                                                          | **Required** |
| `limit`         | `number`                                                                | The maximum number of tracks to return. Default value is **10**                                             | _Optional_   |
| `offset`        | `number`                                                                | The offset to apply to the list of results. Default value is **0**                                          | _Optional_   |
| `filterTracks`  | `GetTracksByUserFilterTracksEnum` (can be imported from `@audius/sdk`)  | A filter to apply to the returned tracks. Default value is **GetTracksByUserFilterTracksEnum.All**          | _Optional_   |
| `query`         | `string`                                                                | A query to search for in a user's tracks                                                                    | _Optional_   |
| `sortDirection` | `GetTracksByUserSortDirectionEnum` (can be imported from `@audius/sdk`) | A sort direction to apply to the returned tracks. Default value is **GetTracksByUserSortDirectionEnum.Asc** | _Optional_   |
| `sortMethod`    | `GetTracksByUserSortMethodEnum` (can be imported from `@audius/sdk`)    | A sort method to apply to the returned tracks                                                               | _Optional_   |

#### Returns

The return type is the same as [`getBulkTracks`](Tracks#getbulktracks)

---

### getUserByHandle

#### getUserByHandle(`params`)

Get a user by their handle.

Example:

```typescript
const { data: user } = await audiusSdk.users.getUserByHandle({
  handle: "skrillex",
});

console.log(user);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name     | Type     | Description            | Required?    |
| :------- | :------- | :--------------------- | :----------- |
| `handle` | `string` | The handle of the user | **Required** |

#### Returns

The return type is the same as [`getUser`](#getuser)

---

### getUserIdByWallet

#### getUserIdByWallet(`params`)

Get a user ID by an associated wallet address.

Example:

```typescript
const { data: userId } = await audiusSdk.users.getUserIdByWallet({
  associatedWallet: "6f229f7e8462f198e5be9139175a0b460a9fa35b",
});

console.log(userId);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name               | Type     | Description                               | Required?    |
| :----------------- | :------- | :---------------------------------------- | :----------- |
| `associatedWallet` | `string` | A wallet address associated with the user | **Required** |

#### Returns

Returns a `Promise` containing an object with a `data` field. `data` is an object containing the user id as described below.

Return type:

```ts
Promise<{
  data: {
    userId: string;
  };
}>;
```

---

### searchUsers

#### searchUsers(`params`)

Search for users.

Example:

```typescript
const { data: users } = await audiusSdk.users.searchUsers({
  query: "skrillex",
});

console.log(users);
```

#### Params

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name    | Type     | Description                   | Required?    |
| :------ | :------- | :---------------------------- | :----------- |
| `query` | `string` | The query for which to search | **Required** |

#### Returns

The return type is the same as [`getFollowers`](#getfollowers)

---

### updateProfile

#### updateProfile(`params`, `advancedOptions?`)

Update a user profile.

Example:

```typescript
import { Mood, Genre } from "@audius/sdk";
import fs from "fs";

const profilePicBuffer = fs.readFileSync("path/to/profile-pic.png");

await audiusSdk.users.updateProfile({
  userId: "7eP5n",
  profilePictureFile: {
    buffer: Buffer.from(profilePicBuffer),
    name: "profilePic",
  },
  metadata: {
    bio: "up and coming artist from the Bronx",
  },
  onProgress: (progress) => console.log("Progress: ", progress),
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name                 | Type                         | Description                                                                   | Required?    |
| :------------------- | :--------------------------- | :---------------------------------------------------------------------------- | :----------- |
| `profilePictureFile` | `File`                       | A file to be used as the profile picture                                      | _Optional_   |
| `coverArtFile`       | `File`                       | A file to be used as the cover art. This is the header on a profile page      | _Optional_   |
| `metadata`           | _see code sample below_      | An object with details about the user                                         | **Required** |
| `onProgress`         | `(progress: number) => void` | A function that will be called with progress events as the image files upload | _Optional_   |
| `userId`             | `string`                     | The ID of the user                                                            | **Required** |

```json
{
  name?: string;
  bio?: string;
  location?: string;
  isDeactivated?: boolean;
  artistPickTrackId?: string;
}
```

#### `advancedOptions`

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```

---

### followUser

#### followUser(`params`, `advancedOptions?`)

Follow a user.

Example:

```typescript
await audiusSdk.users.followUser({
  userId: "7eP5n",
  followeeUserId: "2kN2a", // User id to follow
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name             | Type     | Description                  | Required?    |
| :--------------- | :------- | :--------------------------- | :----------- |
| `userId`         | `string` | The ID of the user           | **Required** |
| `followeeUserId` | `string` | The ID of the user to follow | **Required** |

#### `advancedOptions`

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```

---

### unfollowUser

#### unfollowUser(`params`, `advancedOptions?`)

Unfollow a user.

Example:

```typescript
await audiusSdk.users.unfollowUser({
  userId: "7eP5n",
  followeeUserId: "2kN2a", // User id to unfollow
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name             | Type     | Description                    | Required?    |
| :--------------- | :------- | :----------------------------- | :----------- |
| `userId`         | `string` | The ID of the user             | **Required** |
| `followeeUserId` | `string` | The ID of the user to unfollow | **Required** |

#### `advancedOptions`

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```

---

### subscribeToUser

#### subscribeToUser(`params`, `advancedOptions?`)

Subscribe to a user.

Example:

```typescript
await audiusSdk.users.subscribeToUser({
  userId: "7eP5n",
  subscribeeUserId: "2kN2a", // User id to subscribe to
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name               | Type     | Description                        | Required?    |
| :----------------- | :------- | :--------------------------------- | :----------- |
| `userId`           | `string` | The ID of the user                 | **Required** |
| `subscribeeUserId` | `string` | The ID of the user to subscribe to | **Required** |

#### `advancedOptions

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```

---

### unsubscribeFromUser

#### unsubscribeFromUser(`params`, `advancedOptions?`)

Unsubscribe from a user.

Example:

```typescript
await audiusSdk.users.unsubscribeFromUser({
  trackId: 'x5pJ3Az'
  userId: "7eP5n",
});
```

#### `params`

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name               | Type     | Description                            | Required?    |
| :----------------- | :------- | :------------------------------------- | :----------- |
| `userId`           | `string` | The ID of the user                     | **Required** |
| `subscribeeUserId` | `string` | The ID of the user to unsubscribe from | **Required** |

#### `advancedOptions`

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

```ts
Promise<{
  blockHash: string;
  blockNumber: number;
}>;
```
