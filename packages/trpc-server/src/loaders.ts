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
      if (!myId) return []

      const rows = await sql<FollowRow[]>`
        select follower_user_id, followee_user_id
        from follows
        where (follower_user_id = ${myId} and followee_user_id in ${sql(ids)})
           or (follower_user_id in ${sql(ids)}) and followee_user_id = ${myId}
      `

      const outboundIds = new Set()
      const inboundIds = new Set()
      for (const row of rows) {
        row.followerUserId == myId
          ? outboundIds.add(row.followeeUserId)
          : inboundIds.add(row.followerUserId)
      }

      return ids.map((id) => ({
        followed: outboundIds.has(id),
        followsMe: inboundIds.has(id)
      }))
    }
  )
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
