import { dialEs, dialPg } from './conn'
import { PendingUpdates } from './listener'
import DataLoader from 'dataloader'
import { chain, flatten, keyBy } from 'lodash'
import {
  FollowRow,
  PlaylistRow,
  RepostRow,
  SaveRow,
  TrackRow,
  UserRow,
} from './types/db'
import { indexNames } from './indexNames'
import { logger } from './logger'
import { TrackMilestone, UserMilestone } from './types/milestone_types'

type MilestoneNotification = {
  id: string
  user_id: number
  created_at: string
  milestone: 'plays' | 'reposts' | 'saves'
  object_type: 'track' | 'playlist' | 'user'
  object_id: number
  object: TrackRow
  value: number
}

type SocialNotification = {
  id: string
  blocknumber: number
  created_at: string
  user_id: number
  actor_id: number
  actor: UserRow
  action: 'follow' | 'repost' | 'save'
  object_type: 'user' | 'track' | 'playlist'
  object_id: number
  object: null | TrackRow | PlaylistRow
}

export async function createNotificationIndex() {
  const es = dialEs()
  es.indices.create(
    {
      index: indexNames.notifications,
      settings: {
        index: {
          number_of_shards: 1,
          number_of_replicas: 0,
          refresh_interval: '5s',
        },
      },
      mappings: {
        dynamic: false,
        properties: {
          blocknumber: { type: 'integer' },
          user_id: { type: 'keyword' },
          created_at: { type: 'date' },
        },
      },
    },
    {
      ignore: [400],
    }
  )
}

type GenericNotification = MilestoneNotification | SocialNotification

export async function materializeNotifications(pending: PendingUpdates) {
  const nestedNotifications: GenericNotification[][] = await Promise.all([
    Promise.all(pending.follows.map(followNotif)),
    Promise.all(pending.reposts.map(repostNotif)),
    Promise.all(pending.saves.map(saveNotif)),
    Promise.all(pending.trackMilestones.map(trackMilestoneNotif)),
    Promise.all(pending.userMilestones.map(userMilestoneNotif)),
  ])

  // TODO: instead of .compact to drop deletes... we should delete notifications for events that have been undone.
  // what could be more brutal than getting a notification that user X followed you...
  // only to look and see that they no longer do.
  const notifications = chain(nestedNotifications)
    .flatten()
    .compact()
    .map(setNotifId)
    .value()

  // mostly copy pasted from BaseIndexer.ts
  if (notifications.length) {
    const body = notifications.flatMap((notif) => [
      { index: { _id: notif.id, _index: indexNames.notifications } },
      notif,
    ])
    const got = await dialEs().bulk({ body })
    if (got.errors) {
      logger.error(got.items[0], `notifications indexing error`)
    }

    logger.info(
      { notification_count: notifications.length },
      'processed notifications'
    )
  }
}

const userLoader = new DataLoader<number, UserRow>(userLoaderFn)
const trackLoader = new DataLoader<number, TrackRow>(trackLoaderFn)
const playlistLoader = new DataLoader<number, PlaylistRow>(playlistLoaderFn)

function setNotifId(notif: SocialNotification) {
  if (!notif.id) {
    notif.id = [
      notif.user_id,
      notif.actor_id,
      notif.action,
      notif.object_type,
      notif.object_id,
    ].join('_')
  }
  return notif
}

async function followNotif(follow: FollowRow): Promise<SocialNotification> {
  if (follow.is_delete) return null
  const actor = await userLoader.load(follow.follower_user_id)
  return {
    id: '',
    created_at: follow.created_at as any,
    blocknumber: follow.blocknumber,
    user_id: follow.followee_user_id,
    actor_id: follow.follower_user_id,
    actor: actor,
    action: 'follow',
    object_type: 'user',
    object_id: follow.followee_user_id,
    object: null,
  }
}

async function repostNotif(repost: RepostRow): Promise<SocialNotification> {
  if (repost.is_delete) return null
  const params: GenericActionParams = {
    action: 'repost',
    blocknumber: repost.blocknumber,
    created_at: repost.created_at as any,
    actor_id: repost.user_id,
    object_id: repost.repost_item_id,
  }

  if (repost.repost_type == 'track') {
    return genericTrackNotif(params)
  } else {
    return genericPlaylistNotif(params)
  }
}

