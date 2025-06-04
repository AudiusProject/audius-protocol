import React, { useState, useEffect, useMemo } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import type { Screen } from '@audius/common/store'

import { Flex, IconJupiterLogo, Text } from '@audius/harmony-native'
import { Screen as MobileScreen, ScreenContent } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import type { BuySellScreenParams } from '../../types/navigation'

import { BuySellFlow } from './BuySellFlow'

type BuySellScreenProps = {
  route: {
    params?: BuySellScreenParams
  }
}

export const BuySellScreen = ({ route }: BuySellScreenProps) => {
  const navigation = useNavigation()
  const { params } = route

  const [modalScreen, setModalScreen] = useState<Screen>('input')
  const [isFlowLoading, setIsFlowLoading] = useState(false)

  // Reset modal state when screen loads
  useEffect(() => {
    setModalScreen('input')
    setIsFlowLoading(false)
  }, [])

  const handleClose = () => {
    navigation.goBack()
  }

  const handleNavigateToConfirm = () => {
    navigation.navigate('ConfirmSwapScreen')
  }

  const handleScreenChange = (screen: Screen) => {
    setModalScreen(screen)

    // Navigate to different screens based on the screen state
    if (screen === 'confirm') {
      navigation.navigate('ConfirmSwapScreen')
    } else if (screen === 'success') {
      navigation.navigate('TransactionResultScreen', {
        result: {
          status: 'success' as const
        },
        type: 'swap' as const
      })
    }
  }

  const handleLoadingStateChange = (isLoading: boolean) => {
    setIsFlowLoading(isLoading)
  }

  const title = useMemo(() => {
    if (isFlowLoading) return ''
    if (modalScreen === 'confirm') return messages.confirmDetails
    if (modalScreen === 'success') return messages.modalSuccessTitle
    return messages.title
  }, [isFlowLoading, modalScreen])

  const showFooter = modalScreen !== 'success' && !isFlowLoading

  return (
    <MobileScreen title={title} variant='secondary' url='/buy-sell'>
      <ScreenContent>
        <BuySellFlow
          onClose={handleClose}
          onNavigateToConfirm={handleNavigateToConfirm}
          onScreenChange={handleScreenChange}
          onLoadingStateChange={handleLoadingStateChange}
          initialTab={params?.initialTab}
        />

        {/* Footer with Jupiter branding */}
        {showFooter && (
          <Flex
            direction='row'
            alignItems='center'
            justifyContent='center'
            gap='s'
            p='l'
            borderTop='default'
            backgroundColor='surface1'
          >
            <Text variant='label' size='xs' color='subdued'>
              {messages.poweredBy}
            </Text>
            <IconJupiterLogo size='xs' />
          </Flex>
        )}
      </ScreenContent>
    </MobileScreen>
  )
}
