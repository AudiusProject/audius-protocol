import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: any;
  JSON: any;
};

export type FeedItem = Playlist | Track;

export type Playlist = {
  __typename?: 'Playlist';
  activity_timestamp?: Maybe<Scalars['String']>;
  created_at: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  favorite_count: Scalars['Int'];
  favorited_by: Array<User>;
  id: Scalars['String'];
  image_urls: Array<Scalars['String']>;
  is_reposted: Scalars['Boolean'];
  is_saved: Scalars['Boolean'];
  name: Scalars['String'];
  owner: User;
  repost_count: Scalars['Int'];
  reposted_by: Array<User>;
  tracks: Array<Track>;
};


export type PlaylistFavorited_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type PlaylistImage_UrlsArgs = {
  size?: SizeSquare;
};


export type PlaylistReposted_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type PlaylistTracksArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};

export enum PlaylistSort {
  Name = 'name',
  RepostCount = 'repost_count'
}

export type Query = {
  __typename?: 'Query';
  feed: Array<FeedItem>;
  me?: Maybe<User>;
  track?: Maybe<Track>;
  tracks: Array<Track>;
  user?: Maybe<User>;
  users: Array<User>;
  wip_notifications?: Maybe<Scalars['JSON']>;
  wip_reposts?: Maybe<Scalars['JSON']>;
};


export type QueryFeedArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  original?: InputMaybe<Scalars['Boolean']>;
  reposts?: InputMaybe<Scalars['Boolean']>;
};


export type QueryTrackArgs = {
  permalink: Scalars['String'];
};


export type QueryTracksArgs = {
  favorited_by?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  owned_by?: InputMaybe<Scalars['ID']>;
  query?: InputMaybe<Scalars['String']>;
  reposted_by?: InputMaybe<Scalars['ID']>;
};


export type QueryUserArgs = {
  handle?: InputMaybe<Scalars['String']>;
};


export type QueryUsersArgs = {
  has_favorited_track_id?: InputMaybe<Scalars['ID']>;
  has_reposted_track_id?: InputMaybe<Scalars['ID']>;
  is_followed_by_current_user?: InputMaybe<Scalars['Boolean']>;
  is_followed_by_user_id?: InputMaybe<Scalars['ID']>;
  is_following_user_id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
};

export enum SizeSquare {
  '150x150' = '_150x150',
  '480x480' = '_480x480',
  '1000x1000' = '_1000x1000'
}

export enum SizeWidth {
  '640x' = '_640x',
  '2000x' = '_2000x'
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Track = {
  __typename?: 'Track';
  activity_timestamp?: Maybe<Scalars['String']>;
  cover_art_urls: Array<Scalars['String']>;
  created_at: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  favorite_count: Scalars['Int'];
  favorited_by: Array<User>;
  id: Scalars['String'];
  is_reposted: Scalars['Boolean'];
  is_saved: Scalars['Boolean'];
  length: Scalars['Int'];
  owner: User;
  permalink: Scalars['String'];
  repost_count: Scalars['Int'];
  reposted_by: Array<User>;
  stream_urls: Array<Scalars['String']>;
  title: Scalars['String'];
};


export type TrackCover_Art_UrlsArgs = {
  size?: SizeSquare;
};


export type TrackFavorited_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type TrackReposted_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};

export enum TrackSort {
  Length = 'length',
  RepostCount = 'repost_count',
  Title = 'title'
}

export type User = {
  __typename?: 'User';
  bio?: Maybe<Scalars['String']>;
  cover_photo_urls: Array<Scalars['String']>;
  follower_count: Scalars['Int'];
  followers: Array<User>;
  following: Array<User>;
  following_count: Scalars['Int'];
  handle: Scalars['String'];
  id: Scalars['String'];
  is_followed: Scalars['Boolean'];
  is_follower: Scalars['Boolean'];
  location?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  playlists: Array<Playlist>;
  profile_picture_urls: Array<Scalars['String']>;
  repost_count: Scalars['Int'];
  reposted_playlists: Array<Playlist>;
  reposted_tracks: Array<Track>;
  track_count: Scalars['Int'];
  tracks: Array<Track>;
};


