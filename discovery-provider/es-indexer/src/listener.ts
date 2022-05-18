import {
  FollowRow,
  PlaylistRow,
  RepostRow,
  SaveRow,
  TrackRow,
  UserRow,
} from './types/db'
import { Client } from 'pg'
import { logger } from './logger'
import { LISTEN_TABLES } from './setup'
import {
  AggregatePlayBroadcast,
  AggregateTrackBroadcast,
  AggregateUserBroadcast,
  TrackMilestone,
  UserMilestone,
} from './types/milestone_types'

export class PendingUpdates {
  userIds: Set<number> = new Set()
  trackIds: Set<number> = new Set()
  playlistIds: Set<number> = new Set()

  reposts: Array<RepostRow> = []
  saves: Array<SaveRow> = []
  follows: Array<FollowRow> = []

  trackMilestones: Array<TrackMilestone> = []
  userMilestones: Array<UserMilestone> = []

  isEmpty(): boolean {
    return (
      this.reposts.length +
        this.saves.length +
        this.follows.length +
        this.userIds.size +
        this.trackIds.size +
        this.playlistIds.size +
        this.trackMilestones.length +
        this.userMilestones.length ==
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

const milestoneList = [
  10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000,
]

function findMilestone(
  before: number | string | null | undefined,
  after: number | string | null | undefined
): number | undefined {
  if (!before || !after) return
  if (typeof before == 'string') before = parseInt(before)
  if (typeof after == 'string') after = parseInt(after)
  for (let threshold of milestoneList) {
    if (before < threshold && after >= threshold) {
      return threshold
    }
  }
}

const handlers = {
  aggregate_plays: (row: AggregatePlayBroadcast) => {
    if (!row.play_item_id) return // when could this happen?
    pending.trackIds.add(row.play_item_id)

    // play milestone?
    const playMilestone = findMilestone(row.old?.count, row.new.count)
    if (playMilestone) {
      pending.trackMilestones.push({
        name: 'plays',
        value: playMilestone,
        track_id: row.play_item_id,
      })
    }
  },

  aggregate_track: (row: AggregateTrackBroadcast) => {
    // repost milestone?
    const repostMilestone = findMilestone(
      row.old?.repost_count,
      row.new.repost_count
    )
    if (repostMilestone) {
      pending.trackMilestones.push({
        name: 'reposts',
        value: repostMilestone,
        track_id: row.track_id,
      })
    }
    // save milestone?
    const saveMilestone = findMilestone(row.old?.save_count, row.new.save_count)
    if (saveMilestone) {
      pending.trackMilestones.push({
        name: 'saves',
        value: saveMilestone,
        track_id: row.track_id,
      })
    }
  },

  aggregate_user: (row: AggregateUserBroadcast) => {
    pending.userIds.add(row.user_id)
    // follower milestone?
    const followerMilestone = findMilestone(
      row.old?.follower_count,
      row.new.follower_count
    )
    if (followerMilestone) {
      pending.userMilestones.push({
        name: 'followers',
        value: followerMilestone,
        user_id: row.user_id,
      })
    }
  },

  // TODO: can we do trigger on agg playlist matview?

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
      pending.playlistIds.add(repost.repost_item_id)
    }
  },
  follows: (follow: FollowRow) => {
    pending.follows.push(follow)
    // followee follower_count comes from aggregate_user
    // which is update async...
    // marking followee_user_id stale here is likely to result in a noop
    // as aggregate_user hasn't been updated yet...
    // so instead we listen for update on that table to ensure follower_count gets updated.
    // pending.userIds.add(follow.followee_user_id)
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
  const connectionString = process.env.audius_db_url
  const client = new Client({ connectionString, application_name: 'es-listen' })
  await client.connect()
  const tables = LISTEN_TABLES
  const sql = tables.map((t) => `LISTEN ${t}; `).join(' ')

  client.on('notification', (msg) => {
    const body = JSON.parse(msg.payload!)
    const handler = handlers[msg.channel]
    if (handler) {
      handler(body)
    } else {
      logger.warn(`no handler for ${msg.channel}`)
    }
  })

  await client.query(sql)
  logger.info({ tables }, 'LISTEN')
}
