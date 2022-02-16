import { Collectible } from '@audius/fetch-nft'
import express from 'express'
import fs from 'fs'
import handlebars from 'handlebars'
import path from 'path'

import libs from '../../libs'
import { getHash } from '../bedtime/helpers'
import {
  AUDIO_REWARDS_IMAGE_URL,
  DEFAULT_IMAGE_URL,
  SIGNUP_REF_IMAGE_URL,
} from '../utils/constants'
import { nftClient } from '../utils/fetchNft'
import { formatDate, formatSeconds } from '../utils/format'
import { encodeHashId } from '../utils/hashids'
import {
  formatGateway,
  getCollection,
  getExploreInfo,
  getImageUrl,
  getTrackByHandleAndSlug,
  getUser,
  getUserByHandle,
} from '../utils/helpers'
import { Context, MetaTagFormat, Playable } from './types'

const CAN_EMBED_USER_AGENT_REGEX = /(twitter|discord)/
const RELEASE_DATE_FORMAT = 'ddd MMM DD YYYY HH:mm:ss GMTZZ'

const E = process.env

const getCollectionEmbedUrl = (type: Playable, id: number, ownerId: number) => {
  return `${E.PUBLIC_URL}/embed/${type}?id=${id}&ownerId=${ownerId}&flavor=card&twitter=true`
}

const getTrackEmbedUrl = (type: Playable, hashId: string) => {
  return `${E.PUBLIC_URL}/embed/${type}/${hashId}?flavor=card&twitter=true`
}

// Note: Discord only respects audius.co embed players at a prefix of
// audius.co/track, audius.co/album, audius.co/playlist
// We add support for Discord by offering a an alternative route "hack"
// These URLs are *never* to be shared more broadly than in the
// general-admission response to a Discordbot.

const getCollectiblesEmbedUrl = (
  handle: string,
  isDiscord: boolean = false
) => {
  return `${E.PUBLIC_URL}/embed/${
    isDiscord ? 'track/' : ''
  }${handle}/collectibles`
}

const getCollectibleEmbedUrl = (
  handle: string,
  collectibleId: string,
  isDiscord: boolean = false
) => {
  return `${E.PUBLIC_URL}/embed/${
    isDiscord ? 'track/' : ''
  }${handle}/collectibles/${collectibleId}`
}

/** Routes */

const template = handlebars.compile(
  fs.readFileSync(path.resolve(__dirname, './template.html')).toString()
)

const getTrackContext = async (
  handle: string,
  slug: string,
  canEmbed: boolean
): Promise<Context> => {
  if (!handle || !slug) return getDefaultContext()
  try {
    const track = await getTrackByHandleAndSlug(handle, slug)

    const tags = track.tags ? track.tags.split(',') : []
    tags.push('audius', 'sound', 'kit', 'sample', 'pack', 'stems', 'mix')

    const labels = [
      {
        name: 'Released',
        value: formatDate(track.release_date, RELEASE_DATE_FORMAT),
      },
      { name: 'Duration', value: formatSeconds(track.duration) },
      { name: 'Genre', value: track.genre },
      { name: 'Mood', value: track.mood },
    ]

    return {
      format: MetaTagFormat.Track,
      title: `${track.title} • ${track.user.name}`,
      description: track.description || '',
      tags,
      labels,
      image: track.artwork['1000x1000'],
      embed: canEmbed,
      embedUrl: getTrackEmbedUrl(Playable.TRACK, track.id),
    }
  } catch (e) {
    console.error(e)
    return getDefaultContext()
  }
}