export type UserCover_Photo_UrlsArgs = {
  size?: SizeWidth;
};


export type UserFollowersArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  sort?: InputMaybe<UserSort>;
  sort_direction?: InputMaybe<SortDirection>;
};


export type UserFollowingArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  sort?: InputMaybe<UserSort>;
  sort_direction?: InputMaybe<SortDirection>;
};


export type UserPlaylistsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  sort?: InputMaybe<PlaylistSort>;
  sort_direction?: InputMaybe<SortDirection>;
};


export type UserProfile_Picture_UrlsArgs = {
  size?: SizeSquare;
};


export type UserReposted_TracksArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  sort?: InputMaybe<TrackSort>;
  sort_direction?: InputMaybe<SortDirection>;
};


export type UserTracksArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  sort?: InputMaybe<TrackSort>;
  sort_direction?: InputMaybe<SortDirection>;
};

export enum UserSort {
  FollowerCount = 'follower_count',
  FollowingCount = 'following_count',
  Handle = 'handle',
  Name = 'name'
}

export type UserListingQueryVariables = Exact<{
  followed?: InputMaybe<Scalars['Boolean']>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  query?: InputMaybe<Scalars['String']>;
  has_reposted_track_id?: InputMaybe<Scalars['ID']>;
  has_favorited_track_id?: InputMaybe<Scalars['ID']>;
  is_following_user_id?: InputMaybe<Scalars['ID']>;
  is_followed_by_user_id?: InputMaybe<Scalars['ID']>;
}>;


export type UserListingQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, handle: string, name: string, follower_count: number, is_followed: boolean, profile_picture_urls: Array<string> }> };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, handle: string, name: string, cover_photo_urls: Array<string>, profile_picture_urls: Array<string>, tracks: Array<{ __typename?: 'Track', cover_art_urls: Array<string>, id: string, title: string, favorite_count: number, repost_count: number, stream_urls: Array<string>, owner: { __typename?: 'User', id: string, name: string, handle: string }, favorited_by: Array<{ __typename?: 'User', id: string, handle: string }>, reposted_by: Array<{ __typename?: 'User', id: string, handle: string }> }>, playlists: Array<{ __typename?: 'Playlist', id: string, name: string }> } | null };

export type PlaylistDetailQueryVariables = Exact<{
  handle?: InputMaybe<Scalars['String']>;
  playlistSlug?: InputMaybe<Scalars['String']>;
}>;


export type PlaylistDetailQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, handle: string, name: string, playlists: Array<{ __typename?: 'Playlist', id: string, name: string, image_urls: Array<string>, tracks: Array<{ __typename?: 'Track', id: string, title: string, repost_count: number, favorite_count: number, cover_art_urls: Array<string>, stream_urls: Array<string>, owner: { __typename?: 'User', id: string, name: string, handle: string, bio?: string | null, track_count: number, following_count: number, follower_count: number, is_followed: boolean, is_follower: boolean, cover_photo_urls: Array<string>, profile_picture_urls: Array<string> } }> }> } | null };

export type TrackOwnerFragment = { __typename?: 'User', id: string, name: string, handle: string, bio?: string | null, track_count: number, following_count: number, follower_count: number, is_followed: boolean, is_follower: boolean, cover_photo_urls: Array<string>, profile_picture_urls: Array<string> };

export type ProfileQueryVariables = Exact<{
  handle?: InputMaybe<Scalars['String']>;
}>;


