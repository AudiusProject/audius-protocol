import { useCallback } from 'react'

import { useFeatureFlag, useFormattedAudioBalance } from '@audius/common/hooks'
import { buySellMessages as messages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import { useBuySellModal } from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Button,
  Flex,
  IconCaretRight,
  IconTokenAUDIO,
  Paper,
  Text,
  useMedia,
  useTheme
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

const DIMENSIONS = 64
const { WALLET_AUDIO_PAGE } = route

const TokensHeader = () => {
  const { color } = useTheme()
  const { onOpen: openBuySellModal } = useBuySellModal()

  const handleBuySellClick = useCallback(() => {
    openBuySellModal()
  }, [openBuySellModal])

  return (
    <Flex
      alignItems='center'
      justifyContent='space-between'
      p='l'
      css={{ borderBottom: `1px solid ${color.border.default}` }}
    >
      <Text variant='heading' size='m' color='heading'>
        {messages.yourCoins}
      </Text>
      <Button variant='secondary' size='small' onClick={handleBuySellClick}>
        {messages.buySell}
      </Button>
    </Flex>
  )
}

export const YourCoins = () => {
  const dispatch = useDispatch()
  const { color, spacing, cornerRadius, motion } = useTheme()
  const { isMobile, isExtraSmall } = useMedia()
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

  const {
    audioBalanceFormatted,
    audioDollarValue,
    isAudioBalanceLoading,
    isAudioPriceLoading
  } = useFormattedAudioBalance()

  const handleTokenClick = useCallback(() => {
    dispatch(push(WALLET_AUDIO_PAGE))
  }, [dispatch])

  const isLoading = isAudioBalanceLoading || isAudioPriceLoading

  return (
    <Paper
      direction='column'
      shadow='far'
      borderRadius='l'
      css={{ overflow: 'hidden' }}
    >
      {isWalletUIBuySellEnabled ? <TokensHeader /> : null}
      <Flex
        alignItems='center'
        justifyContent='space-between'
        p={isMobile ? spacing.l : spacing.xl}
        alignSelf='stretch'
        onClick={handleTokenClick}
        css={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: color.background.surface2
          }
        }}
      >
        <Flex alignItems='center' gap={isExtraSmall ? 'm' : 'l'}>
          <IconTokenAUDIO
            width={DIMENSIONS}
            height={DIMENSIONS}
            css={{
              borderRadius: cornerRadius.circle
            }}
          />
          <Flex
            direction='column'
            gap='xs'
            css={{
              opacity: isLoading ? 0 : 1,
              transition: `opacity ${motion.expressive}`
            }}
          >
            <Flex gap='xs'>
              <Text variant='heading' size='l' color='default'>
                {audioBalanceFormatted}
              </Text>
              <Text variant='heading' size='l' color='subdued'>
                {messages.audioTicker}
              </Text>
            </Flex>
            <Text variant='heading' size='s' color='subdued'>
              {audioDollarValue}
            </Text>
          </Flex>
        </Flex>

        <IconCaretRight size='l' color='subdued' />
      </Flex>
    </Paper>
  )
}
