### createPlaylist

**createPlaylist**(`requestParameters`, `writeOptions?`): `Promise`<{ `playlistId`: `number`, `blockHash`: `string`; `blockNumber`: `number`; }\>

Create a playlist from exisitng tracks

Example:

```typescript
import fs from "fs";

const coverArtBuffer = fs.readFileSync("path/to/cover-art.png");

const { playlistId } = await audiusSdk.playlists.createPlaylist({
  coverArtFile: {
    buffer: Buffer.from(coverArtBuffer),
    name: "coverArt",
  },
  metadata: {
    description: "The best tracks for Fido.",
    playlistName: "Music for Dogs",
  },
  onProgress: (progress) => {
    console.log("Progress: ", progress / 100);
  },
  trackIds: ["yyNwXq7"],
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name | Type | Default value | Required? |
| :------ | :------ | :------ | :------ |
| `coverArtFile` | [`CrossPlatformFile`](../modules.md#crossplatformfile) | N/A | No |
| `metadata` | { playlistName: string; description?: string; isPrivate?: boolean; } | N/A | Yes |
| `onProgress` | `(progress: number) => void` | `undefined` | No |
| `trackIds` | `Array<string>` | [] | Yes | 
| `userId` | `string` | N/A | Yes |


### `writeOptions` parameters (advanced)

You can pass an optional (writeOptions)[/developers/sdk/interfaces/writeOptions] object as the second argument.

#### Returns

Returns a `Promise` containing an object with the playlist ID (`playlistId`), as well as the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise`<{ `blockHash`: `string`; `blockNumber`: `number`;  `playlistId`: `number`  }\>

---

### createPlaylist

**createPlaylist**(`requestParameters`, `writeOptions?`): `Promise`<{ `playlistId`: `number`, `blockHash`: `string`; `blockNumber`: `number`; }\>

Create a playlist from exisitng tracks

Example:

```typescript
import fs from "fs";

const coverArtBuffer = fs.readFileSync("path/to/cover-art.png");

const { playlistId } = await audiusSdk.playlists.createPlaylist({
  coverArtFile: {
    buffer: Buffer.from(coverArtBuffer),
    name: "coverArt",
  },
  metadata: {
    description: "The best tracks for Fido.",
    playlistName: "Music for Dogs",
  },
  onProgress: (progress) => {
    console.log("Progress: ", progress / 100);
  },
  trackIds: ["yyNwXq7"],
  userId: "7eP5n",
});
```

#### `requestParameters` parameters

Create an object with the following fields and pass it as the first argument, as shown in the example above.

| Name | Type | Default value | Required? |
| :------ | :------ | :------ | :------ |
| `coverArtFile` | [`CrossPlatformFile`](../modules.md#crossplatformfile) | N/A | No |
| `metadata` | { playlistName: string; description?: string; isPrivate?: boolean; } | N/A | Yes |
| `onProgress` | `(progress: number) => void` | `undefined` | No |
| `trackIds` | `Array<string>` | [] | Yes | 
| `userId` | `string` | N/A | Yes |


### `writeOptions` parameters (advanced)

You can pass an optional (writeOptions)[/developers/sdk/interfaces/writeOptions] object as the second argument.

#### Returns

Returns a `Promise` containing an object with the playlist ID (`playlistId`), as well as the block hash (`blockHash`) and block number (`blockNumber`) for the transaction.

Return type:

`Promise`<{ `blockHash`: `string`; `blockNumber`: `number`;  `playlistId`: `number`  }\>

---