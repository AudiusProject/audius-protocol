import { useCallback } from 'react'

import { walletSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'
import {
  Flex,
  IconCaretRight,
  IconLogoCircle,
  Paper,
  Text
} from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'
import { push } from 'redux-first-history'

const DIMENSIONS = 64
const { AUDIO_PAGE } = route
const { getAccountTotalBalance } = walletSelectors

const messages = {
  title: 'Your Coins',
  buySell: 'Buy/Sell',
  dollarValue: '$0.00 ($0.082)',
  loading: '-- $AUDIO'
}

export const YourCoins = () => {
  const dispatch = useDispatch()
  const totalBalance = useSelector(getAccountTotalBalance)

  // Format the balance for display using toShorthand
  const audioAmount = totalBalance
    ? `${AUDIO(totalBalance).toShorthand()} $AUDIO`
    : messages.loading

  const handleTokenClick = useCallback(() => {
    dispatch(push(AUDIO_PAGE))
  }, [dispatch])

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
            backgroundColor: 'var(--surface-2)'
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
              {messages.dollarValue}
            </Text>
          </Flex>
        </Flex>

        <IconCaretRight size='l' color='subdued' />
      </Flex>
    </Paper>
  )
}
