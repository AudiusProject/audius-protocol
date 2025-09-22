import React, { useMemo } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { useKeyboard } from '@react-native-community/hooks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Flex } from '@audius/harmony-native'
import {
  Screen,
  ScreenContent,
  FixedFooter,
  ScrollView
} from 'app/components/core'
import { FIXED_FOOTER_HEIGHT } from 'app/components/core/FixedFooter'
import { useNavigation } from 'app/hooks/useNavigation'

import type { BuySellScreenParams } from '../../types/navigation'

import { BuySellFlow } from './BuySellFlow'
import { PoweredByJupiter } from './components/PoweredByJupiter'

type BuySellScreenProps = {
  route: {
    params?: BuySellScreenParams
  }
}

export const BuySellScreen = ({ route }: BuySellScreenProps) => {
  const navigation = useNavigation()
  const { params } = route
  const insets = useSafeAreaInsets()
  const { keyboardHeight, keyboardShown } = useKeyboard()

  const handleClose = () => {
    navigation.goBack()
  }

  const flowData = BuySellFlow({
    onClose: handleClose,
    initialTab: params?.initialTab,
    coinTicker: params?.coinTicker
  })

  const dynamicPaddingBottom = useMemo(() => {
    // We need to account for the FixedFooter's height and the safe area insets.
    // Additionally, when the keyboard is shown, we need to add the keyboard height
    // so the content scrolls above the keyboard.
    return (
      FIXED_FOOTER_HEIGHT + insets.bottom + (keyboardShown ? keyboardHeight : 0)
    )
  }, [insets.bottom, keyboardHeight, keyboardShown])

  return (
    <Screen title={messages.title} variant='white' url='/buy-sell'>
      <ScreenContent>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: dynamicPaddingBottom
          }}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <PoweredByJupiter />
          <Flex mt='xl' p='l'>
            {flowData.content}
          </Flex>
        </ScrollView>

        <FixedFooter avoidKeyboard>{flowData.footer}</FixedFooter>
      </ScreenContent>
    </Screen>
  )
}
