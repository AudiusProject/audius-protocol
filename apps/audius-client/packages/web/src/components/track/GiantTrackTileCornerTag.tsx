import { FeatureFlags } from '@audius/common'

import { useFlag } from 'hooks/useRemoteConfig'
import { isMatrix } from 'utils/theme/theme'

import TrackBannerIcon, { TrackBannerIconType } from './TrackBannerIcon'

export const GiantTrackTileCornerTag = ({
  type
}: {
  type: TrackBannerIconType
}) => {
  const { isEnabled: isGatedContentEnabled } = useFlag(
    FeatureFlags.GATED_CONTENT_ENABLED
  )

  if (!isGatedContentEnabled) {
    return null
  }

  return <TrackBannerIcon type={type} isMatrixMode={isMatrix()} />
}
