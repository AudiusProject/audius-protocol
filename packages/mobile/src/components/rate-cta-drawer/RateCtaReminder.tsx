import { useCallback } from 'react'

import {
  selectIsAccountComplete,
  useCurrentAccountUser
} from '@audius/common/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getStartedAndFinishedSignup } from 'common/store/pages/signon/selectors'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { RATE_CTA_STORAGE_KEY } from 'app/constants/storage-keys'
import useSessionCount from 'app/hooks/useSessionCount'
import { requestReview } from 'app/store/rate-cta/slice'

const FIRST_REMINDER_SESSION = 3
const REMINDER_FREQUENCY = 5

export const RateCtaReminder = () => {
  const { data: hasCompleteAccount } = useCurrentAccountUser({
    select: selectIsAccountComplete
  })
  const hasFinishedSignUp = useSelector(getStartedAndFinishedSignup)
  const hasAccount = hasCompleteAccount && hasFinishedSignUp

  const { value: userRateResponse, loading } = useAsync(() =>
    AsyncStorage.getItem(RATE_CTA_STORAGE_KEY)
  )

  return !loading && !userRateResponse && hasAccount ? (
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
