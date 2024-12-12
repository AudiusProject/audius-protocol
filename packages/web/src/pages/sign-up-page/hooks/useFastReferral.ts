import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { useSelector } from 'react-redux'

import { getReferrer } from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'

export const useFastReferral = () => {
  const hasReferrer = useSelector(getReferrer)
  const { isEnabled: isFastReferralEnabled } = useFeatureFlag(
    FeatureFlags.FAST_REFERRAL
  )
  const { isMobile } = useMedia()
  return Boolean(hasReferrer && isFastReferralEnabled && isMobile)
}
