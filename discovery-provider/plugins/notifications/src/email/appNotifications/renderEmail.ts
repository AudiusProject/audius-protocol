import moment from 'moment-timezone'

import { logger } from '../../logger'

// @ts-ignore
import { renderNotificationsEmail } from './components/index.tsx'
import { EmailFrequency } from '../../appNotifications/mappers/base'
import { NotificationRow } from '../../types/dn'
import { Knex } from 'knex'
import { EntityType } from './types'
import { RepostNotification, SaveNotification } from '../../types/appNotifications'

type RenderEmailProps = {
  userId: number
  email: string
  notifications: NotificationRow[]
  frequency: EmailFrequency
  dnDb: Knex
}

type ResourceIds = {
  users: Set<number>
  tracks: Set<number>
  playlists: Set<number>
}
type UserResource = {
  user_id: number
  name: string
  profile_picture_sizes: string
  profile_picture: string
  creator_node_endpoint: string
}
type TrackResource = {
  track_id: number
  title: string
  cover_art: string
  cover_art_sizes: string
  creator_node_endpoint: string
}
type PlaylistResource = {
  playlist_id: number
  playlist_name: string
  playlist_image_multihash: string
  playlist_image_sizes_multihash: string
  creator_node_endpoint: string
}

type Resources = {
  users: { [userId: number]: UserResource & { imageUrl: string } }
  tracks: { [userId: number]: TrackResource & { imageUrl: string } }
  playlists: { [userId: number]: PlaylistResource & { imageUrl: string } }
}

// TODO: Fill out defaults
const DEFAULT_PROFILE_IMG = ''
const DEFAULT_TRACK_COVER_ART_URL = ''
const DEFAULT_PLAYLIST_IMAGE_IRL = ''


const getUserProfileUrl = (user: UserResource) => {
  const contentNodes = user.creator_node_endpoint.split(',')
  const primaryEndpoint = contentNodes[0]
  let profilePictureUrl = DEFAULT_PROFILE_IMG
  if (user.profile_picture_sizes) {
    profilePictureUrl = `${primaryEndpoint}/ipfs/${user.profile_picture_sizes}/1000x1000.jpg`
  } else if (user.profile_picture) {
    profilePictureUrl = `${primaryEndpoint}/ipfs/${user.profile_picture}`
  }
  return profilePictureUrl
}

const getTrackCoverArt = (track: TrackResource) => {
  const contentNodes = track.creator_node_endpoint.split(',')
  const primaryEndpoint = contentNodes[0]
  let coverArtUrl = DEFAULT_TRACK_COVER_ART_URL
  if (track.cover_art_sizes) {
    coverArtUrl = `${primaryEndpoint}/ipfs/${track.cover_art_sizes}/1000x1000.jpg`
  } else if (track.cover_art) {
    coverArtUrl = `${primaryEndpoint}/ipfs/${track.cover_art}`
  }
  return coverArtUrl
}

const getPlaylistImage = (playlist: PlaylistResource) => {
  const contentNodes = playlist.creator_node_endpoint.split(',')
  const primaryEndpoint = contentNodes[0]
  let playlistImageUrl = DEFAULT_PLAYLIST_IMAGE_IRL
  if (playlist.playlist_image_sizes_multihash) {
    playlistImageUrl = `${primaryEndpoint}/ipfs/${playlist.playlist_image_sizes_multihash}/1000x1000.jpg`
  } else if (playlist.playlist_image_multihash) {
    playlistImageUrl = `${primaryEndpoint}/ipfs/${playlist.playlist_image_multihash}`
  }
  return playlistImageUrl
}

const fetchResources = async (dnDb: Knex, ids: ResourceIds): Promise<Resources> => {
  const userRows: UserResource[] = await dnDb.select(
    'users.user_id',
    'users.name',
    'users.profile_picture_sizes',
    'users.profile_picture',
    'users.creator_node_endpoint',
  ).from('users').whereIn('user_id', Array.from(ids.users)).andWhere('is_current', true)
  const users: { [userId: number]: UserResource & { imageUrl: string } } = userRows.reduce((acc, user) => {
    acc[user.user_id] = {
      ...user,
      imageUrl: getUserProfileUrl(user)
    }
    return acc
  }, {})

  const trackRows: TrackResource[] = await dnDb.select(
    'tracks.track_id',
    'tracks.title',
    'tracks.cover_art_sizes',
    'users.creator_node_endpoint',
    'users.name'
  ).from('tracks')
    .join('users', 'users.user_id', 'tracks.owner_id')
    .whereIn('tracks.track_id', Array.from(ids.tracks))
    .andWhere('tracks.is_current', true)
    .andWhere('users.is_current', true)
  const tracks: { [trackId: number]: TrackResource & { imageUrl: string } } = trackRows.reduce((acc, track) => {
    acc[track.track_id] = {
      ...track,
      imageUrl: getTrackCoverArt(track)
    }
    return acc
  }, {})

  const playlistRows: PlaylistResource[] = await dnDb.select(
    'playlists.playlist_id',
    'playlists.playlist_name',
    'playlists.playlist_image_sizes_multihash',
    'playlists.playlist_image_multihash',
    'users.creator_node_endpoint',
    'users.name'
  ).from('playlists')
    .join('users', 'users.user_id', 'playlists.playlist_owner_id')
    .whereIn('playlists.playlist_id', Array.from(ids.playlists))
    .andWhere('playlists.is_current', true)
    .andWhere('users.is_current', true)

  const playlists: { [playlistId: number]: PlaylistResource & { imageUrl: string } } = playlistRows.reduce((acc, playlist) => {
    acc[playlist.playlist_id] = {
      ...playlist,
      imageUrl: getPlaylistImage(playlist)
    }
    return acc
  }, {})


  return { users, tracks, playlists }
}

