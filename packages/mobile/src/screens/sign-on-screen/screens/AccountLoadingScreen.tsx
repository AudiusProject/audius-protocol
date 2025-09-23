// This loading page shows up when the users account is still being created either due to slow creation or a fast user

import { useEffect } from 'react'

import { getAccountReady } from '@audius/web/src/common/store/pages/signon/selectors'
import { useSelector } from 'react-redux'

import { Flex } from '@audius/harmony-native'
import LoadingSpinner from 'app/components/loading-spinner'
import { useNavigation } from 'app/hooks/useNavigation'

import { Heading, Page } from '../components/layout'
import type { SignOnScreenParamList } from '../types'

const messages = {
  heading: 'Your Account is Almost Ready to Rock 🤘',
  description: "We're just finishing up a few things...",
  continueButton: 'Continue to Audius'
}

// The user just waits here until the account is created and before being shown the welcome modal on the trending page
export const AccountLoadingScreen = () => {
  const navigation = useNavigation<SignOnScreenParamList>()
  const isAccountReady = useSelector(getAccountReady)

  useEffect(() => {
    if (isAccountReady) {
      navigation.navigate('HomeStack', { screen: 'Trending' })
    }
  }, [isAccountReady, navigation])

  return (
    <Page gap='3xl' justifyContent='center' alignItems='center' pb='3xl'>
      <LoadingSpinner style={{ height: 36, width: 36 }} />
      <Flex justifyContent='center'>
        <Heading
          heading={messages.heading}
          description={messages.description}
          centered
        />
      </Flex>
    </Page>
  )
}
