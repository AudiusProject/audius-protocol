import {
  sdk,
  DiscoveryNodeSelector,
  stagingConfig,
  developmentConfig,
  productionConfig
} from '@audius/sdk'

import { recordListen as recordAnalyticsListen } from '../analytics/analytics'

import { getIdentityEndpoint, getAPIHostname } from './getEnv'
import { encodeHashId, decodeHashId } from './hashIds'
import { logError } from './logError'

const HOSTNAME = getAPIHostname()
const IDENTITY_SERVICE_ENDPOINT = getIdentityEndpoint()

const env = process.env.VITE_ENVIRONMENT
const sdkConfigOptions =
  env === 'development'
    ? developmentConfig
    : env === 'staging'
      ? stagingConfig
      : productionConfig

export const RequestedEntity = Object.seal({
  TRACKS: 'tracks',
  COLLECTIONS: 'collections',
  COLLECTIBLES: 'collectibles'
})
let discoveryEndpoint
const discoveryNodeSelector = new DiscoveryNodeSelector({
  healthCheckThresholds: {
    minVersion: sdkConfigOptions.minVersion
  },
  bootstrapServices: sdkConfigOptions.discoveryNodes
})
discoveryNodeSelector.addEventListener('change', (endpoint) => {
  discoveryEndpoint = endpoint
})
const audiusSdk = sdk({
  appName: 'Audius Embed Player',
  services: {
    discoveryNodeSelector
  },
  ...sdkConfigOptions
})

export const getTrackStreamEndpoint = (trackId) =>
  `${discoveryEndpoint}/v1/tracks/${trackId}/stream`

export const getCollectiblesJson = async (cid) => {
  const url = `${discoveryEndpoint}/v1/full/cid_data/${cid}`
  return (await (await fetch(url)).json())?.data?.data
}

window.audiusSdk = audiusSdk

export const uuid = () => {
  // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/873856#873856
  const s = []
  const hexDigits = '0123456789abcdef'
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = '4' // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1) // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-'

  const uuid = s.join('')
  return uuid
}

/** param trackId is the encoded track id (i.e. hash id) */
export const recordListen = async (trackId) => {
  const numericHashId = decodeHashId(trackId)
  const url = `${IDENTITY_SERVICE_ENDPOINT}/tracks/${numericHashId}/listen`
  const method = 'POST'
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }

  const body = JSON.stringify({
    userId: uuid()
  })

  try {
    await fetch(url, { method, headers, body })
    recordAnalyticsListen(numericHashId)
  } catch (e) {
    logError(`Got error storing playcount: [${e.message}]`)
  }
}

const makeRequest = async (url) => {
  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      // If we have a 404, that means the track was deleted
      if (resp.status === 404) return null
      // Otherwise throw
      throw new Error(`HTTP Error: Status Code [${resp.status}]`)
    }
    return resp.json()
  } catch (e) {
    logError(`Saw error requesting URL [${url}]: [${e.message}]`)
    throw e
  }
}

const getFormattedCollectionResponse = (collection) => {
  const item = collection?.[0]
  return item
}

const constructCollectiblesEndpoint = (handle) =>
  `${process.env.VITE_AUDIUS_SCHEME}://${HOSTNAME}/embed/api/${handle}/${RequestedEntity.COLLECTIBLES}`

const constructCollectibleIdEndpoint = (handle, collectibleId) =>
  `${process.env.VITE_AUDIUS_SCHEME}://${HOSTNAME}/embed/api/${handle}/${RequestedEntity.COLLECTIBLES}/${collectibleId}`

export const getTrack = async (id) => {
  const res = await audiusSdk.full.tracks.getTrack({
    trackId: encodeHashId(id)
  })
  return res.data
}

export const getTrackWithHashId = async (hashId) => {
  const res = await audiusSdk.full.tracks.getTrack({ trackId: hashId })
  return res.data
}

export const getCollection = async (id) => {
  const res = await audiusSdk.full.playlists.getPlaylist({
    playlistId: encodeHashId(id)
  })
  return getFormattedCollectionResponse(res.data)
}

export const getCollectionWithHashId = async (hashId) => {
  const res = await audiusSdk.full.playlists.getPlaylist({ playlistId: hashId })
  return getFormattedCollectionResponse(res.data)
}

export const getCollectible = async (handle, collectibleId) => {
  const url = constructCollectibleIdEndpoint(handle, collectibleId)
  return makeRequest(url)
}

export const getCollectibles = async (handle) => {
  const url = constructCollectiblesEndpoint(handle)
  return makeRequest(url)
}
