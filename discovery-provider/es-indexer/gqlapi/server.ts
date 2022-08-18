import { Client } from '@elastic/elasticsearch'
import { ApolloServer, gql } from 'apollo-server'
import bodybuilder, { Bodybuilder } from 'bodybuilder'
import DataLoader from 'dataloader'
import Hashids from 'hashids'
import {
  Playlist,
  PlaylistResolvers,
  Track,
  TrackResolvers,
  User,
  UserResolvers,
  QueryResolvers,
  FeedItem,
} from './generated/graphql'
import { UserRow, TrackRow } from '../src/types/db'
import { PlaylistDoc, RepostDoc, TrackDoc, UserDoc } from '../src/types/docs'
import { typeDefs } from './schema'
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types'

//
// DataLoaders
//

let esUrl = process.env.audius_elasticsearch_url || 'http://localhost:9200'
const esc = new Client({ node: esUrl })

const indexNames = {
  users: 'users',
  tracks: 'tracks',
  playlists: 'playlists',
  reposts: 'reposts',
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
// Track Resolver
//

const trackResolvers: TrackResolvers<Ctx, Track & TrackDoc> = {
  async id(track) {
    return track.track_id.toString()
  },

  async reposted_by(track, args) {
    return usersLoadMany(track.reposted_by, args) as any
  },

  async favorited_by(track, args) {
    return usersLoadMany(track.saved_by, args) as any
  },

  async is_saved(track, _args, ctx) {
    const me = await ctx.me
    if (!me) return false
    return track.saved_by.includes(me.user_id)
  },

  async is_reposted(track, _args, ctx) {
    const me = await ctx.me
    if (!me) return false
    return track.reposted_by.includes(me.user_id)
  },

  async stream_urls(track, _args, ctx) {
    const user = await ctx.es.user.load(track.owner_id)
    return buildStreamUrls(user, track)
  },
}

//
// Playlist Resolver
//

const playlistResolvers: PlaylistResolvers<Ctx, Playlist & PlaylistDoc> = {
  id: (playlist) => playlist.playlist_id.toString(),

  name: (playlist) => playlist.playlist_name || '',

  tracks: (playlist, args) => {
    return fetchTracks(playlist, args) as any
  },

  favorite_count: (playlist) => playlist.save_count,

  is_saved: async (playlist, args, ctx) => {
    const me = await ctx.me
    if (!me) return false
    return playlist.saved_by.includes(me.user_id)
  },

  is_reposted: async (playlist, args, ctx) => {
    const me = await ctx.me
    if (!me) return false
    return playlist.reposted_by.includes(me.user_id)
  },

  reposted_by: async (playlist, args) => {
    return usersLoadMany(playlist.reposted_by, args) as any
  },

  favorited_by: async (playlist, args) => {
    return usersLoadMany(playlist.saved_by, args) as any
  },
}

//
// User Resolver
//
const userResolvers: UserResolvers<Ctx, User & UserDoc> = {
  id: (user) => user.user_id.toString(),

  tracks: async (user, args, ctx) => {
    const bb = bodybuilder()
      .filter('term', 'owner_id', user.user_id.toString())
      .filter('term', 'is_delete', false)
      .filter('term', 'is_unlisted', false)
      .size(args.limit)
      .from(args.offset)
      .sort(args.sort || 'created_at', args.sort_direction || 'desc')
    if (args.query) {
      bb.query('match', 'suggest', args.query)
    }
    const tracks = await bbSearch(indexNames.tracks, bb)
    return tracks as any
  },

  playlists: async (user, args) => {
    // sort enum rewrite
    const sortRewrite: Record<string, string> = {
      name: 'playlist_name',
    }
    let sortBy = args.sort as string | undefined
    if (sortBy) {
      sortBy = sortRewrite[sortBy]
    }
    const bb = bodybuilder()
      .filter('term', 'playlist_owner_id', user.user_id)
      .filter('term', 'is_delete', false)
      .filter('term', 'is_private', false)
      .size(args.limit)
      .from(args.offset)
      .sort(sortBy || 'created_at', args.sort_direction || 'desc')
    if (args.query) {
      bb.query('match', 'suggest', args.query)
    }
    return bbSearch(indexNames.playlists, bb)
  },

  followers: async (user, args) => {
    const bb = bodybuilder()
      .filter('term', 'following_ids', user.user_id)
      .size(args.limit)
      .from(args.offset)
      .sort(args.sort || 'created_at', args.sort_direction || 'desc')
    if (args.query) {
      bb.query('match', 'suggest', args.query)
    }
    return bbSearch(indexNames.users, bb)
  },

  following: async (user, args) => {
    const bb = bodybuilder()
      .filter('terms', '_id', {
        index: indexNames.users,
        id: user.user_id.toString(),
        path: 'following_ids',
      })
      .size(args.limit)
      .from(args.offset)
      .sort(args.sort || 'created_at', args.sort_direction || 'desc')
    if (args.query) {
      bb.query('match', 'suggest', args.query)
    }
    return bbSearch(indexNames.users, bb)
  },

  is_follower: async (user, args, ctx) => {
    const me = await ctx.me
    if (!me) return false
    return user.following_ids.includes(me.user_id)
  },

  is_followed: async (user, args, ctx) => {
    const me = await ctx.me
    if (!me) return false
    return me.following_ids.includes(user.user_id)
  },
}

//
// Root Query Resolver
//

const queryResolvers: QueryResolvers<Ctx> = {
  users: async (root, args, ctx) => {
    const bb = bodybuilder()
    if (args.handle) {
      bb.filter('term', 'handle', args.handle)
    }
    return bbSearch(indexNames.users, bb)
  },

  feed: async (root, args, ctx) => {
    const me = await ctx.me
    if (!me) throw new Error(`feed requires current user`)

    const loadReposts = args.reposts
    const loadOrig = args.original
    const mdsl = []

    if (loadReposts) {
      mdsl.push({ index: indexNames.reposts })
      mdsl.push(
        bodybuilder()
          .filter('range', 'created_at', { gte: 'now-90d' })
          .filter('term', 'is_delete', false)
          .filter('terms', 'user_id', {
            index: indexNames.users,
            id: me.user_id.toString(),
            path: 'following_ids',
          })
          .size(0)
          .agg('terms', 'item_key', { size: 100 }, 'by_id', (a) => {
            return a.agg('min', 'created_at', 'by_date')
          })
          .build()
      )
    }

    if (loadOrig) {
      mdsl.push({ index: indexNames.tracks })
      mdsl.push(
        bodybuilder()
          .filter('terms', 'owner_id', {
            index: indexNames.users,
            id: me.user_id.toString(),
            path: 'following_ids',
          })
          .filter('term', 'is_unlisted', false)
          .filter('term', 'is_delete', false)
          .sort('created_at', 'desc')
          .size(args.limit)
          .build()
      )

      mdsl.push({ index: indexNames.playlists })
      mdsl.push(
        bodybuilder()
          .filter('terms', 'playlist_owner_id', {
            index: indexNames.users,
            id: me.user_id.toString(),
            path: 'following_ids',
          })
          .filter('term', 'is_private', false)
          .filter('term', 'is_delete', false)
          .sort('created_at', 'desc')
          .size(args.limit)
          .build()
      )
    }

    // user wants nothing I guess
    if (!mdsl.length) return []

    const mfound = await esc.msearch({
      searches: mdsl,
    })

    const sortedFeed: FeedItem[] = []
    const seenItemKeys = new Set<string>()

    if (loadReposts) {
      const found = mfound.responses.shift() as SearchResponse

      type FirstRepost = {
        key: string
        ts: string
      }

      const repostBuckets: FirstRepost[] =
        // @ts-ignore
        found.aggregations!.by_id.buckets.map((b: any) => {
          return {
            key: b.key,
            ts: b.by_date.value_as_string,
          }
        })

      repostBuckets.sort((a, b) => (a.ts > b.ts ? -1 : 1))

      const ops = repostBuckets.slice(0, args.limit).map((r) => {
        const [kind, _id] = r.key.split(':')
        const _index =
          kind == 'track' ? indexNames.tracks : indexNames.playlists
        return { _index, _id }
      })
      const docs = await esc.mget({ docs: ops })

      docs.docs.forEach((d: any, idx) => {
        const item = d._source as FeedItem
        const bucket = repostBuckets[idx]
        item.activity_timestamp = bucket.ts
        seenItemKeys.add(bucket.key)
        sortedFeed.push(item)
      })
    }

    if (loadOrig) {
      const playlistResp = mfound.responses.shift() as SearchResponse

      playlistResp.hits.hits.forEach((h) => {
        const playlist = h._source as PlaylistDoc & FeedItem
        const key = playlist.is_album ? `album:${h._id}` : `playlist:${h._id}`
        if (seenItemKeys.has(key)) return
        seenItemKeys.add(key)
        playlist.activity_timestamp = playlist.created_at
        sortedFeed.push(playlist)
      })

      const trackResp = mfound.responses.shift() as SearchResponse

      trackResp.hits.hits.forEach((h) => {
        const track = h._source as TrackDoc & FeedItem
        const key = `track:${h._id}`
        if (seenItemKeys.has(key)) return
        seenItemKeys.add(key)
        track.activity_timestamp = track.created_at
        sortedFeed.push(track)
      })
    }

    sortedFeed.sort((a, b) =>
      b.activity_timestamp! < a.activity_timestamp! ? -1 : 1
    )

    return sortedFeed.slice(0, args.limit)
  },
}

const resolvers = {
  Track: trackResolvers,
  Playlist: playlistResolvers,
  User: userResolvers,
  Query: queryResolvers,

  FeedItem: {
    __resolveType(item: any) {
      if (item.track_id) {
        return 'Track'
      }
      if (item.playlist_id) {
        return 'Playlist'
      }
      return null // GraphQLError is thrown
    },
  },
}

async function fetchTracks(parent: UserDoc | PlaylistDoc, args: any) {
  const ids = parent.tracks
    .map((t) => t.track_id.toString())
    .slice(args.offset, args.offset + args.limit)
  return trackLoader.loadMany(ids)
}

type PaginationArgs = {
  limit: number
  offset: number
}

async function usersLoadMany(idList: any[], args: PaginationArgs) {
  const ids = idList
    .map((x) => x.toString())
    .slice(args.offset, args.offset + args.limit)
  return userLoader.loadMany(ids)
}

async function bbSearch<T>(index: string, bb: Bodybuilder) {
  return esc
    .search({
      index,
      ...bb.build(),
    })
    .then((r) => r.hits.hits.map((h) => h._source as T))
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
    track: DataLoader<number | string, TrackDoc>
    playlist: DataLoader<number | string, PlaylistDoc>
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
        track: new DataLoader(newMgetLoader(indexNames.tracks)),
        playlist: new DataLoader(newMgetLoader(indexNames.playlists)),
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
