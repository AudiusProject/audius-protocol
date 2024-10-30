import { useContext } from 'react'

import { useGetCurrentUserId, useGetTrackById } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import {
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated
} from '@audius/common/models'
import type { Maybe } from '@audius/common/utils'

import type { IconColors, IconComponent } from '@audius/harmony-native'
import {
  IconCart,
  IconCollectible,
  IconReceive,
  IconSpecialAccess
} from '@audius/harmony-native'
import { SearchContext } from 'app/screens/search-screen/searchState'

import { LineupTileLabel } from './LineupTileLabel'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  premium: 'Premium',
  premiumExtras: 'Extras'
}

type GatedTrackLabelProps = {
  trackId: ID
}

export const GatedTrackLabel = (props: GatedTrackLabelProps) => {
  const { trackId } = props
  const { data: track } = useGetTrackById({ id: trackId })
  const { data: currentUserId } = useGetCurrentUserId({})
  const { active: onSearchScreen } = useContext(SearchContext)

  if (!track) return null

  const {
    is_stream_gated,
    is_download_gated,
    stream_conditions,
    download_conditions,
    owner_id
  } = track

  const isOwner = owner_id === currentUserId

  let message: Maybe<string>
  let Icon: Maybe<IconComponent>
  let color: Maybe<IconColors>

  if (is_stream_gated) {
    if (
      isContentFollowGated(stream_conditions) ||
      isContentTipGated(stream_conditions)
    ) {
      message = messages.specialAccess
      Icon = IconSpecialAccess
      color = 'special'
    } else if (isContentCollectibleGated(stream_conditions)) {
      message = messages.collectibleGated
      Icon = IconCollectible
      color = 'special'
    } else if (isContentUSDCPurchaseGated(stream_conditions)) {
      message = messages.premium
      Icon = IconCart
      color = 'premium'
    }
  } else if (is_download_gated && onSearchScreen) {
    if (isContentUSDCPurchaseGated(download_conditions)) {
      message = messages.premiumExtras
      Icon = IconReceive
      color = 'premium'
    }
  }

  if (!message || !Icon || !color) {
    return null
  }

  return (
    <LineupTileLabel icon={Icon} color={isOwner ? 'subdued' : color}>
      {message}
    </LineupTileLabel>
  )
}
