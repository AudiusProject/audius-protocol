### uploadAlbum

#### uploadAlbum(`requestParameters`, `writeOptions?`)

Upload an album.

Example:

```typescript
import { Mood, Genre } from "@audius/sdk";
import fs from "fs";

const coverArtBuffer = fs.readFileSync("path/to/cover-art.png");
const trackBuffer1 = fs.readFileSync("path/to/track1.mp3");
const trackBuffer2 = fs.readFileSync("path/to/track2.mp3");
const trackBuffer3 = fs.readFileSync("path/to/track3.mp3");

const { albumId } = await audiusSdk.albums.uploadTrack({
  userId: "7eP5n",
  coverArtFile: {
    buffer: Buffer.from(coverArtBuffer),
    name: "coverArt",
  },
  metadata: {
    albumName: "Songs of the Forest",
    description: "My debut album.",
    genre: Genre.ELECTRONIC,
    mood: Mood.TENDER,
    tags: "nature",
    releaseDate: new Date("2023-07-20"), // Cannot be in the future
  },
  trackMetadatas: [
    {
      title: "Oak",
    },
    {
      title: "Sycamore",
    },
    {
      title: "Bush",
    },
  ],
  trackFiles: [
    {
      buffer: Buffer.from(trackBuffer1),
      name: "OakTrack",
    },
    {
      buffer: Buffer.from(trackBuffer2),
      name: "SycamoreTrack",
    },
    {
      buffer: Buffer.from(trackBuffer3),
      name: "BushTrack",
    },
  ],
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name             | Type                                                                                                                                                                                  | Default value | Required? | Notes                                                                                                                                                  |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------ | :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `coverArtFile`   | `File`                                                                                                                                                                                | N/A           | Yes       |                                                                                                                                                        |
| `metadata`       | <code>{ genre: Genre; albumName: string; description?: string; isrc?: string; iswc?: string; license?: string; mood?: Mood; releaseDate?: Date; tags?: string; upc?: string; }</code> | N/A           | Yes       |                                                                                                                                                        |
| `onProgress`     | `(progress: number) => void`                                                                                                                                                          | `undefined`   | No        |                                                                                                                                                        |
| `trackFiles`     | `Array<File>`                                                                                                                                                                         | `[]`          | No        |                                                                                                                                                        |
| `trackMetadatas` | [`UploadTrackMetadata`](/developers/UploadTrackMetadata)`[]`                                                                                                                          | `[]`          | No        | See [here](/developers/UploadTrackMetadata) for full `UploadTrackMetadata` interface. Mood, genre, and tags are inherited from the album if not given. |
| `userId`         | `string`                                                                                                                                                                              | N/A           | Yes       |                                                                                                                                                        |

#### `writeOptions` parameters (advanced)

You can pass an optional [`writeOptions`](/developers/writeOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the new album's ID (`albumId`), as well as the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; albumId: string } >`

---

### updateAlbum

#### updateAlbum(`requestParameters`, `writeOptions?`)

Update an album. If cover art or any metadata fields are not provided, their values will be kept the same as before.

Example:

