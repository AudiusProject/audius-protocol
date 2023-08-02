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
