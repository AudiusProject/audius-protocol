import { useEffect, useState } from 'react'

import { route } from '@audius/common/utils'
import { Flex, Button } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { finishSignUp } from 'common/store/pages/signon/actions'
import { getStatus, getAccountReady } from 'common/store/pages/signon/selectors'
import { EditingStatus } from 'common/store/pages/signon/types'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

import { Heading, Page } from '../components/layout'
import { useFastReferral } from '../hooks/useFastReferral'

const { SIGN_UP_COMPLETED_REDIRECT } = route

const messages = {
  heading: 'Your Account is Almost Ready to Rock 🤘',
  description: "We're just finishing up a few things...",
  continueButton: 'Continue to Audius'
}

// This loading page shows up when the users account is still being created either due to slow creation or a fast user
// The user just waits here until the account is created and before being shown the welcome modal on the trending page
export const LoadingAccountPage = () => {
  const navigate = useNavigateToPage()
  const dispatch = useDispatch()
  const isFastReferral = useFastReferral()
  const accountReady = useSelector(getAccountReady)
  const accountCreationStatus = useSelector(getStatus)
  const [showContinueButton, setShowContinueButton] = useState(false)

  const isAccountReady = isFastReferral
    ? accountReady
    : accountReady || accountCreationStatus === EditingStatus.SUCCESS

  useEffect(() => {
    if (isAccountReady) {
      navigate(SIGN_UP_COMPLETED_REDIRECT)
    }
    // TODO: what to do in an error scenario? Any way to recover to a valid step?
  }, [navigate, isAccountReady])

  // Show continue button after 10 seconds if account is still not ready
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAccountReady) {
        setShowContinueButton(true)
      }
    }, 10000) // 10 seconds

    return () => clearTimeout(timer)
  }, [isAccountReady])

  const handleContinue = () => {
    // Mark sign-up as finished so RootScreen shows HomeStack
    dispatch(finishSignUp())
    navigate(SIGN_UP_COMPLETED_REDIRECT)
  }

  return (
    <Page gap='3xl' justifyContent='center' alignItems='center' pb='3xl'>
      <LoadingSpinner css={{ height: '72px' }} />
      <Flex justifyContent='center' css={{ textAlign: 'center' }}>
        <Heading
          heading={messages.heading}
          description={messages.description}
        />
      </Flex>
      {showContinueButton && (
        <Button onClick={handleContinue} fullWidth>
          {messages.continueButton}
        </Button>
      )}
    </Page>
  )
}
