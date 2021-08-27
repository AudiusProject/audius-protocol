import {
  Collectible,
  CollectibleMediaType
} from 'containers/collectibles/types'
import {
  OpenSeaAssetExtended,
  OpenSeaEvent,
  OpenSeaEventExtended
} from 'services/opensea-client/types'
import { Chain } from 'store/token-dashboard/slice'
import { gifPreview } from 'utils/imageProcessingUtil'

/**
 * extensions based on OpenSea metadata standards
 * https://docs.opensea.io/docs/metadata-standards
 */
const OPENSEA_AUDIO_EXTENSIONS = ['mp3', 'wav', 'oga']
const OPENSEA_VIDEO_EXTENSIONS = [
  'gltf',
  'glb',
  'webm',
  'mp4',
  'm4v',
  'ogv',
  'ogg',
  'mov'
]

const SUPPORTED_VIDEO_EXTENSIONS = ['webm', 'mp4', 'ogv', 'ogg', 'mov']

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const isAssetImage = (asset: OpenSeaAssetExtended) => {
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

const isAssetVideo = (asset: OpenSeaAssetExtended) => {
  const {
    animation_url,
    animation_original_url,
    image_url,
    image_original_url,
    image_preview_url,
    image_thumbnail_url
  } = asset
  return [
    animation_url || '',
    animation_original_url || '',
    image_url,
    image_original_url,
    image_preview_url,
    image_thumbnail_url
  ].some(
    url => url && SUPPORTED_VIDEO_EXTENSIONS.some(ext => url.endsWith(ext))
  )
}

const isAssetGif = (asset: OpenSeaAssetExtended) => {
  return !!(
    asset.image_url?.endsWith('.gif') ||
    asset.image_original_url?.endsWith('.gif') ||
    asset.image_preview_url?.endsWith('.gif') ||
    asset.image_thumbnail_url?.endsWith('.gif')
  )
}

export const isAssetValid = (asset: OpenSeaAssetExtended) => {
  return isAssetVideo(asset) || isAssetImage(asset) || isAssetGif(asset)
}

/**
 * Returns a collectible given an asset object from the OpenSea API
 *
 * A lot of the work here is to determine whether a collectible is a gif, a video, or an image
 *
 * If the collectible is a gif, we set the gifUrl, and we process a frame from the gifUrl which we set as its frameUrl
 *
 * If the collectible is a video, we set the videoUrl, and we check whether the asset has an image
 * - if it has an image, we check whether the image url is an actual image or a video (sometimes OpenSea returns
 *   videos in the image url properties of the asset)
 *   - if it's an image, we set it as the frameUrl
 *   - otherwise, we unset the frameUrl
 * - if not, we do not set the frameUrl
 * Video collectibles that do not have a frameUrl will use the video paused at the first frame as the thumbnail
 * in the collectibles tab
 *
 * Otherwise, we consider the collectible to be an image, we get the image url and make sure that it is not
 * a gif or a video
 * - if it's a gif, we follow the above gif logic
 * - if it's a video, we unset the frameUrl and follow the above video logic
 * - otherwise, we set the frameUrl and the imageUrl
 *
 * @param asset
 */
export const assetToCollectible = async (
  asset: OpenSeaAssetExtended
): Promise<Collectible> => {
  let mediaType: CollectibleMediaType
  let frameUrl = null
  let imageUrl = null
  let videoUrl = null
  let gifUrl = null

  const { animation_url, animation_original_url, name } = asset
  const imageUrls = [
    asset.image_url,
    asset.image_original_url,
    asset.image_preview_url,
    asset.image_thumbnail_url
  ]

  try {
    if (isAssetGif(asset)) {
      mediaType = CollectibleMediaType.GIF
      const urlForFrame = imageUrls.find(url => url?.endsWith('.gif'))!
      frameUrl = await getFrameFromGif(urlForFrame, name || '')
      gifUrl = imageUrls.find(url => url?.endsWith('.gif'))!
    } else if (isAssetVideo(asset)) {
      mediaType = CollectibleMediaType.VIDEO
      frameUrl =
        imageUrls.find(
          url =>
            url && SUPPORTED_VIDEO_EXTENSIONS.every(ext => !url.endsWith(ext))
        ) ?? null

      /**
       * make sure frame url is not a video
       * if it is a video, unset frame url so that component will use a video url instead
       */
      if (frameUrl) {
        const res = await fetch(frameUrl, { method: 'HEAD' })
        const isVideo = res.headers.get('Content-Type')?.includes('video')
        if (isVideo) {
          frameUrl = null
        }
      }

      videoUrl = [animation_url, animation_original_url, ...imageUrls].find(
        url => url && SUPPORTED_VIDEO_EXTENSIONS.some(ext => url.endsWith(ext))
      )!
    } else {
      mediaType = CollectibleMediaType.IMAGE
      frameUrl = imageUrls.find(url => !!url)!
      const res = await fetch(frameUrl, { method: 'HEAD' })
      const isGif = res.headers.get('Content-Type')?.includes('gif')
      const isVideo = res.headers.get('Content-Type')?.includes('video')
      if (isGif) {
        mediaType = CollectibleMediaType.GIF
        gifUrl = frameUrl
        frameUrl = await getFrameFromGif(frameUrl, name || '')
      } else if (isVideo) {
        mediaType = CollectibleMediaType.VIDEO
        frameUrl = null
        videoUrl = imageUrls.find(url => !!url)!
      } else {
        imageUrl = imageUrls.find(url => !!url)!
      }
    }
  } catch (e) {
    console.error('Error processing collectible', e)
    mediaType = CollectibleMediaType.IMAGE
    frameUrl = imageUrls.find(url => !!url)!
    imageUrl = frameUrl
  }

  return {
    id: `${asset.token_id}:::${asset.asset_contract?.address ?? ''}`,
    tokenId: asset.token_id,
    name: asset.name,
    description: asset.description,
    mediaType,
    frameUrl,
    imageUrl,
    videoUrl,
    gifUrl,
    isOwned: true,
    dateCreated: null,
    dateLastTransferred: null,
    externalLink: asset.external_link,
    permaLink: asset.permalink,
    assetContractAddress: asset.asset_contract?.address ?? null,
    chain: Chain.Eth,
    wallet: asset.wallet
  }
}

export const creationEventToCollectible = async (
  event: OpenSeaEventExtended
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
  event: OpenSeaEventExtended,
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

export const getFrameFromGif = async (url: string, name: string) => {
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