export type ProfileQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, handle: string, name: string, cover_photo_urls: Array<string>, profile_picture_urls: Array<string>, follower_count: number, following_count: number, tracks: Array<{ __typename?: 'Track', cover_art_urls: Array<string>, id: string, title: string, favorite_count: number, repost_count: number, stream_urls: Array<string>, owner: { __typename?: 'User', id: string, name: string, handle: string, bio?: string | null, track_count: number, following_count: number, follower_count: number, is_followed: boolean, is_follower: boolean, cover_photo_urls: Array<string>, profile_picture_urls: Array<string> }, favorited_by: Array<{ __typename?: 'User', id: string, handle: string }>, reposted_by: Array<{ __typename?: 'User', id: string, handle: string }> }>, playlists: Array<{ __typename?: 'Playlist', id: string, name: string }> } | null };

export type ProfileLayoutQueryVariables = Exact<{
  handle?: InputMaybe<Scalars['String']>;
}>;


export type ProfileLayoutQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, handle: string, name: string, cover_photo_urls: Array<string>, profile_picture_urls: Array<string>, follower_count: number, following_count: number, is_follower: boolean, is_followed: boolean } | null };

export type ProfileRepostsQueryVariables = Exact<{
  handle?: InputMaybe<Scalars['String']>;
}>;


export type ProfileRepostsQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, repost_count: number, reposted_tracks: Array<{ __typename?: 'Track', id: string, title: string, cover_art_urls: Array<string>, favorite_count: number, repost_count: number, stream_urls: Array<string>, owner: { __typename?: 'User', id: string, name: string, handle: string, bio?: string | null, track_count: number, following_count: number, follower_count: number, is_followed: boolean, is_follower: boolean, cover_photo_urls: Array<string>, profile_picture_urls: Array<string> } }> } | null };

export type TrackDetailQueryVariables = Exact<{
  handle?: InputMaybe<Scalars['String']>;
  trackId?: InputMaybe<Scalars['ID']>;
}>;


export type TrackDetailQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, handle: string, name: string, tracks: Array<{ __typename?: 'Track', id: string, title: string, cover_art_urls: Array<string>, length: number, description?: string | null, favorite_count: number, repost_count: number, stream_urls: Array<string>, owner: { __typename?: 'User', id: string, handle: string, name: string } }> } | null };

export const TrackOwnerFragmentDoc = gql`
    fragment TrackOwner on User {
  id
  name
  handle
  bio
  track_count
  following_count
  follower_count
  is_followed
  is_follower
  cover_photo_urls
  profile_picture_urls
}
    `;
export const UserListingDocument = gql`
    query UserListing($followed: Boolean, $limit: Int, $offset: Int = 0, $query: String, $has_reposted_track_id: ID, $has_favorited_track_id: ID, $is_following_user_id: ID, $is_followed_by_user_id: ID) {
  users(
    query: $query
    has_reposted_track_id: $has_reposted_track_id
    has_favorited_track_id: $has_favorited_track_id
    is_following_user_id: $is_following_user_id
    is_followed_by_user_id: $is_followed_by_user_id
    is_followed_by_current_user: $followed
    limit: $limit
    offset: $offset
  ) {
    id
    handle
    name
    follower_count
    is_followed
    profile_picture_urls
  }
}
    `;

/**
 * __useUserListingQuery__
 *
 * To run a query within a React component, call `useUserListingQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserListingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserListingQuery({
 *   variables: {
 *      followed: // value for 'followed'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      query: // value for 'query'
 *      has_reposted_track_id: // value for 'has_reposted_track_id'
 *      has_favorited_track_id: // value for 'has_favorited_track_id'
 *      is_following_user_id: // value for 'is_following_user_id'
 *      is_followed_by_user_id: // value for 'is_followed_by_user_id'
 *   },
 * });
 */
export function useUserListingQuery(baseOptions?: Apollo.QueryHookOptions<UserListingQuery, UserListingQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserListingQuery, UserListingQueryVariables>(UserListingDocument, options);
      }
export function useUserListingLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserListingQuery, UserListingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserListingQuery, UserListingQueryVariables>(UserListingDocument, options);
        }
