import { useCallback } from 'react'

import { useFormattedAudioBalance } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { route } from '@audius/common/utils'
import {
  Flex,
  IconCaretRight,
  IconTokenAUDIO,
  Paper,
  Text,
  useTheme,
  useMedia
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

const DIMENSIONS = 64
const { WALLET_AUDIO_PAGE } = route

export const YourCoins = () => {
  const dispatch = useDispatch()
  const { color, spacing, cornerRadius } = useTheme()
  const { isMobile, isExtraSmall } = useMedia()

  const {
    audioBalanceFormatted,
    audioDollarValue,
    isAudioBalanceLoading,
    isAudioPriceLoading
  } = useFormattedAudioBalance()

  const handleTokenClick = useCallback(() => {
    dispatch(push(WALLET_AUDIO_PAGE))
  }, [dispatch])

  const displayAmount = isAudioBalanceLoading
    ? walletMessages.loading
    : audioBalanceFormatted

  return (
    <Paper
      direction='column'
      shadow='far'
      borderRadius='l'
      css={{ overflow: 'hidden' }}
    >
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
          <Flex direction='column' gap='xs'>
            <Flex gap='xs'>
              <Text variant='heading' size='l' color='default'>
                {displayAmount}
              </Text>
              <Text variant='heading' size='l' color='subdued'>
                $AUDIO
              </Text>
            </Flex>
            <Text variant='heading' size='s' color='subdued'>
              {isAudioPriceLoading
                ? walletMessages.loadingPrice
                : audioDollarValue}
            </Text>
          </Flex>
        </Flex>

        <IconCaretRight size='l' color='subdued' />
      </Flex>
    </Paper>
  )
}
