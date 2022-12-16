import { gql } from 'apollo-server'

export const typeDefs = gql`
  scalar Date
  scalar JSON

  enum SizeSquare {
    _150x150
    _480x480
    _1000x1000
  }
  enum SizeWidth {
    _640x
    _2000x
  }

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
    description: String
    length: Int!
    created_at: String!
    owner: User!
    permalink: String!
    cover_art_urls(size: SizeSquare! = _150x150): [String!]!

    favorite_count: Int!
    repost_count: Int!
    stream_urls: [String!]!

    favorited_by(limit: Int = 3, offset: Int = 0): [User!]!
    reposted_by(limit: Int = 3, offset: Int = 0): [User!]!

    is_reposted: Boolean!
    is_saved: Boolean!

    # populated in feed query
    activity_timestamp: String
  }

  type User {
    id: String!
    handle: String!
    name: String!
    bio: String
    location: String
    cover_photo_urls(size: SizeWidth! = _640x): [String!]!
    profile_picture_urls(size: SizeSquare! = _150x150): [String!]!

    follower_count: Int!
    following_count: Int!
    track_count: Int!
    repost_count: Int!

    is_follower: Boolean!
    is_followed: Boolean!

    tracks(
      id: ID
      query: String
      limit: Int = 3
      offset: Int = 0
      sort: TrackSort
      sort_direction: SortDirection
    ): [Track!]!

    reposted_tracks(
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

    reposted_playlists: [Playlist!]!

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
    owner: User!
    # playlist_image_multihash
    # playlist_image_sizes_multihash
    image_urls(size: SizeSquare! = _150x150): [String!]!

    favorite_count: Int!
    repost_count: Int!

    favorited_by(limit: Int = 3, offset: Int = 0): [User!]!
    reposted_by(limit: Int = 3, offset: Int = 0): [User!]!
    tracks(limit: Int = 3, offset: Int = 0): [Track!]!

    is_reposted: Boolean!
    is_saved: Boolean!

    # populated in feed query
    activity_timestamp: String
  }

  union FeedItem = Track | Playlist

  # -----------------------
  # ROOT QUERY
  # -----------------------

  type Query {
    user(handle: String): User

    me: User

    users(
      query: String
      has_reposted_track_id: ID
      has_favorited_track_id: ID

      is_following_user_id: ID
      is_followed_by_user_id: ID
      is_followed_by_current_user: Boolean
      limit: Int = 50
      offset: Int = 0
    ): [User!]!

    track(permalink: String!): Track

    tracks(
      query: String
      owned_by: ID
      reposted_by: ID
      favorited_by: ID
      limit: Int = 20
      offset: Int = 0
    ): [Track!]!

    feed(
      reposts: Boolean = true
      original: Boolean = true
      limit: Int = 11
    ): [FeedItem!]!

    wip_notifications: JSON
    wip_reposts: JSON
  }
`
