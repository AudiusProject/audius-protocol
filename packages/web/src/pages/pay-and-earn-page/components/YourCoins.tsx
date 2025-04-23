import { useCallback } from 'react'

import { useFormattedAudioBalance } from '@audius/common/hooks'
import { walletMessages } from '@audius/common/messages'
import { route } from '@audius/common/utils'
import {
  Flex,
  IconCaretRight,
  IconLogoCircle,
  Paper,
  Text,
  useTheme
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

const DIMENSIONS = 64
const { WALLET_AUDIO_PAGE } = route

export const YourCoins = () => {
  const dispatch = useDispatch()
  const { color, spacing } = useTheme()

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
        p='xl'
        alignSelf='stretch'
        onClick={handleTokenClick}
        css={{
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: color.background.surface2
          },
          '@media (max-width: 768px)': {
            padding: spacing.l
          }
        }}
      >
        <Flex
          alignItems='center'
          gap='l'
          css={{
            '@media (max-width: 480px)': {
              gap: spacing.m
            }
          }}
        >
          <IconLogoCircle
            width={DIMENSIONS}
            height={DIMENSIONS}
            css={{
              '@media (max-width: 480px)': {
                width: '48px',
                height: '48px'
              }
            }}
          />
          <Flex direction='column' gap='xs'>
            <Flex
              gap='xs'
              css={{
                '@media (max-width: 480px)': {
                  flexDirection: 'column',
                  gap: '0'
                }
              }}
            >
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
