import type { ID, AccessConditions } from '@audius/common/models'
import {
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentSpecialAccess,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import { PurchaseableContentType } from '@audius/common/store'
import type { ViewStyle } from 'react-native'

import { DetailsTileHasAccess } from './DetailsTileHasAccess'
import { DetailsTileNoAccess } from './DetailsTileNoAccess'

type DetailsTileGatedAccessProps = {
  trackId: ID
  streamConditions: AccessConditions
  isOwner: boolean
  hasStreamAccess: boolean
  style?: ViewStyle
  contentType: PurchaseableContentType
}

export const DetailsTileGatedAccess = ({
  trackId,
  streamConditions,
  isOwner,
  hasStreamAccess,
  style,
  contentType
}: DetailsTileGatedAccessProps) => {
  const shouldDisplay =
    isContentCollectibleGated(streamConditions) ||
    isContentFollowGated(streamConditions) ||
    isContentTipGated(streamConditions) ||
    isContentSpecialAccess(streamConditions) ||
    isContentUSDCPurchaseGated(streamConditions)

  if (!shouldDisplay) return null

  if (hasStreamAccess) {
    return (
      <DetailsTileHasAccess
        streamConditions={streamConditions}
        isOwner={isOwner}
        style={style}
        contentType={contentType}
      />
    )
  }

  return (
    <DetailsTileNoAccess
      trackId={trackId}
      // Currently only special-access tracks are supported
      contentType={PurchaseableContentType.TRACK}
      streamConditions={streamConditions}
      style={style}
    />
  )
}