const getNotificationProps = async (dnDB: Knex, notifications: NotificationRow[]) => {
  const idsToFetch: ResourceIds = {
    users: new Set(),
    tracks: new Set(),
    playlists: new Set(),
  }
  console.log({ notifications })

  for (let notification of notifications) {
    if (notification.type == 'follow') {
      idsToFetch.users.add(notification.data.follower_user_id)
      idsToFetch.users.add(notification.data.followee_user_id)
    }
    else if (notification.type == 'repost') {
      const data: RepostNotification = notification.data
      idsToFetch.users.add(data.user_id)
      if (data.type == 'track') {
        idsToFetch.tracks.add(data.repost_item_id)
      } else {
        idsToFetch.playlists.add(data.repost_item_id)
      }
    }
    else if (notification.type == 'save') {
      const data: SaveNotification = notification.data
      idsToFetch.users.add(data.user_id)
      if (data.type == 'track') {
        idsToFetch.tracks.add(data.save_item_id)
      } else {
        idsToFetch.playlists.add(data.save_item_id)
      }
    }
  }
  const resources = await fetchResources(dnDB, idsToFetch)
  console.log(JSON.stringify(resources, null, ' '))
  return notifications.map(notification => getEmailNotificationProp(notification, resources))
}

const getEmailNotificationProp = (notification, resources: Resources) => {
  if (notification.type == 'follow') {
    const followerId = notification.data.follower_user_id
    const user = resources.users[followerId]
    return {
      type: 'follow',
      users: [{ name: user.name, image: user.imageUrl }]
    }
  }
  else if (notification.type == 'save') {
    const data: SaveNotification = notification.data
    const reposter = resources.users[data.user_id]
    const users = [{ name: reposter.name, image: reposter.imageUrl }]
    console.log(JSON.stringify(notification, null, ' '))
    let entity
    if (data.type === EntityType.Track) {
      const track = resources.tracks[data.save_item_id]
      entity = { type: EntityType.Track, name: track.title, image: track.imageUrl }
    } else {
      const playlist = resources.playlists[data.save_item_id]
      entity = { type: EntityType.Playlist, name: playlist.playlist_name, image: playlist.imageUrl }
    }
    return { type: notification.type, users, entity }
  }
  else if (notification.type == 'repost') {
    const data: RepostNotification = notification.data
    const reposter = resources.users[data.user_id]
    const users = [{ name: reposter.name, image: reposter.imageUrl }]
    console.log(JSON.stringify(notification, null, ' '))
    let entity
    if (data.type === EntityType.Track) {
      const track = resources.tracks[data.repost_item_id]
      entity = { type: EntityType.Track, name: track.title, image: track.imageUrl }
    } else {
      const playlist = resources.playlists[data.repost_item_id]
      entity = { type: EntityType.Playlist, name: playlist.playlist_name, image: playlist.imageUrl }
    }
    return { type: 'repost', users, entity }
  }

}

const getEmailTitle = (frequency: EmailFrequency, userEmail: string) => {
  if (frequency === 'live') {
    return `Email - ${userEmail}`
  } else if (frequency === 'daily') {
    return `Daily Email - ${userEmail}`
  } else if (frequency === 'weekly') {
    return `Weekly Email - ${userEmail}`
  }
}

const getEmailSubject = (frequency: EmailFrequency, notificationCount: number) => {
  const now = moment()
  const dayAgo = now.clone().subtract(1, 'days')
  const weekAgo = now.clone().subtract(7, 'days')
  const formattedDayAgo = dayAgo.format('MMMM Do YYYY')
  const shortWeekAgoFormat = weekAgo.format('MMMM Do')
  const liveSubjectFormat = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''
    }`
  const weeklySubjectFormat = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''
    } from ${shortWeekAgoFormat} - ${formattedDayAgo}`
  const dailySubjectFormat = `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''
    } from ${formattedDayAgo}`

  let subject
  if (frequency === 'live') {
    subject = liveSubjectFormat
  } if (frequency === 'daily') {
    subject = dailySubjectFormat
  } else {
    subject = weeklySubjectFormat
  }
  return subject
}

// Master function to render and send email for a given userId
export const renderEmail = async ({
  userId,
  email,
  frequency,
  notifications,
  dnDb,
}: RenderEmailProps) => {
  logger.debug(
    `renderAndSendNotificationEmail | ${userId}, ${email}, ${frequency}`
  )

  const notificationCount = notifications.length
  const notificationProps = await getNotificationProps(dnDb, notifications.slice(0, 5))
  console.log({ notificationProps })
  const renderProps = {
    copyrightYear: new Date().getFullYear().toString(),
    notifications: notificationProps,
    title: getEmailTitle(frequency, email),
    subject: getEmailSubject(frequency, notificationCount)
  }
  const notifHtml = renderNotificationsEmail(renderProps)
  return notifHtml

}
