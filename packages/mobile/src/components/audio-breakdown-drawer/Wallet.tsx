import { useCallback } from 'react'

import { Chain } from '@audius/common/models'
import {
  shortenSPLAddress,
  shortenEthAddress,
  formatNumberCommas
} from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'
import Clipboard from '@react-native-clipboard/clipboard'
import { Animated, TouchableWithoutFeedback } from 'react-native'

import { Flex, Text, IconCopy } from '@audius/harmony-native'
import { ChainLogo } from 'app/components/core'
import { usePressScaleAnimation } from 'app/hooks/usePressScaleAnimation'
import { useToast } from 'app/hooks/useToast'

const messages = {
  copied: 'Copied To Clipboard!'
}

type WalletProps = { chain: Chain; address: string; balance: bigint }

export const Wallet = (props: WalletProps) => {
  const { chain, address, balance } = props
  const { toast } = useToast()

  const { scale, handlePressIn, handlePressOut } = usePressScaleAnimation(0.98)

  const displayAddress =
    chain === Chain.Eth ? shortenEthAddress : shortenSPLAddress

  const handleCopy = useCallback(() => {
    Clipboard.setString(address)
    toast({ content: messages.copied, type: 'info' })
  }, [address, toast])

  return (
    <Flex row alignItems='center' justifyContent='space-between' gap='xs'>
      <Animated.View style={[{ transform: [{ scale }] }]}>
        <TouchableWithoutFeedback
          onPress={handleCopy}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Flex row alignItems='center' gap='m'>
            <ChainLogo chain={chain} />
            <Text variant='body' size='s' strength='strong'>
              {displayAddress(address)}
            </Text>
            <IconCopy size='s' color='subdued' />
          </Flex>
        </TouchableWithoutFeedback>
      </Animated.View>
      <Text variant='body' size='s' strength='strong'>
        {formatNumberCommas(
          AUDIO(balance).toLocaleString('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
          })
        )}
      </Text>
    </Flex>
  )
}
