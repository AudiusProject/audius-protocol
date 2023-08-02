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
    createdAt: string
    favoriteItemId: string // The ID of the track, playlist, or album
    favoriteType: string // The type of favorite ("track", "playlist", or "album")
    userId: string
  }[]
>
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
      albumCount: number
      artistPickTrackId?: string
      bio?: string
      coverPhoto?: {
        "_2000"?: string
        "_640"?: string
      }
      doesFollowCurrentUser?: boolean
      ercWallet: string
      followeeCount: number
      followerCount: number
      handle: string
      id: string
      isAvailable: boolean
      isDeactivated: boolean
      isVerified: boolean
      location?: string
      name: string
      playlistCount: number
      profilePicture?: {
        "_1000x1000"?: string
        "_150x150"?: string
        "_480x480"?: string
      }
      repostCount: number
      splWallet: string
      supporterCount: number
      supportingCount: number
      totalAudioBalance: number
      trackCount: number
    }[]
>
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
      id: string
    } // The entire item is returned, always contains id
    itemType?: string // The type of the item ("track", "playlist", or "album")
    timestamp?: string
  }[]
>
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

### updateProfile

#### updateProfile(`requestParameters`, `advancedOptions?`)

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

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name                 | Type                                                                                                       | Default value | Required? | Notes                                                                                                                                                                     |
| :------------------- | :--------------------------------------------------------------------------------------------------------- | :------------ | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `profilePictureFile` | `File`                                                                                                     | `undefined`   | No        |                                                                                                                                                                           |
| `coverArtFile`       | `File`                                                                                                     | `undefined`   | No        |                                                                                                                                                                           |
| `metadata`           | `{ name?: string; bio?: string; location?: string; isDeactivated?: boolean; artistPickTrackId?: string; }` | N/A           | Yes       |                                                                                                                                                                           |
| `onProgress`         | `(progress: number) => void`                                                                               | `undefined`   | No        | Callback for receiving updates on the progress of the profile pic and/or cover art upload. Not relevant if neither `coverArtFile` nor `profilePictureFile` are specified. |
| `userId`             | `string`                                                                                                   | N/A           | Yes       |                                                                                                                                                                           |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### followUser

#### followUser(`requestParameters`, `advancedOptions?`)

Follow a user.

Example:

```typescript
await audiusSdk.users.followUser({
  userId: "7eP5n",
  followeeUserId: "2kN2a", // User id to follow
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name             | Type     | Default value | Required? |
| :--------------- | :------- | :------------ | :-------- |
| `userId`         | `string` | N/A           | Yes       |
| `followeeUserId` | `string` | N/A           | Yes       |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### unfollowUser

#### unfollowUser(`requestParameters`, `advancedOptions?`)

Unfollow a user.

Example:

```typescript
await audiusSdk.users.unfollowUser({
  userId: "7eP5n",
  followeeUserId: "2kN2a", // User id to unfollow
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name             | Type     | Default value | Required? |
| :--------------- | :------- | :------------ | :-------- |
| `userId`         | `string` | N/A           | Yes       |
| `followeeUserId` | `string` | N/A           | Yes       |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### subscribeToUser

#### subscribeToUser(`requestParameters`, `advancedOptions?`)

Subscribe to a user.

Example:

```typescript
await audiusSdk.users.subscribeToUser({
  userId: "7eP5n",
  subscribeeUserId: "2kN2a", // User id to subscribe to
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name               | Type     | Default value | Required? |
| :----------------- | :------- | :------------ | :-------- |
| `userId`           | `string` | N/A           | Yes       |
| `subscribeeUserId` | `string` | N/A           | Yes       |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### unsubscribeFromUser

#### unsubscribeFromUser(`requestParameters`, `advancedOptions?`)

Unsubscribe from a user.

Example:

```typescript
await audiusSdk.users.unsubscribeFromUser({
  trackId: 'x5pJ3Az'
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name               | Type     | Default value | Required? |
| :----------------- | :------- | :------------ | :-------- |
| `userId`           | `string` | N/A           | Yes       |
| `subscribeeUserId` | `string` | N/A           | Yes       |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`
