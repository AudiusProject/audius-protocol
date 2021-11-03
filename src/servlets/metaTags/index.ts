import express from 'express'
import fs from 'fs'
import handlebars from 'handlebars'
import path from 'path'

import { DEFAULT_IMAGE_URL } from '../utils/constants'
import { formatDate, formatSeconds } from '../utils/format'
import {
  formatGateway,
  getCollection,
  getExploreInfo,
  getImageUrl,
  getTrackByHandleAndSlug,
  getUser,
  getUserByHandle
} from '../utils/helpers'
import { Context, MetaTagFormat, Playable } from './types'

const CAN_EMBED_USER_AGENT_REGEX = /(twitter|discord)/

const E = process.env

const getEmbedUrl = (type: Playable, id: number, ownerId: number) => {
  return `${E.PUBLIC_URL}/embed/${type}?id=${id}&ownerId=${ownerId}&flavor=card&twitter=true`
}

/** Routes */

const template = handlebars.compile(
  fs
    .readFileSync(path.resolve(__dirname, './template.html'))
    .toString()
)

const getTrackContext = async (handle: string, slug: string, canEmbed: boolean): Promise<Context> => {
  if (!handle || !slug) return getDefaultContext()
  try {
    const track = await getTrackByHandleAndSlug(handle, slug)
    const user = track.user ? track.user : await getUser(track.owner_id)
    const gateway = formatGateway(user.creator_node_endpoint, user.user_id)

    const coverArt = track.cover_art_sizes
      ? `${track.cover_art_sizes}/1000x1000.jpg`
      : track.cover_art

    const tags = track.tags ? track.tags.split(',') : []
    tags.push('audius', 'sound', 'kit', 'sample', 'pack', 'stems', 'mix')

    const date = track.release_date ? new Date(track.release_date) : track.created_at
    const duration = track.duration ? track.duration : track.track_segments.reduce(
      (acc: number, v: any) => acc = acc + v.duration,
      0
    )
    const labels = [
      { name: 'Released', value: formatDate(date) },
      { name: 'Duration', value: formatSeconds(duration) },
      { name: 'Genre', value: track.genre },
      { name: 'Mood', value: track.mood },
    ]

    return {
      format: MetaTagFormat.Track,
      title: `${track.title} • ${user.name}`,
      description: track.description || '',
      tags,
      labels,
      image: coverArt ? getImageUrl(coverArt, gateway) : track.artwork["1000x1000"],
      embed: canEmbed,
      embedUrl: getEmbedUrl(Playable.TRACK, track.track_id, track.owner_id)
    }
  } catch (e) {
    console.error(e)
    return getDefaultContext()
  }
}

const getCollectionContext = async (id: number, canEmbed: boolean): Promise<Context> => {
  if (!id) return getDefaultContext()
  try {
    const collection = await getCollection(id)
    const user = await getUser(collection.playlist_owner_id)
    const gateway = formatGateway(user.creator_node_endpoint, user.user_id)

    const coverArt = collection.playlist_image_sizes_multihash
      ? `${collection.playlist_image_sizes_multihash}/1000x1000.jpg`
      : collection.playlist_image_multihash
    return {
      format: MetaTagFormat.Collection,
      title: `${collection.playlist_name} • ${user.name}`,
      description: collection.description || '',
      image: getImageUrl(coverArt, gateway),
      embed: canEmbed,
      embedUrl: getEmbedUrl(
        collection.is_album ? Playable.ALBUM : Playable.PLAYLIST,
        collection.playlist_id,
        collection.playlist_owner_id
      )
    }
  } catch (e) {
    console.error(e)
    return getDefaultContext()
  }
}

const getUserContext = async (handle: string): Promise<Context> => {
  if (!handle) return getDefaultContext()
  try {
    const user = await getUserByHandle(handle)
    const gateway = formatGateway(user.creator_node_endpoint, user.user_id)

    const profilePicture = user.profile_picture_sizes
      ? `${user.profile_picture_sizes}/1000x1000.jpg`
      : user.profile_picture

    const infoText = user.track_count > 0
      ? `Listen to ${user.name} on Audius`
      : `Follow ${user.name} on Audius`

    return {
      format: MetaTagFormat.User,
      title: `${user.name} (@${user.handle})`,
      description: user.bio,
      additionalSEOHint: infoText,
      image: getImageUrl(profilePicture, gateway),
    }
  } catch (e) {
    console.error(e)
    return getDefaultContext()
  }
}

