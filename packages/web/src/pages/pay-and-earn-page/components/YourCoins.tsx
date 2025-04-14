import { useCallback, useEffect, useState } from 'react'

import { walletSelectors } from '@audius/common/store'
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
const { AUDIO_PAGE } = route
const { getAccountTotalBalance } = walletSelectors

const messages = {
  title: 'Your Coins',
  buySell: 'Buy/Sell',
  loading: '-- $AUDIO'
}

// AUDIO token address from Jupiter
const AUDIO_TOKEN_ID = '9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM'

export const YourCoins = () => {
  const dispatch = useDispatch()
  const totalBalance = useSelector(getAccountTotalBalance)
  const { color } = useTheme()
  const [audioPrice, setAudioPrice] = useState<string | null>(null)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)

  // Format the balance for display using toShorthand
  const audioAmount = totalBalance
    ? `${AUDIO(totalBalance).toShorthand()} $AUDIO`
    : messages.loading

  useEffect(() => {
    const fetchAudioPrice = async () => {
      try {
        setIsLoadingPrice(true)
        const response = await fetch(
          `https://lite-api.jup.ag/price/v2?ids=${AUDIO_TOKEN_ID}`
        )
        const data = await response.json()
        if (data?.data?.[AUDIO_TOKEN_ID]?.price) {
          setAudioPrice(data.data[AUDIO_TOKEN_ID].price)
        }
      } catch (error) {
        console.error('Failed to fetch AUDIO price:', error)
      } finally {
        setIsLoadingPrice(false)
      }
    }

    fetchAudioPrice()
  }, [])

  const handleTokenClick = useCallback(() => {
    dispatch(push(AUDIO_PAGE))
  }, [dispatch])

  // Calculate dollar value of user's AUDIO balance
  const dollarValue = (() => {
    if (!audioPrice || !totalBalance) return '$0.00'

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
          }
        }}
      >
        <Flex alignItems='center' gap='l'>
          <IconLogoCircle width={DIMENSIONS} height={DIMENSIONS} />
          <Flex direction='column' gap='xs'>
            <Text variant='heading' size='l' color='default'>
              {audioAmount}
            </Text>
            <Text variant='body' size='m' color='subdued'>
              {isLoadingPrice ? '$0.00 (loading...)' : dollarValue}
            </Text>
          </Flex>
        </Flex>

        <IconCaretRight size='l' color='subdued' />
      </Flex>
    </Paper>
  )
}
