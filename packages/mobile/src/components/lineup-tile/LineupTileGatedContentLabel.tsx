import { useMemo } from 'react'

import type { AccessConditions } from '@audius/common/models'
import {
  GatedContentType,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated
} from '@audius/common/models'

import {
  IconCart,
  IconCollectible,
  IconSpecialAccess
} from '@audius/harmony-native'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'

import { LineupTileLabel } from './LineupTileLabel'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  premium: 'Premium'
}

type LineupTileGatedContentLabelProps = {
  streamConditions: AccessConditions
  hasStreamAccess?: boolean
  isOwner: boolean
}

/**
 * Returns a tag that indicates the type of stream content
 * @param streamConditions the track's stream conditions
 * @param hasStreamAccess whether the user has access to stream the track
 * @isOwner whether the user is the owner of the track
 */
export const LineupTileGatedContentLabel = (
  props: LineupTileGatedContentLabelProps
) => {
  const { streamConditions, hasStreamAccess, isOwner } = props
  const isUSDCEnabled = useIsUSDCEnabled()

  const type =
    isUSDCEnabled && isContentUSDCPurchaseGated(streamConditions)
      ? GatedContentType.USDC_PURCHASE
      : isContentCollectibleGated(streamConditions)
      ? GatedContentType.COLLECTIBLE_GATED
      : GatedContentType.SPECIAL_ACCESS

  const gatedContentTypeMap = useMemo(() => {
    return {
      [GatedContentType.COLLECTIBLE_GATED]: {
        icon: IconCollectible,
        color: hasStreamAccess && !isOwner ? 'subdued' : 'special',
        text: messages.collectibleGated
      } as const,
      [GatedContentType.SPECIAL_ACCESS]: {
        icon: IconSpecialAccess,
        color: hasStreamAccess && !isOwner ? 'subdued' : 'special',
        text: messages.specialAccess
      } as const,
      [GatedContentType.USDC_PURCHASE]: {
        icon: IconCart,
        color: hasStreamAccess && !isOwner ? 'subdued' : 'premium',
        text: messages.premium
      } as const
    }
  }, [hasStreamAccess, isOwner])

  const { icon: Icon, color, text } = gatedContentTypeMap[type]

  return (
    <LineupTileLabel icon={Icon} color={color}>
      {text}
    </LineupTileLabel>
  )
}
