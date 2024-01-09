import { useEffect } from 'react'

import { Flex, useTheme } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { getStatus } from 'common/store/pages/signon/selectors'
import { EditingStatus } from 'common/store/pages/signon/types'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { SIGN_UP_COMPLETED_REDIRECT } from 'utils/route'

import { Heading, Page } from '../components/layout'

const messages = {
  heading: 'Your Account is Almost Ready to Rock 🤘',
  description: "We're just finishing up a few things..."
}

// This loading page shows up when the users account is still being created either due to slow creation or a fast user
// The user just waits here until the account is created and before being shown the welcome modal on the trending page
export const LoadingAccountPage = () => {
  const navigate = useNavigateToPage()
  const { color } = useTheme()

  const accountCreationStatus = useSelector(getStatus)

  useEffect(() => {
    if (accountCreationStatus === EditingStatus.SUCCESS) {
      navigate(SIGN_UP_COMPLETED_REDIRECT)
    }
    // TODO: what to do in an error scenario? Any way to recover to a valid step?
  }, [navigate, accountCreationStatus])

  return (
    <Page gap='3xl' justifyContent='center' alignItems='center' pb='3xl'>
      <LoadingSpinner css={{ height: '72px', '& stroke': color.icon.accent }} />
      <Flex justifyContent='center' css={{ textAlign: 'center' }}>
        <Heading
          heading={messages.heading}
          description={messages.description}
        />
      </Flex>
    </Page>
  )
}
