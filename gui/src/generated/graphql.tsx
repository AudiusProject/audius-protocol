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
};

export type Playlist = {
  __typename?: 'Playlist';
  created_at: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  favorite_count: Scalars['Int'];
  favorited_by: Array<User>;
  id: Scalars['String'];
  name: Scalars['String'];
  repost_count: Scalars['Int'];
  reposted_by: Array<User>;
  tracks: Array<Track>;
};


export type PlaylistFavorited_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type PlaylistReposted_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type PlaylistTracksArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};

export type Query = {
  __typename?: 'Query';
  users: Array<User>;
};


export type QueryUsersArgs = {
  handle?: InputMaybe<Scalars['String']>;
};

export type Track = {
  __typename?: 'Track';
  favorite_count: Scalars['Int'];
  favorited_by: Array<User>;
  id: Scalars['String'];
  repost_count: Scalars['Int'];
  reposted_by: Array<User>;
  stream_urls: Array<Scalars['String']>;
  title: Scalars['String'];
};


export type TrackFavorited_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type TrackReposted_ByArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};

export type User = {
  __typename?: 'User';
  bio?: Maybe<Scalars['String']>;
  follower_count: Scalars['Int'];
  followers: Array<User>;
  following: Array<User>;
  following_count: Scalars['Int'];
  handle: Scalars['String'];
  id: Scalars['String'];
  location?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  playlists: Array<Playlist>;
  tracks: Array<Track>;
};


export type UserFollowersArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type UserFollowingArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type UserPlaylistsArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type UserTracksArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};

export type ProfileQueryVariables = Exact<{
  handle?: InputMaybe<Scalars['String']>;
}>;


export type ProfileQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, handle: string, name: string, tracks: Array<{ __typename?: 'Track', id: string, title: string, favorite_count: number, repost_count: number, stream_urls: Array<string>, favorited_by: Array<{ __typename?: 'User', id: string, handle: string }>, reposted_by: Array<{ __typename?: 'User', id: string, handle: string }> }>, playlists: Array<{ __typename?: 'Playlist', id: string, name: string }> }> };


export const ProfileDocument = gql`
    query Profile($handle: String) {
  users(handle: $handle) {
    id
    handle
    name
    tracks(limit: 100) {
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