const getCollectionContext = async (
  id: number,
  canEmbed: boolean
): Promise<Context> => {
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
      embedUrl: getCollectionEmbedUrl(
        collection.is_album ? Playable.ALBUM : Playable.PLAYLIST,
        collection.playlist_id,
        collection.playlist_owner_id
      ),
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

    const infoText =
      user.track_count > 0
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

const getCollectiblesContext = async (
  handle: string,
  canEmbed: boolean,
  isDiscord: boolean = false
): Promise<Context> => {
  if (!handle) return getDefaultContext()
  try {
    const user = await getUserByHandle(handle)
    const gateway = formatGateway(user.creator_node_endpoint, user.user_id)

    const profilePicture = user.profile_picture_sizes
      ? `${user.profile_picture_sizes}/1000x1000.jpg`
      : user.profile_picture

    const infoText =
      user.track_count > 0
        ? `Listen to ${user.name} on Audius`
        : `Follow ${user.name} on Audius`

    return {
      format: MetaTagFormat.Collectibles,
      title: `${user.name}'s Collectibles`,
      description: `A collection of NFT collectibles owned and created by ${user.name}`,
      additionalSEOHint: infoText,
      image: getImageUrl(profilePicture, gateway),
      embed: canEmbed,
      embedUrl: getCollectiblesEmbedUrl(user.handle, isDiscord),
    }
  } catch (e) {
    console.error(e)
    return getDefaultContext()
  }
}

const getCollectibleContext = async (
  handle: string,
  collectibleId: string,
  canEmbed: boolean,
  isDiscord: boolean = false
): Promise<Context> => {
  if (!handle) return getDefaultContext()
  try {
    const user = await getUserByHandle(handle)
    const gateway = formatGateway(user.creator_node_endpoint, user.user_id)

    const profilePicture = user.profile_picture_sizes
      ? `${user.profile_picture_sizes}/1000x1000.jpg`
      : user.profile_picture

    const infoText =
      user.track_count > 0
        ? `Listen to ${user.name} on Audius`
        : `Follow ${user.name} on Audius`

    const dp = libs.discoveryProvider.discoveryProviderEndpoint
    const encodedUserId = encodeHashId(user.user_id)
    const res = await fetch(
      `${dp}/v1/users/associated_wallets?id=${encodedUserId}`
    )
    const { data: walletData } = await res.json()

    if (collectibleId) {
      // Get collectibles for user wallets
      const resp = await nftClient.getCollectibles({
        ethWallets: walletData.wallets,
        solWallets: walletData.sol_wallets,
      })

      const ethValues: Collectible[][] = Object.values(resp.ethCollectibles)
      const solValues: Collectible[][] = Object.values(resp.solCollectibles)
      const collectibles = [
        ...ethValues.reduce((acc, vals) => [...acc, ...vals], []),
        ...solValues.reduce((acc, vals) => [...acc, ...vals], []),
      ]

      const foundCol = collectibles.find(
        (col) => getHash(col.id) === collectibleId
      )

      if (foundCol) {
        return {
          format: MetaTagFormat.Collectibles,
          title: foundCol.name ?? '',
          description: foundCol.description ?? '',
          additionalSEOHint: infoText,
          image: foundCol.frameUrl ?? '',
          embed: canEmbed,
          embedUrl: getCollectibleEmbedUrl(
            user.handle,
            collectibleId,
            isDiscord
          ),
        }
      }
    }

    return {
      format: MetaTagFormat.Collectibles,
      title: `${user.name}'s Collectibles`,
      description: `A collection of NFT collectibles owned and created by ${user.name}`,
      additionalSEOHint: infoText,
      image: getImageUrl(profilePicture, gateway),
      embed: canEmbed,
      embedUrl: getCollectiblesEmbedUrl(user.handle),
    }
  } catch (e) {
    console.error(e)
    return getDefaultContext()
  }
}

const getRemixesContext = async (
  handle: string,
  slug: string
): Promise<Context> => {
  if (!handle || !slug) return getDefaultContext()
  try {
    const track = await getTrackByHandleAndSlug(handle, slug)

    const tags = track.tags ? track.tags.split(',') : []
    tags.push('audius', 'sound', 'kit', 'sample', 'pack', 'stems', 'mix')

    const labels = [
      {
        name: 'Released',
        value: formatDate(track.release_date, RELEASE_DATE_FORMAT),
      },
      { name: 'Duration', value: formatSeconds(track.duration) },
      { name: 'Genre', value: track.genre },
      { name: 'Mood', value: track.mood },
    ]

    return {
      format: MetaTagFormat.Remixes,
      title: `Remixes of ${track.title} • ${track.user.name}`,
      description: track.description || '',
      tags,
      labels,
      image: track.artwork['1000x1000'],
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
    thumbnail: true,
  }
}

const getExploreContext = (type: string): Context => {
  return {
    format: MetaTagFormat.Explore,
    thumbnail: true,
    ...getExploreInfo(type),
  }
}

const getDefaultContext = (): Context => {
  return {
    format: MetaTagFormat.Default,
    title: 'Audius',
    description:
      'Audius is a music streaming and \
sharing platform that puts power back into the hands \
of content creators',
    image: DEFAULT_IMAGE_URL,
    thumbnail: true,
  }
}

const getTokenContext = (): Context => {
  return {
    format: MetaTagFormat.AUDIO,
    title: '$AUDIO & Rewards',
    description: 'Earn $AUDIO tokens while using the app!',
    image: AUDIO_REWARDS_IMAGE_URL,
    thumbnail: false,
  }
}

const getSignupRefContext = (handle: string): Context => {
  return {
    format: MetaTagFormat.SignupRef,
    title: `Invite to join Audius from ${handle}!`,
    description:
      'Sign up for Audius to earn $AUDIO tokens while using the app!',
    image: SIGNUP_REF_IMAGE_URL,
    thumbnail: false,
  }
}

const getResponse = async (
  format: MetaTagFormat,
  req: express.Request,
  res: express.Response
) => {
  const { title, handle, type, collectibleId } = req.params
  const { ref } = req.query

  const userAgent = req.get('User-Agent') || ''
  const canEmbed = CAN_EMBED_USER_AGENT_REGEX.test(userAgent.toLowerCase())
  const isDiscord = userAgent.toLowerCase().includes('discord')

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
    case MetaTagFormat.Collectibles:
      console.log('get collectibles', req.path, userAgent)
      context = await getCollectiblesContext(handle, canEmbed, isDiscord)
      break
    case MetaTagFormat.Collectible:
      console.log('get collectible', req.path, userAgent)
      context = await getCollectibleContext(
        handle,
        collectibleId,
        canEmbed,
        isDiscord
      )
      break
    case MetaTagFormat.AUDIO:
      console.log('get audio', req.path, userAgent)
      context = await getTokenContext()
      break
    case MetaTagFormat.SignupRef:
      console.log('get signup ref', req.path, userAgent)
      context = await getSignupRefContext(ref as string)
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
