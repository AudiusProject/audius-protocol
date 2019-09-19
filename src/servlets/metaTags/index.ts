import express from 'express'
import fs from 'fs'
import handlebars from 'handlebars'
import path from 'path'

import libs from '../../libs'
import { MetaTagFormat } from './types'

const FALLBACK_IPFS_GATEWAY = 'https://cloudflare-ipfs.com/ipfs/'
const DEFAULT_IMAGE_URL = 'https://download.audius.co/static-resources/preview-image.jpg'

interface Context {
  title: string,
  description: string,
  image: string,
  // Whether or not the image shows as a small thumbnail version
  thumbnail?: boolean,
}

/** Helpers */

const getTrack = async (id: number): Promise<any> => {
  const t = await libs.Track.getTracks(1, 0, [id])
  if (t && t[0]) return t[0]
  throw new Error(`Failed to get track ${id}`)
}

const getCollection = async (id: number): Promise<any> => {
  const c = await libs.Playlist.getPlaylists(1, 0, [id])
  if (c && c[0]) return c[0]
  throw new Error(`Failed to get collection ${id}`)
}

const getUser = async (id: number): Promise<any> => {
  const u = await libs.User.getUsers(1, 0, [id])
  if (u && u[0]) return u[0]
  throw new Error(`Failed to get user ${id}`)
}

const getUserByHandle = async (handle: string): Promise<any> => {
  const u = await libs.User.getUsers(1, 0, null, null, handle)
  if (u && u[0]) return u[0]
  throw new Error(`Failed to get user ${handle}`)
}

const formatGateway = (creatorNodeEndpoint: string): string =>
  creatorNodeEndpoint ? `${creatorNodeEndpoint.split(',')[0]}/ipfs/` : ''

const getImageUrl = (cid: string, gateway: string | null): string => {
  if (!cid) return DEFAULT_IMAGE_URL
  return gateway ? `${gateway}${cid}` : `${FALLBACK_IPFS_GATEWAY}${cid}`
}

/** Routes */

const template = handlebars.compile(
  fs
    .readFileSync(path.resolve(__dirname, './template.html'))
    .toString()
)

const getTrackContext = async (id: number): Promise<Context> => {
  try {
    const track = await getTrack(id)
    const user = await getUser(track.owner_id)
    const gateway = formatGateway(user.creator_node_endpoint)

    const coverArt = track.cover_art_sizes
      ? `${track.cover_art_sizes}/1000x1000.jpg`
      : track.cover_art
    return {
      title: `${track.title} • ${user.name}`,
      description: track.description || '',
      image: getImageUrl(coverArt, gateway),
    }
  } catch (e) {
    return getDefaultContext()
  }
}

const getCollectionContext = async (id: number): Promise<Context> => {
  try {
    const collection = await getCollection(id)
    const user = await getUser(collection.playlist_owner_id)
    const gateway = formatGateway(user.creator_node_endpoint)

    const coverArt = collection.playlist_image_multihash_sizes
      ? `${collection.playlist_image_multihash_sizes}/1000x1000.jpg`
      : collection.playlist_image_multihash
    return {
      title: `${collection.playlist_name} • ${user.name}`,
      description: collection.description || '',
      image: getImageUrl(coverArt, gateway),
    }
  } catch (e) {
    return getDefaultContext()
  }
}

const getUserContext = async (handle: string): Promise<Context> => {
  try {
    const user = await getUserByHandle(handle)
    const gateway = formatGateway(user.creator_node_endpoint)

    const profilePicture = user.profile_picture_sizes
      ? `${user.profile_picture_sizes}/1000x1000.jpg`
      : user.profile_picture
    return {
      title: `${user.name} (@${user.handle})`,
      description: user.bio,
      image: getImageUrl(profilePicture, gateway),
    }
  } catch (e) {
    return getDefaultContext()
  }
}

const getUploadContext = (): Context => {
  return {
    title: 'Audius Upload',
    description: `Upload your tracks to Audius`,
    image: DEFAULT_IMAGE_URL,
    thumbnail: true
  }
}

const getDefaultContext = (): Context => {
  return {
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
    handle
  } = req.params

  let context: Context
  const id = title ? parseInt(title.split('-').slice(-1)[0], 10) : -1
  switch (format) {
    case MetaTagFormat.Track:
      context = await getTrackContext(id)
      break
    case MetaTagFormat.Collection:
      context = await getCollectionContext(id)
      break
    case MetaTagFormat.User:
      context = await getUserContext(handle)
      break
    case MetaTagFormat.Upload:
      context = await getUploadContext()
      break
    default:
      context = getDefaultContext()
  }
  const html = template(context)
  return res.send(html)
}

export default getResponse
