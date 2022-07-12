import { Client } from '@elastic/elasticsearch'
import { ApolloServer, gql } from 'apollo-server'
import bodybuilder, { Bodybuilder } from 'bodybuilder'
import { PlaylistDoc, TrackDoc, UserDoc } from './src/types/docs'

let url = 'http://localhost:9200'
const esc = new Client({ node: url })

const indexNames = {
  users: 'users',
  tracks: 'tracks',
  playlists: 'playlists',
}

const typeDefs = gql`
  type Track {
    id: String!
    title: String!

    favorite_count: Int!
    repost_count: Int!

    favorited_by(limit: Int = 3, offset: Int = 0): [User!]!
    reposted_by(limit: Int = 3, offset: Int = 0): [User!]!
  }

  type User {
    id: String!
    handle: String!
    bio: String
    location: String

    follower_count: Int!
    following_count: Int!

    tracks(limit: Int = 3, offset: Int = 0): [Track!]!
    playlists(limit: Int = 3, offset: Int = 0): [Playlist!]!
    followers(limit: Int = 3, offset: Int = 0): [User!]!
    following(limit: Int = 3, offset: Int = 0): [User!]!
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
  }

  type Query {
    users(handle: String): [User]
  }
`

type PaginationArgs = {
  limit: number
  offset: number
}

const resolvers = {
  Track: {
    id: (parent: TrackDoc) => parent.track_id,
    reposted_by: async (parent: TrackDoc, args: PaginationArgs) => {
      return usersLoadMany(parent.reposted_by, args)
    },
    favorited_by: async (parent: TrackDoc, args: PaginationArgs) => {
      return usersLoadMany(parent.saved_by, args)
    },
  },
  Playlist: {
    id: (parent: PlaylistDoc) => parent.playlist_id,
    name: (parent: PlaylistDoc) => parent.playlist_name,
    tracks: fetchTracks,
    favorite_count: (parent: PlaylistDoc) => parent.save_count,
    reposted_by: async (parent: TrackDoc, args: PaginationArgs) => {
      return usersLoadMany(parent.reposted_by, args)
    },
    favorited_by: async (parent: TrackDoc, args: PaginationArgs) => {
      return usersLoadMany(parent.saved_by, args)
    },
  },
  User: {
    id: (parent: UserDoc) => parent.user_id,
    tracks: fetchTracks,
    playlists: async (parent: UserDoc, args: PaginationArgs) => {
      const bb = bodybuilder()
        .filter('term', 'playlist_owner_id', parent.user_id)
        .filter('term', 'is_delete', false)
        .filter('term', 'is_private', false)
        .size(args.limit)
        .from(args.offset)
        .sort('created_at', 'desc')
      return bbSearch(indexNames.playlists, bb)
    },
    followers: async (parent: UserDoc, args: PaginationArgs) => {
      const bb = bodybuilder()
        .filter('term', 'following_ids', parent.user_id)
        .size(args.limit)
        .from(args.offset)
        .sort('follower_count', 'desc')
      return bbSearch(indexNames.users, bb)
    },
    following: async (parent: UserDoc, args: PaginationArgs) => {
      return usersLoadMany(parent.following_ids, args)
    },
  },
  Query: {
    users: async (parent: any, args: any) => {
      const bb = bodybuilder()
      if (args.handle) {
        bb.filter('term', 'handle', args.handle)
      }
      return bbSearch(indexNames.users, bb)
    },
  },
}

async function fetchTracks(
  parent: UserDoc | PlaylistDoc,
  args: PaginationArgs
) {
  const ids = parent.tracks
    .map((t) => t.track_id.toString())
    .slice(args.offset, args.offset + args.limit)
  if (!ids.length) return []
  const got = await esc.mget({ index: indexNames.tracks, ids })
  const tracks = got.docs.map((doc: any) => doc._source)
  return tracks
}

async function usersLoadMany(idList: any[], args: PaginationArgs) {
  const ids = idList
    .map((x) => x.toString())
    .slice(args.offset, args.offset + args.limit)
  if (!ids.length) return []
  const got = await esc.mget({ index: indexNames.users, ids })
  return got.docs.map((doc: any) => doc._source)
}

async function bbSearch(index: string, bb: Bodybuilder) {
  return esc
    .search({
      index,
      ...bb.build(),
    })
    .then((r) => r.hits.hits.map((h) => h._source))
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  cache: 'bounded',
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
