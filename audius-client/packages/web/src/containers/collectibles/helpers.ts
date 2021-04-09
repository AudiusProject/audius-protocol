import { OpenSeaAsset, OpenSeaEvent } from 'services/opensea-client/types'
import {
  Collectible,
  CollectibleType
} from 'containers/collectibles/components/types'
import { gifPreview } from 'utils/imageProcessingUtil'

/**
 * extensions based on OpenSea metadata standards
 * https://docs.opensea.io/docs/metadata-standards
 */
const OPENSEA_VIDEO_EXTENSIONS = [
  'gltf',
  'glb',
  'webm',
  'mp4',
  'm4v',
  'ogv',
  'ogg'
]
const OPENSEA_AUDIO_EXTENSIONS = ['mp3', 'wav', 'oga']

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const isAssetImage = (asset: OpenSeaAsset) => {
  const nonImageExtensions = [
    ...OPENSEA_VIDEO_EXTENSIONS,
    ...OPENSEA_AUDIO_EXTENSIONS
  ]
  return [
    asset.image_url,
    asset.image_original_url,
    asset.image_preview_url,
    asset.image_thumbnail_url
  ].some(url => url && nonImageExtensions.every(ext => !url.endsWith(ext)))
}

const isAudio = (url: string) => {
  return OPENSEA_AUDIO_EXTENSIONS.some(extension => url.endsWith(extension))
}

const isAssetVideo = (asset: OpenSeaAsset) => {
  const {
    animation_url,
    animation_original_url,
    image_url,
    image_original_url,
    image_preview_url,
    image_thumbnail_url
  } = asset
  if (isAudio(animation_url || '') || isAudio(animation_original_url || '')) {
    return false
  }
  return (
    !!animation_url ||
    !!animation_original_url ||
    [
      image_url,
      image_original_url,
      image_preview_url,
      image_thumbnail_url
    ].some(
      url => url && OPENSEA_VIDEO_EXTENSIONS.some(ext => url.endsWith(ext))
    )
  )
}

const isAssetGif = (asset: OpenSeaAsset) => {
  return !!(
    asset.image_url?.endsWith('.gif') ||
    asset.image_original_url?.endsWith('.gif') ||
    asset.image_preview_url?.endsWith('.gif') ||
    asset.image_thumbnail_url?.endsWith('.gif')
  )
}

export const isAssetValid = (asset: OpenSeaAsset) => {
  return isAssetVideo(asset) || isAssetImage(asset) || isAssetGif(asset)
}

export const assetToCollectible = async (
  asset: OpenSeaAsset
): Promise<Collectible> => {
  let type: CollectibleType
  let frameUrl = null
  let imageUrl = null
  let videoUrl = null
  let gifUrl = null

  const { animation_url, animation_original_url, name } = asset
  const imageUrlsHighToLowRes = [
    asset.image_url,
    asset.image_original_url,
    asset.image_preview_url,
    asset.image_thumbnail_url
  ]
  const imageUrlsLowToHighRes = [
    asset.image_url,
    asset.image_original_url,
    asset.image_preview_url,
    asset.image_thumbnail_url
  ]

  try {
    if (isAssetGif(asset)) {
      type = CollectibleType.GIF
      const urlForFrame = imageUrlsLowToHighRes.find(url =>
        url?.endsWith('.gif')
      )!
      frameUrl = await getFrameFromGif(urlForFrame, name || '')
      gifUrl = imageUrlsHighToLowRes.find(url => url?.endsWith('.gif'))!
    } else if (isAssetVideo(asset)) {
      type = CollectibleType.VIDEO
      frameUrl =
        imageUrlsLowToHighRes.find(
          url =>
            url && OPENSEA_VIDEO_EXTENSIONS.every(ext => !url.endsWith(ext))
        ) ?? null

      /**
       * make sure frame url is not a video
       * if it is avideo, unset frame url so that component will use a video url instead
       */
      if (frameUrl) {
        const res = await fetch(frameUrl, { method: 'HEAD' })
        const isVideo = OPENSEA_VIDEO_EXTENSIONS.some(ext =>
          res.headers.get('Content-Type')?.includes(ext)
        )
        if (isVideo) {
          frameUrl = null
        }
      }

      videoUrl =
        [animation_url, animation_original_url].find(
          url => url && !isAudio(url)
        ) ?? null
      if (!videoUrl) {
        videoUrl = imageUrlsHighToLowRes.find(
          url => url && OPENSEA_VIDEO_EXTENSIONS.some(ext => url.endsWith(ext))
        )!
      }
    } else {
      type = CollectibleType.IMAGE
      frameUrl = imageUrlsLowToHighRes.find(url => !!url)!
      const res = await fetch(frameUrl, { method: 'HEAD' })
      const isGif = res.headers.get('Content-Type')?.includes('gif')
      const isVideo = res.headers.get('Content-Type')?.includes('video')
      if (isGif) {
        type = CollectibleType.GIF
        frameUrl = await getFrameFromGif(frameUrl, name || '')
        gifUrl = imageUrlsHighToLowRes.find(url => !!url)!
      } else if (isVideo) {
        type = CollectibleType.VIDEO
        frameUrl = null
        videoUrl = imageUrlsHighToLowRes.find(url => !!url)!
      } else {
        imageUrl = imageUrlsHighToLowRes.find(url => !!url)!
      }
    }
  } catch (e) {
    console.error('Error fetching collectible', e)
    type = CollectibleType.IMAGE
    frameUrl = imageUrlsLowToHighRes.find(url => !!url)!
  }

  return {
    id: asset.token_id,
    name: asset.name,
    description: asset.description,
    type,
    frameUrl,
    imageUrl,
    videoUrl,
    gifUrl,
    isOwned: true,
    dateCreated: null,
    dateLastTransferred: null,
    externalLink: asset.external_link,
    permaLink: asset.permalink
  }
}

export const creationEventToCollectible = async (
  event: OpenSeaEvent
): Promise<Collectible> => {
  const { asset, created_date } = event

  const collectible = await assetToCollectible(asset)

  return {
    ...collectible,
    dateCreated: created_date,
    isOwned: false
  }
}

export const transferEventToCollectible = async (
  event: OpenSeaEvent,
  isOwned = true
): Promise<Collectible> => {
  const { asset, created_date } = event

  const collectible = await assetToCollectible(asset)

  return {
    ...collectible,
    isOwned,
    dateLastTransferred: created_date
  }
}

export const isNotFromNullAddress = (event: OpenSeaEvent) => {
  return event.from_account.address !== NULL_ADDRESS
}

const getFrameFromGif = async (url: string, name: string) => {
  const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
  const isSafariMobile =
    navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i)
  let preview
  try {
    // Firefox does not handle partial gif rendering well
    if (isFirefox || isSafariMobile) {
      throw new Error('partial gif not supported')
    }
    const req = await fetch(url, {
      headers: {
        // Extremely heuristic 200KB. This should contain the first frame
        // and then some. Rendering this out into an <img tag won't allow
        // animation to play. Some gifs may not load if we do this, so we
        // can try-catch it.
        Range: 'bytes=0-200000'
      }
    })
    const ab = await req.arrayBuffer()
    preview = new Blob([ab])
  } catch (e) {
    preview = await gifPreview(url)
  }

  return URL.createObjectURL(preview)
}
