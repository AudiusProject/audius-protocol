import {
  FollowRow,
  PlaylistRow,
  RepostRow,
  SaveRow,
  TrackRow,
  UserRow,
} from '../types/db'
import { Client } from 'pg'

export class PendingUpdates {
  userIds: Set<number> = new Set()
  trackIds: Set<number> = new Set()
  playlistIds: Set<number> = new Set()

  reposts: Array<RepostRow> = []
  saves: Array<SaveRow> = []
  follows: Array<FollowRow> = []

  isEmpty(): boolean {
    return (
      this.reposts.length +
        this.saves.length +
        this.follows.length +
        this.userIds.size +
        this.trackIds.size +
        this.playlistIds.size ==
      0
    )
  }
}

let pending = new PendingUpdates()

export function takePending() {
  if (pending.isEmpty()) return
  const p = pending
  pending = new PendingUpdates()
  return p
}

const handlers = {
  saves: (save: SaveRow) => {
    pending.saves.push(save)
    if (save.save_type == 'track') {
      pending.trackIds.add(save.save_item_id)
    } else {
      pending.playlistIds.add(save.save_item_id)
    }
  },
  reposts: (repost: RepostRow) => {
    pending.reposts.push(repost)
    if (repost.repost_type == 'track') {
      pending.trackIds.add(repost.repost_item_id)
    } else {
      pending.trackIds.add(repost.repost_item_id)
    }
  },
  follows: (follow: FollowRow) => {
    pending.follows.push(follow)
    pending.userIds.add(follow.followee_user_id)
    pending.userIds.add(follow.follower_user_id)
  },
  users: (user: UserRow) => {
    pending.userIds.add(user.user_id)
  },
  tracks: (track: TrackRow) => {
    pending.trackIds.add(track.track_id)
  },
  playlists: (playlist: PlaylistRow) => {
    pending.playlistIds.add(playlist.playlist_id)
  },
}

export async function startListener() {
  let connectionString = process.env.audius_db_url
  const client = new Client({ connectionString, application_name: 'es-listen' })
  await client.connect()

  const tables = ['follows', 'reposts', 'saves', 'tracks', 'users', 'playlists']
  const sql = tables.map((t) => `LISTEN ${t}; `).join(' ')
  await client.query(sql)
  console.log(sql)

  client.on('notification', (msg) => {
    const body = JSON.parse(msg.payload)
    const handler = handlers[msg.channel]
    if (handler) {
      handler(body)
    } else {
      console.log(
        new Date().toLocaleTimeString(),
        'no handler for',
        msg.channel,
        body
      )
    }
  })

  client.on('notice', (msg) => console.warn('notice:', msg))
  client.on('error', (err) => console.error('error:', err.stack))
  client.on('end', () => console.warn('pg end'))

  // process.on('SIGINT', async function () {
  //   console.log('Caught interrupt signal')
  //   const sql = tables.map((t) => `UNLISTEN ${t}; `).join(' ')
  //   await client.query(sql)
  //   await client.end()
  //   console.log('bye')
  // })
}
