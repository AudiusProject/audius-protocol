import { full } from '@audius/sdk'

import { userCollectionMetadataFromSDK } from './collection'
import { userTrackMetadataFromSDK } from './track'

export const repostActivityFromSDK = (activity: full.ActivityFull) => {
  if (full.instanceOfTrackActivityFull(activity)) {
    return userTrackMetadataFromSDK(activity.item)
  } else if (full.instanceOfCollectionActivityFull(activity)) {
    return userCollectionMetadataFromSDK(activity.item)
  }
  return undefined
}
