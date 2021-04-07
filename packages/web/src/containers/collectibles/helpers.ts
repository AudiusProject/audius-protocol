import { OpenSeaAsset, OpenSeaEvent } from 'services/opensea-client/types'
import {
  Collectible,
  CollectibleType
} from 'containers/collectibles/components/types'
import { resizeImage } from 'utils/imageProcessingUtil'
import { preload } from 'utils/image'

const OPENSEA_AUDIO_EXTENSIONS = ['mp3', 'wav', 'oga']
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const isAssetImage = (asset: OpenSeaAsset) => {
  return (
    !!asset.image_url ||
    !!asset.image_original_url ||
    !!asset.image_preview_url ||
    !!asset.image_thumbnail_url
  )
}

const isAssetAudio = (asset: OpenSeaAsset) => {
  return OPENSEA_AUDIO_EXTENSIONS.some(extension =>
    asset.animation_url?.endsWith(extension)
  )
}

const isAssetVideo = (asset: OpenSeaAsset) => {
  return !!asset.animation_url && !isAssetAudio(asset)
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

export const assetToCollectible = (asset: OpenSeaAsset): Collectible => {
  let type = CollectibleType.IMAGE
  if (isAssetVideo(asset)) type = CollectibleType.VIDEO
  if (isAssetGif(asset)) type = CollectibleType.GIF

  return {
    id: asset.token_id,
    name: asset.name,
    description: asset.description,
    type,
    imageUrl: asset.image_url,
    imagePreviewUrl: asset.image_preview_url,
    imageThumbnailUrl: asset.image_thumbnail_url,
    imageOriginalUrl: asset.image_original_url,
    animationUrl: asset.animation_url,
    animationOriginalUrl: asset.animation_original_url,
    youtubeUrl: asset.youtube_url,
    isOwned: true,
    dateCreated: null,
    dateLastTransferred: null,
    externalLink: asset.external_link
  }
}

export const creationEventToCollectible = (
  event: OpenSeaEvent
): Collectible => {
  const { asset, created_date } = event

  return {
    ...assetToCollectible(asset),
    dateCreated: created_date,
    isOwned: false
  }
}

export const transferEventToCollectible = (
  event: OpenSeaEvent,
  isOwned = true
): Collectible => {
  const { asset, created_date } = event

  return {
    ...assetToCollectible(asset),
    isOwned,
    dateLastTransferred: created_date
  }
}

export const isNotFromNullAddress = (event: OpenSeaEvent) => {
  return event.from_account.address !== NULL_ADDRESS
}

const getFrameFromGif = async (url: string, name: string) => {
  const imageBlob = await fetch(url).then(r => r.blob())
  const imageFile = new File([imageBlob], name, {
    type: 'image/jpeg'
  })
  const resized = await resizeImage(imageFile, 200, true, name)
  return URL.createObjectURL(resized)
}

export const getCollectibleImage = async (collectible: Collectible) => {
  const {
    imageUrl,
    imageOriginalUrl,
    imagePreviewUrl,
    imageThumbnailUrl,
    name
  } = collectible
  if (imageUrl?.endsWith('.gif')) {
    return await getFrameFromGif(imageUrl, name || '')
  }
  if (imageOriginalUrl?.endsWith('.gif')) {
    return await getFrameFromGif(imageOriginalUrl, name || '')
  }
  if (imagePreviewUrl?.endsWith('.gif')) {
    return await getFrameFromGif(imagePreviewUrl, name || '')
  }
  if (imageThumbnailUrl?.endsWith('.gif')) {
    return await getFrameFromGif(imageThumbnailUrl, name || '')
  }
  if (imageUrl) {
    await preload(imageUrl)
  }
  return imageUrl
}
