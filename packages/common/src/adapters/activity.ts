import { full } from '@audius/sdk'

import { userCollectionMetadataFromSDK } from './collection'
import { userTrackMetadataFromSDK } from './track'

export const activityFromSDK = (input: full.ActivityFull) => {
  const { timestamp, itemType: item_type, item } = input
  if (item_type === full.ActivityFullItemTypeEnum.Track) {
    return {
      timestamp,
      item_type,
      item: userTrackMetadataFromSDK(item as full.TrackFull)
    }
  } else if (item_type === full.ActivityFullItemTypeEnum.Playlist) {
    return {
      timestamp,
      item_type,
      item: userCollectionMetadataFromSDK(item as full.PlaylistFull)
    }
  }
  return undefined
}

export const trackActivityFromSDK = (input: full.ActivityFull) => {
  const { timestamp, itemType: item_type, item } = input
  if (item_type === full.ActivityFullItemTypeEnum.Track) {
    return {
      timestamp,
      item_type,
      item: userTrackMetadataFromSDK(item as full.TrackFull)
    }
  }
  return undefined
}

export const repostActivityFromSDK = (input: full.ActivityFull) => {
  const { timestamp, itemType: item_type, item } = input
  if (item_type === full.ActivityFullItemTypeEnum.Track) {
    return {
      timestamp,
      item_type,
      item: userTrackMetadataFromSDK(full.TrackFullFromJSON(item))
    }
  } else if (item_type === full.ActivityFullItemTypeEnum.Playlist) {
    return {
      timestamp,
      item_type,
      item: userCollectionMetadataFromSDK(full.PlaylistFullFromJSON(item))
    }
  }
  return undefined
}