async function saveNotif(save: SaveRow): Promise<SocialNotification> {
  if (save.is_delete) return null
  const params: GenericActionParams = {
    action: 'save',
    blocknumber: save.blocknumber,
    created_at: save.created_at as any,
    actor_id: save.user_id,
    object_id: save.save_item_id,
  }

  if (save.save_type == 'track') {
    return genericTrackNotif(params)
  } else {
    return genericPlaylistNotif(params)
  }
}

async function trackMilestoneNotif(
  mile: TrackMilestone
): Promise<MilestoneNotification> {
  const track = await trackLoader.load(mile.track_id)
  return {
    id: `track_${mile.track_id}_milestone_${mile.name}_${mile.value}`,
    user_id: track.owner_id,
    created_at: new Date().toISOString(),
    milestone: mile.name as any,
    object_id: mile.track_id,
    object_type: 'track',
    object: track,
    value: mile.value,
  }
}

async function userMilestoneNotif(
  mile: UserMilestone
): Promise<MilestoneNotification> {
  return {
    id: `user_${mile.user_id}_milestone_${mile.name}_${mile.value}`,
    user_id: mile.user_id,
    created_at: new Date().toISOString(),
    milestone: mile.name as any,
    object_id: mile.user_id,
    object_type: 'user',
    object: undefined,
    value: mile.value,
  }
}

type GenericActionParams = {
  action: 'repost' | 'save'
  blocknumber: number
  created_at: string
  actor_id: number
  object_id: number
}

async function genericTrackNotif({
  action,
  blocknumber,
  created_at,
  actor_id,
  object_id,
}: GenericActionParams): Promise<SocialNotification> {
  const [actor, track] = await Promise.all([
    userLoader.load(actor_id),
    trackLoader.load(object_id),
  ])
  return {
    id: '',
    created_at,
    blocknumber,
    user_id: track.owner_id,
    actor_id,
    actor,
    action,
    object_type: 'track',
    object_id: track.track_id,
    object: track,
  }
}

async function genericPlaylistNotif({
  action,
  blocknumber,
  created_at,
  actor_id,
  object_id,
}: GenericActionParams): Promise<SocialNotification> {
  const [actor, playlist] = await Promise.all([
    userLoader.load(actor_id),
    playlistLoader.load(object_id),
  ])
  return {
    id: '',
    blocknumber,
    created_at,
    user_id: playlist.playlist_owner_id,
    actor_id,
    actor,
    action,
    object_type: 'playlist',
    object_id: playlist.playlist_id,
    object: playlist,
  }
}

// --- loader functions ---
// might could use knex or something

async function userLoaderFn(keys: number[]) {
  if (!keys.length) return []
  const keyList = keys.join(',')
  const sql = `
    select 
      user_id,
      handle, 
      name 
    from users 
    where 
      is_current and
      user_id in (${keyList})`
  const rs = await dialPg().query(sql)
  const byId = keyBy(rs.rows, 'user_id')
  return keys.map((k) => byId[k])
}

async function trackLoaderFn(keys: number[]) {
  if (!keys.length) return []
  const keyList = keys.join(',')
  const sql = `
    select 
      track_id,
      owner_id,
      title
    from tracks 
    where 
      is_current and
      track_id in (${keyList})`
  const rs = await dialPg().query(sql)
  const byId = keyBy(rs.rows, 'track_id')
  return keys.map((k) => byId[k])
}

async function playlistLoaderFn(keys: number[]) {
  if (!keys.length) return []
  const keyList = keys.join(',')
  const sql = `
    select 
      playlist_id,
      playlist_owner_id,
      playlist_name
    from playlists
    where 
      is_current and
      playlist_id in (${keyList})`
  const rs = await dialPg().query(sql)
  const byId = keyBy(rs.rows, 'playlist_id')
  return keys.map((k) => byId[k])
}