```typescript
import fs from "fs";

const coverArtBuffer = fs.readFileSync("path/to/updated-cover-art.png");

const { albumId } = await audiusSdk.albums.updateAlbum({
  albumId: "x5pJ3Az",
  coverArtFile: {
    buffer: Buffer.from(coverArtBuffer),
    name: "coverArt",
  },
  metadata: {
    description: "The best tracks for Fido... new cover art!",
  },
  onProgress: (progress) => {
    console.log("Progress: ", progress / 100);
  },
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name           | Type                                                                                                                                                                     | Default value | Required? |
| :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ | :-------- |
| `albumId`      | `string`                                                                                                                                                                 | N/A           | Yes       |
| `userId`       | `string`                                                                                                                                                                 | N/A           | Yes       |
| `coverArtFile` | `string`                                                                                                                                                                 | `undefined`   | No        |
| `metadata`     | <code>{ albumName?: string; description?: string; isrc?: string; iswc?: string; license?: string; mood?: Mood; releaseDate?: Date; tags?: string; upc?: string; }</code> | N/A           | Yes       |
| `onProgress`   | `(progress: number) => void`                                                                                                                                             | `undefined`   | No        |

#### `writeOptions` parameters (advanced)

You can pass an optional [`writeOptions`](/developers/writeOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### deleteAlbum

#### deleteAlbum(`requestParameters`, `writeOptions?`)

Delete an album

Example:

```typescript
await audiusSdk.albums.deleteAlbum({
  albumId: "x5pJ3Bo",
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Default value | Required? |
| :-------- | :------- | :------------ | :-------- |
| `albumId` | `string` | N/A           | Yes       |
| `userId`  | `string` | N/A           | Yes       |

#### `writeOptions` parameters (advanced)

You can pass an optional [`writeOptions`](/developers/writeOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### favoriteAlbum

#### favoriteAlbum(`requestParameters`, `writeOptions?`)

Favorite an album

Example:

```typescript
await audiusSdk.albums.favoriteAlbum({
  albumId: "x5pJ3Az",
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name       | Type                                     | Default value                          | Required? | Notes                                                                |
| :--------- | :--------------------------------------- | :------------------------------------- | :-------- | -------------------------------------------------------------------- |
| `albumId`  | `string`                                 | N/A                                    | Yes       |                                                                      |
| `userId`   | `string`                                 | N/A                                    | Yes       |                                                                      |
| `metadata` | <code>{ isSaveOfRepost: boolean }</code> | <code>{ isSaveOfRepost: false }</code> | No        | Set `isSaveOfRepost` to true if you are favoriting a reposted album. |

#### `writeOptions` parameters (advanced)

You can pass an optional [`writeOptions`](/developers/writeOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### unfavoriteAlbum

#### unfavoriteAlbum(`requestParameters`, `writeOptions?`)

Unfavorite an album

Example:

```typescript
await audiusSdk.albums.unfavoriteAlbum({
  albumId: "x5pJ3Az",
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Default value | Required? |
| :-------- | :------- | :------------ | :-------- |
| `albumId` | `string` | N/A           | Yes       |
| `userId`  | `string` | N/A           | Yes       |

#### `writeOptions` parameters (advanced)

You can pass an optional [`writeOptions`](/developers/writeOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### repostAlbum

#### repostAlbum(`requestParameters`, `writeOptions?`)

Repost a album

Example:

```typescript
await audiusSdk.albums.repostAlbum({
  albumId: "x5pJ3Az",
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name       | Type                                     | Default value                          | Required? | Notes                                                                 |
| :--------- | :--------------------------------------- | :------------------------------------- | :-------- | --------------------------------------------------------------------- |
| `albumId`  | `string`                                 | N/A                                    | Yes       |                                                                       |
| `userId`   | `string`                                 | N/A                                    | Yes       |                                                                       |
| `metadata` | <code>{isRepostOfRepost: boolean}</code> | <code>{ isSaveOfRepost: false }</code> | No        | Set `isRepostOfRepost` to true if you are reposting a reposted album. |

#### `writeOptions` parameters (advanced)

You can pass an optional [`writeOptions`](/developers/writeOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---

### unrepostAlbum

#### unrepostAlbum(`requestParameters`, `writeOptions?`)

Unrepost an album

Example:

```typescript
await audiusSdk.albums.unrepostAlbum({
  albumId: "x5pJ3Az",
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name      | Type     | Default value | Required? |
| :-------- | :------- | :------------ | :-------- |
| `albumId` | `string` | N/A           | Yes       |
| `userId`  | `string` | N/A           | Yes       |

#### `writeOptions` parameters (advanced)

You can pass an optional [`writeOptions`](/developers/writeOptions) object as the second argument.

#### Returns

Returns a `Promise` containing an object with the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise<{ blockHash: string; blockNumber: number; }>`

---
