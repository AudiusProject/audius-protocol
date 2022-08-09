import { Client } from '@elastic/elasticsearch'
import { ApolloServer, gql } from 'apollo-server'
import bodybuilder, { Bodybuilder } from 'bodybuilder'
import DataLoader from 'dataloader'
import Hashids from 'hashids'
import { UserRow, TrackRow } from './src/types/db'
import { PlaylistDoc, TrackDoc, UserDoc } from './src/types/docs'

const typeDefs = gql`
  type Track {
    id: String!
    title: String!

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

    is_reposted: Boolean!
    is_saved: Boolean!
  }

  type Query {
    users(handle: String): [User!]!
  }
`

type PaginationArgs = {
  limit: number
  offset: number
}

//
// DataLoaders
//

let esUrl = process.env.audius_elasticsearch_url || 'http://localhost:9200'
const esc = new Client({ node: esUrl })

const indexNames = {
  users: 'users',
  tracks: 'tracks',
  playlists: 'playlists',
}

function newMgetLoader(index: string) {
  return async function (intIDs: readonly any[]) {
    const ids = intIDs.map((x) => x.toString())
    if (!ids.length) return []
    const found = await esc.mget({
      index,
      body: { ids },
    })
    const byID = keyHitsByID(found.docs)
    return ids.map((id) => byID[id])
  }
}

function keyHitsByID(hits: any[]) {
  return hits.reduce((memo, hit) => {
    memo[hit._id] = hit._source
    return memo
  }, {})
}
const userLoader = new DataLoader<number | string, UserDoc>(
  newMgetLoader(indexNames.users)
)
const trackLoader = new DataLoader<number | string, TrackDoc>(
  newMgetLoader(indexNames.tracks)
)

//
// Resolvers
//

const resolvers = {
  Track: {
    id: (parent: TrackDoc) => parent.track_id,
    reposted_by: async (parent: TrackDoc, args: PaginationArgs) => {
      return usersLoadMany(parent.reposted_by, args)
    },
    favorited_by: async (parent: TrackDoc, args: PaginationArgs) => {
      return usersLoadMany(parent.saved_by, args)
    },
    is_saved: async (track: TrackDoc, _args: any, ctx: Ctx) => {
      const me = await ctx.me
      if (!me) return false
      return track.saved_by.includes(me.user_id)
    },
    is_reposted: async (track: TrackDoc, _args: any, ctx: Ctx) => {
      const me = await ctx.me
      if (!me) return false
      return track.reposted_by.includes(me.user_id)
    },
    stream_urls: async (track: TrackDoc, _args: any, ctx: Ctx) => {
      const user = await ctx.es.user.load(track.owner_id)
      return buildStreamUrls(user, track)
    },
  },
  Playlist: {
    id: (parent: PlaylistDoc) => parent.playlist_id,
    name: (parent: PlaylistDoc) => parent.playlist_name,
    tracks: fetchTracks,
    favorite_count: (parent: PlaylistDoc) => parent.save_count,
    is_saved: async (playlist: PlaylistDoc, _args: any, ctx: Ctx) => {
      const me = await ctx.me
      if (!me) return false
      return playlist.saved_by.includes(me.user_id)
    },
    is_reposted: async (playlist: PlaylistDoc, _args: any, ctx: Ctx) => {
      const me = await ctx.me
      if (!me) return false
      return playlist.reposted_by.includes(me.user_id)
    },
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
    is_follower: async (user: UserDoc, args: PaginationArgs, ctx: Ctx) => {
      const me = await ctx.me
      if (!me) return false
      return user.following_ids.includes(me.user_id)
    },
    is_followed: async (user: UserDoc, args: PaginationArgs, ctx: Ctx) => {
      const me = await ctx.me
      if (!me) return false
      return me.following_ids.includes(user.user_id)
    },
  },
  Query: {
    users: async (parent: any, args: any, ctx: Ctx) => {
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
  return trackLoader.loadMany(ids)
}

async function usersLoadMany(idList: any[], args: PaginationArgs) {
  const ids = idList
    .map((x) => x.toString())
    .slice(args.offset, args.offset + args.limit)
  return userLoader.loadMany(ids)
}

async function bbSearch(index: string, bb: Bodybuilder) {
  return esc
    .search({
      index,
      ...bb.build(),
    })
    .then((r) => r.hits.hits.map((h) => h._source))
}

//
// hashids
//

// hasher to decode / encode IDs
const hasher = new Hashids('azowernasdfoia', 5)

export function encodeId(id: number) {
  return hasher.encode(id)
}

export function decodeId(id: string) {
  return parseInt(id) || hasher.decode(id)
}

// helper functions for content node images
export function buildImageUrls(user: UserRow, cid: string, size: string) {
  // when does this happen? what to do about it?
  if (!user || !user.creator_node_endpoint || !cid) return []

  if (size.charAt(0) == '_') {
    size = size.substring(1)
  }
  const urls = user.creator_node_endpoint
    .split(',')
    .map((u) => `${u}/ipfs/${cid}/${size}.jpg`)
  return urls
}

// helper functions for content node streams
export function buildStreamUrls(user: UserRow, track: TrackRow) {
  // when does this happen?
  if (!user || !user.creator_node_endpoint) return []

  const hid = encodeId(track.track_id)
  return user.creator_node_endpoint
    .split(',')
    .map((u) => `${u}/tracks/stream/${hid}`)
}

//
// server
//

type Ctx = {
  es: {
    user: DataLoader<number | string, UserDoc>
  }
  me?: Promise<UserDoc | undefined>
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  cache: 'bounded',
  context: ({ req }) => {
    if (req.body.operationName === 'IntrospectionQuery') return

    // set up per-request data loaders
    const ctx: Ctx = {
      es: {
        user: new DataLoader(newMgetLoader(indexNames.users)),
      },
    }

    // me: current user promise
    const currentUserId = req.headers['x-user-id'] as string
    if (currentUserId) {
      ctx.me = ctx.es.user.load(currentUserId)
    }

    return ctx
  },
})

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
