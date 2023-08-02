---
title: "Resolve"
---

## Methods

### resolve

**resolve**<`T`\>(`requestParameters`): `Promise`<`T`\>

Resolves a provided Audius app URL to the API resource it represents

Example:

```typescript
const resolveResponse = await audiusSdk.resolve<Track>({
  url: "https://audius.co/camouflybeats/hypermantra-86216",
});
const track = resolveResponse.data;
```

#### Type parameters

| Name | Type                                                                                                                             |
| :--- | :------------------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Track`](./sdk/interfaces/Track.md) \| [`Playlist`](./sdk/interfaces/Playlist.md) \| [`User`](./sdk/interfaces/User.md) |

#### Parameters

| Name                | Type                                                   |
| :------------------ | :----------------------------------------------------- |
| `requestParameters` | [`ResolveRequest`](./sdk/interfaces/ResolveRequest.md) |

#### Returns

`Promise`<`T`\>
