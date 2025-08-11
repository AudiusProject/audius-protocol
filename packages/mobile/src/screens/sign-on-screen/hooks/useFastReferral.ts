import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { getReferrer } from 'common/store/pages/signon/selectors'
import { useSelector } from 'react-redux'

export const useFastReferral = () => {
  const hasReferrer = useSelector(getReferrer)
  const { isEnabled: isFastReferralEnabled } = useFeatureFlag(
    FeatureFlags.FAST_REFERRAL
  )
  // Remove isMobile check to enable fast referral on all platforms
  return Boolean(hasReferrer && isFastReferralEnabled)
}
