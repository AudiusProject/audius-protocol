import { FeatureFlags } from '@audius/common'

import { useFlag } from 'hooks/useRemoteConfig'
import { isMatrix } from 'utils/theme/theme'

import TrackBannerIcon, { TrackBannerIconType } from './TrackBannerIcon'

export const GiantTrackTileCornerTag = ({
  type
}: {
  type: TrackBannerIconType
}) => {
  const { isEnabled: isPremiumContentEnabled } = useFlag(
    FeatureFlags.PREMIUM_CONTENT_ENABLED
  )

  if (!isPremiumContentEnabled) {
    return null
  }

  return <TrackBannerIcon type={type} isMatrixMode={isMatrix()} />
}