const getRemixesContext = async (handle: string, slug: string): Promise<Context> => {
  if (!handle || !slug) return getDefaultContext()
  try {
    const track = await getTrackByHandleAndSlug(handle, slug)
    const user = await getUser(track.owner_id)
    const gateway = formatGateway(user.creator_node_endpoint, user.user_id)

    const coverArt = track.cover_art_sizes
      ? `${track.cover_art_sizes}/1000x1000.jpg`
      : track.cover_art

    const tags = track.tags ? track.tags.split(',') : []
    tags.push('audius', 'sound', 'kit', 'sample', 'pack', 'stems', 'mix')

    const date = track.release_date ? new Date(track.release_date) : track.created_at
    const duration = track.track_segments.reduce(
      (acc: number, v: any) => acc = acc + v.duration,
      0
    )
    const labels = [
      { name: 'Released', value: formatDate(date) },
      { name: 'Duration', value: formatSeconds(duration) },
      { name: 'Genre', value: track.genre },
      { name: 'Mood', value: track.mood },
    ]

    return {
      format: MetaTagFormat.Remixes,
      title: `Remixes of ${track.title} • ${user.name}`,
      description: track.description || '',
      tags,
      labels,
      image: getImageUrl(coverArt, gateway)
    }
  } catch (e) {
    console.error(e)
    return getDefaultContext()
  }
}

const getUploadContext = (): Context => {
  return {
    format: MetaTagFormat.Upload,
    title: 'Audius Upload',
    description: `Upload your tracks to Audius`,
    image: DEFAULT_IMAGE_URL,
    thumbnail: true
  }
}

const getExploreContext = (type: string): Context => {
  return {
    format: MetaTagFormat.Explore,
    thumbnail: true,
    ...getExploreInfo(type)
  }
}

const getDefaultContext = (): Context => {
  return {
    format: MetaTagFormat.Default,
    title: 'Audius',
    description: 'Audius is a music streaming and \
sharing platform that puts power back into the hands \
of content creators',
    image: DEFAULT_IMAGE_URL,
    thumbnail: true
  }
}

const getResponse = async (
  format: MetaTagFormat,
  req: express.Request,
  res: express.Response
) => {
  const {
    title,
    handle,
    type
  } = req.params
  const userAgent = req.get('User-Agent') || ''
  const canEmbed = CAN_EMBED_USER_AGENT_REGEX.test(userAgent.toLowerCase())

  let context: Context

  const id = title ? parseInt(title.split('-').slice(-1)[0], 10) : -1
  switch (format) {
    case MetaTagFormat.Track:
      console.log('get track', req.path, handle, title, userAgent)
      context = await getTrackContext(handle, title, canEmbed)
      break
    case MetaTagFormat.Collection:
      console.log('get collection', req.path, id, userAgent)
      context = await getCollectionContext(id, canEmbed)
      break
    case MetaTagFormat.User:
      console.log('get user', req.path, handle, userAgent)
      context = await getUserContext(handle)
      break
    case MetaTagFormat.Remixes:
      console.log('get remixes', req.path, handle, title, userAgent)
      context = await getRemixesContext(handle, title)
      break
    case MetaTagFormat.Upload:
      console.log('get upload', req.path, userAgent)
      context = await getUploadContext()
      break
    case MetaTagFormat.Explore:
      console.log('get explore', req.path, userAgent)
      context = await getExploreContext(type)
      break
    case MetaTagFormat.Error:
    default:
      console.log('get default', req.path, userAgent)
      context = getDefaultContext()
  }

  context.appUrl = `audius:/${req.url}`

  const html = template(context)
  return res.send(html)
}

export default getResponse
