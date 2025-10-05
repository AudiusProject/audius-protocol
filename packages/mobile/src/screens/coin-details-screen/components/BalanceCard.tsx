import { useCallback } from 'react'

import { useTokenBalance, useArtistCoin } from '@audius/common/api'
import {
  useFormattedTokenBalance,
  useIsManagedAccount
} from '@audius/common/hooks'
import { coinDetailsMessages, walletMessages } from '@audius/common/messages'
import {
  receiveTokensModalActions,
  sendTokensModalActions
} from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { Paper, Flex, Text, Button, spacing } from '@audius/harmony-native'
import { TokenIcon } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = coinDetailsMessages.balance

type BalanceStateProps = {
  ticker: string
  logoURI?: string
  onBuy?: () => void
  onReceive?: () => void
  onSend?: () => void
  coinName: string
}

const ZeroBalanceState = ({
  ticker,
  logoURI,
  onBuy,
  onReceive,
  coinName
}: BalanceStateProps) => {
  const isManagerMode = useIsManagedAccount()
  return (
    <Flex column gap='l' w='100%'>
      <Flex row gap='s' alignItems='center'>
        <TokenIcon logoURI={logoURI} size={64} />
        <Flex column gap='2xs'>
          <Text variant='heading' size='s'>
            {coinName}
          </Text>
          <Text variant='title' size='l' color='subdued'>
            ${ticker}
          </Text>
        </Flex>
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
        <Text>{messages.hintDescription(ticker)}</Text>
      </Paper>
      <Flex column gap='s'>
        <Button
          disabled={isManagerMode}
          variant='primary'
          fullWidth
          onPress={onBuy}
        >
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
  ticker,
  logoURI,
  onBuy,
  onSend,
  onReceive,
  mint,
  coinName
}: BalanceStateProps & { mint: string; coinName: string }) => {
  const isManagerMode = useIsManagedAccount()
  const { tokenBalanceFormatted, formattedHeldValue } =
    useFormattedTokenBalance(mint)

  return (
    <Flex column gap='l' w='100%'>
      <Flex row alignItems='center' justifyContent='space-between'>
        <Flex row alignItems='center' gap='l' style={{ flexShrink: 1 }}>
          <TokenIcon logoURI={logoURI} size={64} />
          <Flex column gap='2xs'>
            <Text variant='heading' size='s'>
              {coinName || `$${ticker}`}
            </Text>
            <Text variant='title' size='l'>
              {tokenBalanceFormatted}
            </Text>
          </Flex>
        </Flex>
        <Flex row alignItems='center' gap='m' ml={spacing.unit22}>
          <Text
            variant='title'
            size='l'
            color='default'
            style={{
              lineHeight: spacing.unit7,
              transform: [{ translateY: -spacing.unitHalf }]
            }}
          >
            {formattedHeldValue}
          </Text>
        </Flex>
      </Flex>
      <Flex column gap='s'>
        <Button
          disabled={isManagerMode}
          variant='secondary'
          fullWidth
          onPress={onBuy}
        >
          {walletMessages.buySell}
        </Button>
        <Button
          disabled={isManagerMode}
          variant='secondary'
          fullWidth
          onPress={onSend}
        >
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
  const { data: coin, isPending: coinsLoading } = useArtistCoin(mint)
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

  const handleSend = useCallback(() => {
    dispatch(sendTokensModalActions.open({ mint, isOpen: true }))
  }, [dispatch, mint])

  if (coinsLoading || !coin) {
    // TODO: Add skeleton state
    return null
  }

  const title = coin.ticker ?? ''
  const logoURI = coin.logoUri
  const coinName = coin.name ?? ''

  return (
    <Paper p='l' border='default' borderRadius='l' shadow='far'>
      {!tokenBalance?.balance ||
      Number(tokenBalance.balance.toString()) === 0 ? (
        <ZeroBalanceState
          ticker={title}
          logoURI={logoURI}
          onBuy={handleBuy}
          onReceive={handleReceive}
          coinName={coinName}
        />
      ) : (
        <HasBalanceState
          ticker={title}
          logoURI={logoURI}
          onBuy={handleBuy}
          onSend={handleSend}
          onReceive={handleReceive}
          mint={mint}
          coinName={coinName}
        />
      )}
    </Paper>
  )
}
