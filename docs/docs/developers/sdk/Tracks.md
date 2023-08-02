### uploadTrack

#### uploadTrack(`requestParameters`, `advancedOptions?`)

Upload a track.

Example:

```typescript
import { Mood, Genre } from "@audius/sdk";
import fs from "fs";

const coverArtBuffer = fs.readFileSync("path/to/cover-art.png");
const trackBuffer = fs.readFileSync("path/to/track.mp3");

const { trackId } = await audiusSdk.tracks.uploadTrack({
  userId: "7eP5n",
  coverArtFile: {
    buffer: Buffer.from(coverArtBuffer),
    name: "coverArt",
  },
  metadata: {
    title: "Monstera",
    description: "Dedicated to my favorite plant",
    genre: Genre.METAL,
    mood: Mood.DEVOTIONAL,
  },
  trackFile: {
    buffer: Buffer.from(trackArtBuffer),
    name: "monsteraAudio",
  },
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name           | Type                                                     | Default value | Required? | Notes                                                           |
| :------------- | :------------------------------------------------------- | :------------ | :-------- | :-------------------------------------------------------------- |
| `coverArtFile` | `File`                                                   | N/A           | Yes       |                                                                 |
| `metadata`     | [`UploadTrackMetadata`](/developers/UploadTrackMetadata) | N/A           | Yes       | See [here](/developers/UploadTrackMetadata) for full interface. |
| `onProgress`   | `(progress: number) => void`                             | `undefined`   | No        |                                                                 |
| `trackFile`    | `File`                                                   | N/A           | Yes       |                                                                 |
| `userId`       | `string`                                                 | N/A           | Yes       |                                                                 |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the new track's ID (`trackId`), as well as the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; trackId: string }>`

---

### updateTrack

#### updateTrack(`requestParameters`, `advancedOptions?`)

Update a track. If cover art or any metadata fields are not provided, their values will be kept the same as before.

Example:

```typescript
import fs from "fs";
import { Mood } from "@audius/sdk";

const coverArtBuffer = fs.readFileSync("path/to/updated-cover-art.png");

const { trackId } = await audiusSdk.tracks.updateTrack({
  trackId: "h5pJ3Bz",
  coverArtFile: {
    buffer: Buffer.from(coverArtBuffer),
    name: "coverArt",
  },
  metadata: {
    description: "Dedicated to my favorite plant... new cover art!",
    mood: Mood.YEARNING,
  },
  onProgress: (progress) => {
    console.log("Progress: ", progress / 100);
  },
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name           | Type                                                                  | Default value | Required? | Notes                    |
| :------------- | :-------------------------------------------------------------------- | :------------ | :-------- | ------------------------ |
| `trackId`      | `string`                                                              | N/A           | Yes       |                          |
| `userId`       | `string`                                                              | N/A           | Yes       |                          |
| `coverArtFile` | `string`                                                              | `undefined`   | No        |                          |
| `metadata`     | `Partial<`[`UploadTrackMetadata`](/developers/UploadTrackMetadata)`>` | N/A           | Yes       | All fields are optional. |
| `onProgress`   | `(progress: number) => void`                                          | `undefined`   | No        |                          |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### deleteTrack

#### deleteTrack(`requestParameters`, `advancedOptions?`)

Delete a track

Example:

```typescript
await audiusSdk.tracks.deleteTrack({
  trackId: "h5pJ3Bz",
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Default value | Required? |
| :-------- | :------- | :------------ | :-------- |
| `trackId` | `string` | N/A           | Yes       |
| `userId`  | `string` | N/A           | Yes       |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### favoriteTrack

#### favoriteTrack(`requestParameters`, `advancedOptions?`)

Favorite a track

Example:

```typescript
await audiusSdk.tracks.favoriteTrack({
  trackId: 'x5pJ3Az'
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name       | Type                                     | Default value                          | Required? | Notes                                                                |
| :--------- | :--------------------------------------- | :------------------------------------- | :-------- | -------------------------------------------------------------------- |
| `trackId`  | `string`                                 | N/A                                    | Yes       |                                                                      |
| `userId`   | `string`                                 | N/A                                    | Yes       |                                                                      |
| `metadata` | <code>{ isSaveOfRepost: boolean }</code> | <code>{ isSaveOfRepost: false }</code> | No        | Set `isSaveOfRepost` to true if you are favoriting a reposted track. |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### unfavoriteTrack

#### unfavoriteTrack(`requestParameters`, `advancedOptions?`)

Unfavorite a track

Example:

```typescript
await audiusSdk.tracks.unfavoriteTrack({
  trackId: 'x5pJ3Az'
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Default value | Required? |
| :-------- | :------- | :------------ | :-------- |
| `trackId` | `string` | N/A           | Yes       |
| `userId`  | `string` | N/A           | Yes       |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### repostTrack

#### repostTrack(`requestParameters`, `advancedOptions?`)

Repost a track

Example:

```typescript
await audiusSdk.tracks.repostTrack({
  trackId: 'x5pJ3Az'
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name       | Type                                     | Default value                          | Required? | Notes                                                                 |
| :--------- | :--------------------------------------- | :------------------------------------- | :-------- | --------------------------------------------------------------------- |
| `trackId`  | `string`                                 | N/A                                    | Yes       |                                                                       |
| `userId`   | `string`                                 | N/A                                    | Yes       |                                                                       |
| `metadata` | <code>{isRepostOfRepost: boolean}</code> | <code>{ isSaveOfRepost: false }</code> | No        | Set `isRepostOfRepost` to true if you are reposting a reposted track. |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### unrepostTrack

#### unrepostTrack(`requestParameters`, `advancedOptions?`)

Unrepost a track

Example:

```typescript
await audiusSdk.tracks.unrepostTrack({
  trackId: 'x5pJ3Az'
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Default value | Required? |
| :-------- | :------- | :------------ | :-------- |
| `trackId` | `string` | N/A           | Yes       |
| `userId`  | `string` | N/A           | Yes       |

#### `advancedOptions` parameters (advanced)

You can pass an optional [`advancedOptions`](/developers/advancedOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---
