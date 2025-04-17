import { useCallback } from 'react'

import { useTokenPrice } from '@audius/common/api'
import { TOKEN_LISTING_MAP, walletSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'
import {
  Flex,
  IconCaretRight,
  IconLogoCircle,
  Paper,
  Text,
  useTheme
} from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'
import { push } from 'redux-first-history'

const DIMENSIONS = 64
const { WALLET_AUDIO_PAGE } = route
const { getAccountTotalBalance } = walletSelectors

const messages = {
  title: 'Your Coins',
  buySell: 'Buy/Sell',
  loading: '-- $AUDIO',
  dollarZero: '$0.00',
  loadingPrice: '$0.00 (loading...)'
}

// AUDIO token address from Jupiter
const AUDIO_TOKEN_ID = TOKEN_LISTING_MAP.AUDIO.address

export const YourCoins = () => {
  const dispatch = useDispatch()
  const totalBalance = useSelector(getAccountTotalBalance)
  const { color, spacing } = useTheme()

  const { data: audioPriceData, isPending: isLoadingPrice } =
    useTokenPrice(AUDIO_TOKEN_ID)

  const audioPrice = audioPriceData?.price || null

  // Format the balance for display using toLocaleString for numbers with commas
  const audioAmount = totalBalance
    ? `${AUDIO(totalBalance).toLocaleString()}`
    : messages.loading

  const handleTokenClick = useCallback(() => {
    dispatch(push(WALLET_AUDIO_PAGE))
  }, [dispatch])

  // Calculate dollar value of user's AUDIO balance
  const dollarValue = (() => {
    if (!audioPrice || !totalBalance) return messages.dollarZero

    const priceNumber = parseFloat(audioPrice)
    const balanceValue = parseFloat(AUDIO(totalBalance).toString())
    const totalValue = priceNumber * balanceValue

    return `$${totalValue.toFixed(2)} ($${parseFloat(audioPrice).toFixed(4)})`
  })()

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
                {audioAmount}
              </Text>
              <Text variant='heading' size='l' color='subdued'>
                $AUDIO
              </Text>
            </Flex>
            <Text variant='heading' size='s' color='subdued'>
              {isLoadingPrice ? messages.loadingPrice : dollarValue}
            </Text>
          </Flex>
        </Flex>

        <IconCaretRight size='l' color='subdued' />
      </Flex>
    </Paper>
  )
}
