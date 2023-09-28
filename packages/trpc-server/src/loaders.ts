import DataLoader from 'dataloader'
import {
  APlaylist,
  ATrack,
  AUser,
  selectPlaylistsCamel,
  selectTracksCamel,
  selectUsersCamel,
  sql
} from './db'
import { FollowRow } from './db-tables'

export const prepareLoaders = (myId: number | undefined) => ({
  // bulk load user by id
  userLoader: new DataLoader<number, AUser>(async (keys) => {
    const rows = await selectUsersCamel({ ids: keys as any })
    return mapRowsUsingKey('userId', rows, keys)
  }),

  // bulk load track by id
  trackLoader: new DataLoader<number, ATrack>(async (keys) => {
    const rows = await selectTracksCamel({ ids: keys as any })
    return mapRowsUsingKey('trackId', rows, keys)
  }),

  // bulk load playlists
  playlistLoader: new DataLoader<number, APlaylist>(async (keys) => {
    const rows = await selectPlaylistsCamel({ ids: keys as any })
    return mapRowsUsingKey('playlistId', rows, keys)
  }),

  // bulk load user relationship (follows me / I follow)
  userRelationLoader: new DataLoader<number, UserRelationResult>(
    async (ids) => {
      const outboundIds = new Set()
      const inboundIds = new Set()

      if (myId) {
        const rows = await sql<FollowRow[]>`
          select follower_user_id, followee_user_id
          from follows
          where (follower_user_id = ${myId} and followee_user_id in ${sql(ids)})
            or (follower_user_id in ${sql(ids)}) and followee_user_id = ${myId}
        `
        for (const row of rows) {
          row.followerUserId == myId
            ? outboundIds.add(row.followeeUserId)
            : inboundIds.add(row.followerUserId)
        }
      }

      return ids.map((id) => ({
        followed: outboundIds.has(id),
        followsMe: inboundIds.has(id)
      }))
    }
  ),

  actionLoader: function (kind: string) {
    return new DataLoader<number, TrackRelationResult>(async (ids) => {
      // so much save / repost + playlist / album pain
      // action_log fixes this
      const kinds = kind === 'track' ? ['track'] : ['playlist', 'album']

      const saved = new Set()
      const reposted = new Set()

      if (myId) {
        const [savedRows, repostedRows] = await Promise.all([
          sql<HasID[]>`
          select save_item_id id
          from saves
          where user_id = ${myId}
          and save_type in ${sql(kinds)} and save_item_id in ${sql(ids)};`,

          sql<HasID[]>`
          select repost_item_id id
          from reposts
          where user_id = ${myId}
          and repost_type in ${sql(kinds)} and repost_item_id in ${sql(ids)};`
        ])

        for (const row of savedRows) {
          saved.add(row.id)
        }

        for (const row of repostedRows) {
          reposted.add(row.id)
        }
      }

      return ids.map((id) => ({
        saved: saved.has(id),
        reposted: reposted.has(id)
      }))
    })
  }
})

function mapRowsUsingKey(keyName: string, rows: any[], keys: readonly any[]) {
  const byId: any = {}
  for (let r of rows) {
    byId[r[keyName]] = r
  }
  return keys.map((k) => byId[k])
}

export type UserRelationResult = {
  followed: boolean
  followsMe: boolean
}

export type TrackRelationResult = {
  saved: boolean
  reposted: boolean
}

type HasID = {
  id: number
}
