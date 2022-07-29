---
id: "modules"
title: "@audius/sdk"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
pagination_prev: null
pagination_next: null
---

## Namespaces

- [full](namespaces/full.md)

## Enumerations

- [GetTipsCurrentUserFollowsEnum](enums/GetTipsCurrentUserFollowsEnum.md)
- [GetTipsUniqueByEnum](enums/GetTipsUniqueByEnum.md)
- [GetTracksByUserSortEnum](enums/GetTracksByUserSortEnum.md)
- [GetTrendingPlaylistsTimeEnum](enums/GetTrendingPlaylistsTimeEnum.md)
- [GetTrendingTracksTimeEnum](enums/GetTrendingTracksTimeEnum.md)

## Classes

- [Configuration](classes/Configuration.md)
- [Playlists](classes/PlaylistsApi.md)
- [Resolve](classes/ResolveApi.md)
- [Tips](classes/TipsApi.md)
- [Tracks](classes/TracksApi.md)
- [Users](classes/UsersApi.md)

## Interfaces

- [Activity](interfaces/Activity.md)
- [ConfigurationParameters](interfaces/ConfigurationParameters.md)
- [ConnectedWallets](interfaces/ConnectedWallets.md)
- [ConnectedWalletsResponse](interfaces/ConnectedWalletsResponse.md)
- [CoverPhoto](interfaces/CoverPhoto.md)
- [DecodedUserToken](interfaces/DecodedUserToken.md)
- [EncodedUserId](interfaces/EncodedUserId.md)
- [Favorite](interfaces/Favorite.md)
- [FavoritesResponse](interfaces/FavoritesResponse.md)
- [GetBulkTracksRequest](interfaces/GetBulkTracksRequest.md)
- [GetConnectedWalletsRequest](interfaces/GetConnectedWalletsRequest.md)
- [GetFavoritesRequest](interfaces/GetFavoritesRequest.md)
- [GetPlaylistRequest](interfaces/GetPlaylistRequest.md)
- [GetPlaylistTracksRequest](interfaces/GetPlaylistTracksRequest.md)
- [GetRepostsRequest](interfaces/GetRepostsRequest.md)
- [GetSupporters](interfaces/GetSupporters.md)
- [GetSupportersRequest](interfaces/GetSupportersRequest.md)
- [GetSupporting](interfaces/GetSupporting.md)
- [GetSupportingsRequest](interfaces/GetSupportingsRequest.md)
- [GetTipsRequest](interfaces/GetTipsRequest.md)
- [GetTipsResponse](interfaces/GetTipsResponse.md)
- [GetTopTrackTagsRequest](interfaces/GetTopTrackTagsRequest.md)
- [GetTrackRequest](interfaces/GetTrackRequest.md)
- [GetTracksByUserRequest](interfaces/GetTracksByUserRequest.md)
- [GetTrendingPlaylistsRequest](interfaces/GetTrendingPlaylistsRequest.md)
- [GetTrendingTracksRequest](interfaces/GetTrendingTracksRequest.md)
- [GetUserIDFromWalletRequest](interfaces/GetUserIDFromWalletRequest.md)
- [GetUserRequest](interfaces/GetUserRequest.md)
- [Playlist](interfaces/Playlist.md)
- [PlaylistArtwork](interfaces/PlaylistArtwork.md)
- [PlaylistResponse](interfaces/PlaylistResponse.md)
- [PlaylistSearchResult](interfaces/PlaylistSearchResult.md)
- [PlaylistTracksResponse](interfaces/PlaylistTracksResponse.md)
- [ProfilePicture](interfaces/ProfilePicture.md)
- [RemixParent](interfaces/RemixParent.md)
- [Reposts](interfaces/Reposts.md)
- [ResolveRequest](interfaces/ResolveRequest.md)
- [SearchPlaylistsRequest](interfaces/SearchPlaylistsRequest.md)
- [SearchTracksRequest](interfaces/SearchTracksRequest.md)
- [SearchUsersRequest](interfaces/SearchUsersRequest.md)
- [StreamTrackRequest](interfaces/StreamTrackRequest.md)
- [Supporter](interfaces/Supporter.md)
- [Supporting](interfaces/Supporting.md)
- [TagsResponse](interfaces/TagsResponse.md)
- [Tip](interfaces/Tip.md)
- [Track](interfaces/Track.md)
- [TrackArtwork](interfaces/TrackArtwork.md)
- [TrackElement](interfaces/TrackElement.md)
- [TrackResponse](interfaces/TrackResponse.md)
- [TrackSearch](interfaces/TrackSearch.md)
- [TracksResponse](interfaces/TracksResponse.md)
- [TrendingPlaylistsResponse](interfaces/TrendingPlaylistsResponse.md)
- [User](interfaces/User.md)
- [UserAssociatedWalletResponse](interfaces/UserAssociatedWalletResponse.md)
- [UserResponse](interfaces/UserResponse.md)
- [UserSearch](interfaces/UserSearch.md)
- [VerifyIDTokenRequest](interfaces/VerifyIDTokenRequest.md)
- [VerifyToken](interfaces/VerifyToken.md)

## Type Aliases

### FetchAPI

 **FetchAPI**: (`url`: `string`, `init?`: `RequestInit`) => `Promise`<`unknown`\>

#### Type declaration

(`url`, `init?`): `Promise`<`unknown`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `init?` | `RequestInit` |

##### Returns

`Promise`<`unknown`\>

## Functions

### sdk

**sdk**(`config`): `Object`

The Audius SDK

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `SdkConfig` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `full` | { `playlists`: [`Playlists`](classes/full.PlaylistsApi.md) ; `reactions`: [`Reactions`](classes/full.ReactionsApi.md) ; `search`: [`Search`](classes/full.SearchApi.md) ; `tips`: [`Tips`](classes/full.TipsApi.md) ; `tracks`: [`Tracks`](classes/full.TracksApi.md) ; `users`: [`Users`](classes/full.UsersApi.md)  } |
| `full.playlists` | [`Playlists`](classes/full.PlaylistsApi.md) |
| `full.reactions` | [`Reactions`](classes/full.ReactionsApi.md) |
| `full.search` | [`Search`](classes/full.SearchApi.md) |
| `full.tips` | [`Tips`](classes/full.TipsApi.md) |
| `full.tracks` | [`Tracks`](classes/full.TracksApi.md) |
| `full.users` | [`Users`](classes/full.UsersApi.md) |
| `oauth` | `undefined` \| `Oauth` |
| `playlists` | [`Playlists`](classes/PlaylistsApi.md) |
| `resolve` | <T\>(`requestParameters`: [`ResolveRequest`](interfaces/ResolveRequest.md)) => `Promise`<`T`\> |
| `tips` | [`Tips`](classes/TipsApi.md) |
| `tracks` | [`Tracks`](classes/TracksApi.md) |
| `users` | [`Users`](classes/UsersApi.md) |
