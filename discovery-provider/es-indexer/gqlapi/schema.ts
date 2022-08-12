import { gql } from 'apollo-server'

export const typeDefs = gql`
  scalar Date
  scalar JSON

  enum TrackSort {
    length # todo: length or duration
    # favorite_count # todo: need to map this field (or use save_count)
    repost_count
    # play_count # todo: need to map this field
    title
  }

  enum UserSort {
    name
    handle
    follower_count
    following_count
  }

  enum PlaylistSort {
    name
    repost_count
  }

  enum SortDirection {
    asc
    desc
  }

  type Track {
    id: String!
    title: String!
    length: Int!

    favorite_count: Int!
    repost_count: Int!
    stream_urls: [String!]!

    favorited_by(limit: Int = 3, offset: Int = 0): [User!]!
    reposted_by(limit: Int = 3, offset: Int = 0): [User!]!

    is_reposted: Boolean!
    is_saved: Boolean!
  }

  type User {
    id: String!
    handle: String!
    name: String!
    bio: String
    location: String

    follower_count: Int!
    following_count: Int!

    is_follower: Boolean!
    is_followed: Boolean!

    tracks(
      query: String
      limit: Int = 3
      offset: Int = 0
      sort: TrackSort
      sort_direction: SortDirection
    ): [Track!]!

    playlists(
      query: String
      limit: Int = 3
      offset: Int = 0
      sort: PlaylistSort
      sort_direction: SortDirection
    ): [Playlist!]!

    followers(
      query: String
      limit: Int = 3
      offset: Int = 0
      sort: UserSort
      sort_direction: SortDirection
    ): [User!]!

    following(
      query: String
      limit: Int = 3
      offset: Int = 0
      sort: UserSort
      sort_direction: SortDirection
    ): [User!]!
  }

  type Playlist {
    id: String!
    name: String!
    description: String
    created_at: String!

    favorite_count: Int!
    repost_count: Int!

    favorited_by(limit: Int = 3, offset: Int = 0): [User!]!
    reposted_by(limit: Int = 3, offset: Int = 0): [User!]!
    tracks(limit: Int = 3, offset: Int = 0): [Track!]!

    is_reposted: Boolean!
    is_saved: Boolean!
  }

  type Query {
    users(handle: String): [User!]!
    feed: JSON!
  }
`