export type UserListingQueryHookResult = ReturnType<typeof useUserListingQuery>;
export type UserListingLazyQueryHookResult = ReturnType<typeof useUserListingLazyQuery>;
export type UserListingQueryResult = Apollo.QueryResult<UserListingQuery, UserListingQueryVariables>;
export const MeDocument = gql`
    query Me {
  me {
    id
    handle
    name
    cover_photo_urls(size: _2000x)
    profile_picture_urls
    tracks(limit: 100) {
      cover_art_urls
      owner {
        id
        name
        handle
      }
      id
      title
      favorite_count
      favorited_by {
        id
        handle
      }
      repost_count
      reposted_by {
        id
        handle
      }
      stream_urls
    }
    playlists {
      id
      name
    }
  }
}
    `;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const PlaylistDetailDocument = gql`
    query PlaylistDetail($handle: String, $playlistSlug: String) {
  user(handle: $handle) {
    id
    handle
    name
    playlists(query: $playlistSlug, limit: 1) {
      id
      name
      image_urls(size: _480x480)
      tracks(limit: 1000) {
        id
        title
        repost_count
        favorite_count
        cover_art_urls
        stream_urls
        owner {
          ...TrackOwner
        }
      }
    }
  }
}
    ${TrackOwnerFragmentDoc}`;

/**
 * __usePlaylistDetailQuery__
 *
 * To run a query within a React component, call `usePlaylistDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `usePlaylistDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePlaylistDetailQuery({
 *   variables: {
 *      handle: // value for 'handle'
 *      playlistSlug: // value for 'playlistSlug'
 *   },
 * });
 */
export function usePlaylistDetailQuery(baseOptions?: Apollo.QueryHookOptions<PlaylistDetailQuery, PlaylistDetailQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PlaylistDetailQuery, PlaylistDetailQueryVariables>(PlaylistDetailDocument, options);
      }
export function usePlaylistDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PlaylistDetailQuery, PlaylistDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PlaylistDetailQuery, PlaylistDetailQueryVariables>(PlaylistDetailDocument, options);
        }
export type PlaylistDetailQueryHookResult = ReturnType<typeof usePlaylistDetailQuery>;
export type PlaylistDetailLazyQueryHookResult = ReturnType<typeof usePlaylistDetailLazyQuery>;
export type PlaylistDetailQueryResult = Apollo.QueryResult<PlaylistDetailQuery, PlaylistDetailQueryVariables>;
export const ProfileDocument = gql`
    query Profile($handle: String) {
  user(handle: $handle) {
    id
    handle
    name
    cover_photo_urls(size: _2000x)
    profile_picture_urls
    follower_count
    following_count
    tracks(limit: 100) {
      cover_art_urls
      owner {
        ...TrackOwner
      }
      id
      title
      favorite_count
      favorited_by {
        id
        handle
      }
      repost_count
      reposted_by {
        id
        handle
      }
      stream_urls
    }
    playlists(limit: 100) {
      id
      name
    }
  }
}
    ${TrackOwnerFragmentDoc}`;

/**
 * __useProfileQuery__
 *
 * To run a query within a React component, call `useProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProfileQuery({
 *   variables: {
 *      handle: // value for 'handle'
 *   },
 * });
 */
export function useProfileQuery(baseOptions?: Apollo.QueryHookOptions<ProfileQuery, ProfileQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProfileQuery, ProfileQueryVariables>(ProfileDocument, options);
      }
export function useProfileLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProfileQuery, ProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProfileQuery, ProfileQueryVariables>(ProfileDocument, options);
        }
export type ProfileQueryHookResult = ReturnType<typeof useProfileQuery>;
export type ProfileLazyQueryHookResult = ReturnType<typeof useProfileLazyQuery>;
export type ProfileQueryResult = Apollo.QueryResult<ProfileQuery, ProfileQueryVariables>;
export const ProfileLayoutDocument = gql`
    query ProfileLayout($handle: String) {
  user(handle: $handle) {
    id
    handle
    name
    cover_photo_urls(size: _2000x)
    profile_picture_urls
    follower_count
    following_count
    is_follower
    is_followed
  }
}
    `;

