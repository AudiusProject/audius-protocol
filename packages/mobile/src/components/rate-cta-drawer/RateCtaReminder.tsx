import { useCallback } from 'react'

import { FeatureFlags } from '@audius/common/services'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getHasCompletedAccount } from 'common/store/pages/signon/selectors'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { RATE_CTA_STORAGE_KEY } from 'app/constants/storage-keys'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import useSessionCount from 'app/hooks/useSessionCount'
import { requestReview } from 'app/store/rate-cta/slice'

const FIRST_REMINDER_SESSION = 3
const REMINDER_FREQUENCY = 5

export const RateCtaReminder = () => {
  const hasCompletedAccount = useSelector(getHasCompletedAccount)
  const { isEnabled: isRateCtaEnabled } = useFeatureFlag(
    FeatureFlags.RATE_CTA_ENABLED
  )

  const { value: userRateResponse, loading } = useAsync(() =>
    AsyncStorage.getItem(RATE_CTA_STORAGE_KEY)
  )

  return isRateCtaEnabled &&
    !loading &&
    !userRateResponse &&
    hasCompletedAccount ? (
    <RateCtaReminderInternal />
  ) : null
}

const RateCtaReminderInternal = () => {
  const dispatch = useDispatch()

  const displayReviewCtaDrawer = useCallback(() => {
    dispatch(requestReview())
  }, [dispatch])

  useSessionCount(
    displayReviewCtaDrawer,
    REMINDER_FREQUENCY,
    FIRST_REMINDER_SESSION
  )

  return null
}
