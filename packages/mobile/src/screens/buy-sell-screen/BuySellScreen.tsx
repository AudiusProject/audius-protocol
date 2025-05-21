import { useMemo, useState } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { useBuySellModal, useAddFundsModal } from '@audius/common/store'
import { IconJupiterLogo } from '@audius/harmony/src/icons'
import { useTheme } from '@emotion/react'
import { useNavigation } from '@react-navigation/native'

import { Flex, Text } from '@audius/harmony-native'
import { Screen } from 'app/components/core'

// Define the types locally since the import is problematic
type FlowScreen = 'input' | 'confirm' | 'success'

type BuySellFlowProps = {
  onClose: () => void
  openAddFundsModal: () => void
  onScreenChange: (screen: FlowScreen) => void
  onLoadingStateChange: (isLoading: boolean) => void
}

// Temporarily define a placeholder component until implemented
const BuySellFlow = (_props: BuySellFlowProps) => {
  return null
}

export const BuySellScreen = () => {
  const { spacing } = useTheme()
  const navigation = useNavigation()
  const { onOpen: openAddFundsModal } = useAddFundsModal()

  // While web uses this to control modal state, we'll use it to track screen state
  const { onClose } = useBuySellModal()

  const [currentScreen, setCurrentScreen] = useState<FlowScreen>('input')
  const [isFlowLoading, setIsFlowLoading] = useState(false)

  const title = useMemo(() => {
    if (isFlowLoading) return ''
    if (currentScreen === 'confirm') return messages.confirmDetails
    if (currentScreen === 'success') return messages.modalSuccessTitle
    return messages.title
  }, [isFlowLoading, currentScreen])

  const handleClose = () => {
    onClose()
    navigation.goBack()
  }

  return (
    <Screen title={title}>
      {!isFlowLoading && currentScreen !== 'success' && (
        <Flex
          direction='row'
          alignItems='center'
          justifyContent='center'
          p='s'
          mt='m'
        >
          <Text variant='label' size='xs' color='subdued'>
            {messages.poweredBy}
          </Text>
          <IconJupiterLogo />
        </Flex>
      )}

      <BuySellFlow
        onClose={handleClose}
        openAddFundsModal={openAddFundsModal}
        onScreenChange={setCurrentScreen}
        onLoadingStateChange={setIsFlowLoading}
      />
    </Screen>
  )
}
