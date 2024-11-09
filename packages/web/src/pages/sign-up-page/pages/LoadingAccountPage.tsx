import { useEffect } from 'react'

import { route } from '@audius/common/utils'
import { Flex } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { getReferrer, getStatus } from 'common/store/pages/signon/selectors'
import { EditingStatus } from 'common/store/pages/signon/types'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'

import { Heading, Page } from '../components/layout'

const { SIGN_UP_COMPLETED_REDIRECT, SIGN_UP_COMPLETED_REFERRER_REDIRECT } =
  route

const messages = {
  heading: 'Your Account is Almost Ready to Rock 🤘',
  description: "We're just finishing up a few things..."
}

// This loading page shows up when the users account is still being created either due to slow creation or a fast user
// The user just waits here until the account is created and before being shown the welcome modal on the trending page
export const LoadingAccountPage = () => {
  const navigate = useNavigateToPage()
  const hasReferrer = useSelector(getReferrer)
  const { isMobile } = useMedia()

  const accountCreationStatus = useSelector(getStatus)

  useEffect(() => {
    if (accountCreationStatus === EditingStatus.SUCCESS) {
      if (hasReferrer && isMobile) {
        navigate(SIGN_UP_COMPLETED_REFERRER_REDIRECT)
      } else {
        navigate(SIGN_UP_COMPLETED_REDIRECT)
      }
    }
    // TODO: what to do in an error scenario? Any way to recover to a valid step?
  }, [navigate, accountCreationStatus, hasReferrer, isMobile])

  return (
    <Page gap='3xl' justifyContent='center' alignItems='center' pb='3xl'>
      <LoadingSpinner css={{ height: '72px' }} />
      <Flex justifyContent='center' css={{ textAlign: 'center' }}>
        <Heading
          heading={messages.heading}
          description={messages.description}
        />
      </Flex>
    </Page>
  )
}