/**
 * __useProfileLayoutQuery__
 *
 * To run a query within a React component, call `useProfileLayoutQuery` and pass it any options that fit your needs.
 * When your component renders, `useProfileLayoutQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProfileLayoutQuery({
 *   variables: {
 *      handle: // value for 'handle'
 *   },
 * });
 */
export function useProfileLayoutQuery(baseOptions?: Apollo.QueryHookOptions<ProfileLayoutQuery, ProfileLayoutQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProfileLayoutQuery, ProfileLayoutQueryVariables>(ProfileLayoutDocument, options);
      }
export function useProfileLayoutLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProfileLayoutQuery, ProfileLayoutQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProfileLayoutQuery, ProfileLayoutQueryVariables>(ProfileLayoutDocument, options);
        }
export type ProfileLayoutQueryHookResult = ReturnType<typeof useProfileLayoutQuery>;
export type ProfileLayoutLazyQueryHookResult = ReturnType<typeof useProfileLayoutLazyQuery>;
export type ProfileLayoutQueryResult = Apollo.QueryResult<ProfileLayoutQuery, ProfileLayoutQueryVariables>;
export const ProfileRepostsDocument = gql`
    query ProfileReposts($handle: String) {
  user(handle: $handle) {
    id
    repost_count
    reposted_tracks(limit: 100) {
      id
      title
      cover_art_urls
      favorite_count
      repost_count
      stream_urls
      owner {
        ...TrackOwner
      }
    }
  }
}
    ${TrackOwnerFragmentDoc}`;

/**
 * __useProfileRepostsQuery__
 *
 * To run a query within a React component, call `useProfileRepostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useProfileRepostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProfileRepostsQuery({
 *   variables: {
 *      handle: // value for 'handle'
 *   },
 * });
 */
export function useProfileRepostsQuery(baseOptions?: Apollo.QueryHookOptions<ProfileRepostsQuery, ProfileRepostsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ProfileRepostsQuery, ProfileRepostsQueryVariables>(ProfileRepostsDocument, options);
      }
export function useProfileRepostsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ProfileRepostsQuery, ProfileRepostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ProfileRepostsQuery, ProfileRepostsQueryVariables>(ProfileRepostsDocument, options);
        }
export type ProfileRepostsQueryHookResult = ReturnType<typeof useProfileRepostsQuery>;
export type ProfileRepostsLazyQueryHookResult = ReturnType<typeof useProfileRepostsLazyQuery>;
export type ProfileRepostsQueryResult = Apollo.QueryResult<ProfileRepostsQuery, ProfileRepostsQueryVariables>;
export const TrackDetailDocument = gql`
    query TrackDetail($handle: String, $trackId: ID) {
  user(handle: $handle) {
    id
    handle
    name
    tracks(id: $trackId, limit: 1) {
      id
      title
      cover_art_urls(size: _480x480)
      length
      description
      owner {
        id
        handle
        name
      }
      favorite_count
      repost_count
      stream_urls
    }
  }
}
    `;

/**
 * __useTrackDetailQuery__
 *
 * To run a query within a React component, call `useTrackDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrackDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrackDetailQuery({
 *   variables: {
 *      handle: // value for 'handle'
 *      trackId: // value for 'trackId'
 *   },
 * });
 */
export function useTrackDetailQuery(baseOptions?: Apollo.QueryHookOptions<TrackDetailQuery, TrackDetailQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TrackDetailQuery, TrackDetailQueryVariables>(TrackDetailDocument, options);
      }
export function useTrackDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TrackDetailQuery, TrackDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TrackDetailQuery, TrackDetailQueryVariables>(TrackDetailDocument, options);
        }
export type TrackDetailQueryHookResult = ReturnType<typeof useTrackDetailQuery>;
export type TrackDetailLazyQueryHookResult = ReturnType<typeof useTrackDetailLazyQuery>;
export type TrackDetailQueryResult = Apollo.QueryResult<TrackDetailQuery, TrackDetailQueryVariables>;