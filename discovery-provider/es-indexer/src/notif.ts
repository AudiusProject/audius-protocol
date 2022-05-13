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

type NotificationEvent = {
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

export async function materializeNotifications(pending: PendingUpdates) {
  const nestedEvents = await Promise.all([
    Promise.all(pending.follows.map(followToEvent)),
    Promise.all(pending.reposts.map(repostToEvent)),
    Promise.all(pending.saves.map(saveToEvent)),
  ])

  const events = chain(nestedEvents).flatten().compact().map(setEventId).value()

  // mostly copy pasted from BaseIndexer.ts
  if (events.length) {
    const body = events.flatMap((event) => [
      { index: { _id: event.id, _index: indexNames.notifications } },
      event,
    ])
    const got = await dialEs().bulk({ body })
    if (got.errors) {
      logger.error(got.items[0], `notifications indexing error`)
    }
  }
}

const actorLoader = new DataLoader<number, UserRow>(actorLoaderFn)
const trackLoader = new DataLoader<number, TrackRow>(trackLoaderFn)
const playlistLoader = new DataLoader<number, PlaylistRow>(playlistLoaderFn)

function setEventId(event: NotificationEvent) {
  event.id = [
    event.user_id,
    event.actor_id,
    event.action,
    event.object_type,
    event.object_id,
  ].join('_')
  return event
}

async function followToEvent(follow: FollowRow): Promise<NotificationEvent> {
  if (follow.is_delete) return null
  const actor = await actorLoader.load(follow.follower_user_id)
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

async function repostToEvent(repost: RepostRow): Promise<NotificationEvent> {
  if (repost.is_delete) return null
  const params: GenericActionParams = {
    action: 'repost',
    blocknumber: repost.blocknumber,
    created_at: repost.created_at as any,
    actor_id: repost.user_id,
    object_id: repost.repost_item_id,
  }

  if (repost.repost_type == 'track') {
    return trackEvent(params)
  } else {
    return playlistEvent(params)
  }
}

async function saveToEvent(save: SaveRow): Promise<NotificationEvent> {
  if (save.is_delete) return null
  const params: GenericActionParams = {
    action: 'save',
    blocknumber: save.blocknumber,
    created_at: save.created_at as any,
    actor_id: save.user_id,
    object_id: save.save_item_id,
  }

  if (save.save_type == 'track') {
    return trackEvent(params)
  } else {
    return playlistEvent(params)
  }
}

type GenericActionParams = {
  action: 'repost' | 'save'
  blocknumber: number
  created_at: string
  actor_id: number
  object_id: number
}

async function trackEvent({
  action,
  blocknumber,
  created_at,
  actor_id,
  object_id,
}: GenericActionParams): Promise<NotificationEvent> {
  const [actor, track] = await Promise.all([
    actorLoader.load(actor_id),
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

async function playlistEvent({
  action,
  blocknumber,
  created_at,
  actor_id,
  object_id,
}: GenericActionParams): Promise<NotificationEvent> {
  const [actor, playlist] = await Promise.all([
    actorLoader.load(actor_id),
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

async function actorLoaderFn(keys: number[]) {
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
