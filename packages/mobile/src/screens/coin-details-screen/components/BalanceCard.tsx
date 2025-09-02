import { useCallback } from 'react'

import { useTokenBalance, useArtistCoin } from '@audius/common/api'
import { useFormattedTokenBalance } from '@audius/common/hooks'
import { coinDetailsMessages, walletMessages } from '@audius/common/messages'
import { receiveTokensModalActions } from '@audius/common/store'

import { Paper, Flex, Text, Button } from '@audius/harmony-native'
import { TokenIcon } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useDispatch } from 'react-redux'

const messages = coinDetailsMessages.balance

type BalanceStateProps = {
  title: string
  logoURI?: string
  onBuy?: () => void
  onReceive?: () => void
  onSend?: () => void
}

const ZeroBalanceState = ({
  title,
  logoURI,
  onBuy,
  onReceive
}: BalanceStateProps) => {
  return (
    <Flex column gap='l' w='100%'>
      <Flex row gap='s' alignItems='center'>
        <TokenIcon logoURI={logoURI} size={64} />
        <Text variant='heading' size='l' color='subdued'>
          {title}
        </Text>
      </Flex>
      <Paper
        column
        backgroundColor='surface2'
        shadow='flat'
        border='strong'
        ph='xl'
        pv='l'
        gap='xs'
      >
        <Text variant='heading' size='s'>
          {messages.becomeAMember}
        </Text>
        <Text>{messages.hintDescription(title)}</Text>
      </Paper>
      <Flex column gap='s'>
        <Button variant='primary' fullWidth onPress={onBuy}>
          {walletMessages.buy}
        </Button>
        <Button variant='secondary' fullWidth onPress={onReceive}>
          {walletMessages.receive}
        </Button>
      </Flex>
    </Flex>
  )
}

const HasBalanceState = ({
  title,
  logoURI,
  onBuy,
  onSend,
  onReceive,
  mint
}: BalanceStateProps & { mint: string }) => {
  const {
    tokenBalanceFormatted,
    tokenDollarValue
    // isTokenBalanceLoading,
    // isTokenPriceLoading
  } = useFormattedTokenBalance(mint)

  //   const isLoading = isTokenBalanceLoading || isTokenPriceLoading

  return (
    <Flex column gap='l' w='100%'>
      <Flex row gap='s' alignItems='center'>
        <TokenIcon logoURI={logoURI} size={64} />
        <Flex column gap='xs'>
          <Flex row gap='xs'>
            <Text variant='heading' size='l' color='default'>
              {tokenBalanceFormatted}
            </Text>
            <Text variant='heading' size='l' color='subdued'>
              {title}
            </Text>
          </Flex>
          <Text variant='heading' size='s' color='subdued'>
            {tokenDollarValue}
          </Text>
        </Flex>
      </Flex>
      <Flex column gap='s'>
        <Button variant='secondary' fullWidth onPress={onBuy}>
          {walletMessages.buySell}
        </Button>
        <Button variant='secondary' fullWidth onPress={onSend}>
          {walletMessages.send}
        </Button>
        <Button variant='secondary' fullWidth onPress={onReceive}>
          {walletMessages.receive}
        </Button>
      </Flex>
    </Flex>
  )
}

export const BalanceCard = ({ mint }: { mint: string }) => {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { data: coin, isPending: coinsLoading } = useArtistCoin({ mint })
  const { data: tokenBalance } = useTokenBalance({ mint })

  const handleBuy = useCallback(() => {
    navigation.navigate('BuySell', {
      initialTab: 'buy',
      coinTicker: coin?.ticker
    })
  }, [navigation, coin])

  const handleReceive = useCallback(() => {
    dispatch(receiveTokensModalActions.open({ mint, isOpen: true }))
  }, [dispatch, mint])

  if (coinsLoading || !coin) {
    // TODO: Add skeleton state
    return null
  }

  const title = coin.ticker ?? ''
  const logoURI = coin.logoUri

  return (
    <Paper p='l' border='default' borderRadius='l' shadow='far'>
      {!tokenBalance?.balance ||
      Number(tokenBalance.balance.toString()) === 0 ? (
        <ZeroBalanceState
          title={title}
          logoURI={logoURI}
          onBuy={handleBuy}
          onReceive={handleReceive}
        />
      ) : (
        <HasBalanceState
          title={title}
          logoURI={logoURI}
          onBuy={handleBuy}
          onSend={() => {}}
          onReceive={handleReceive}
          mint={mint}
        />
      )}
    </Paper>
  )
}
