import { useCallback } from 'react'

import { useTokenBalance, useArtistCoin } from '@audius/common/api'
import { useFormattedTokenBalance } from '@audius/common/hooks'
import { coinDetailsMessages, walletMessages } from '@audius/common/messages'
import { Image } from 'react-native'

import {
  Paper,
  Flex,
  Text,
  HexagonalIcon,
  Button
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = coinDetailsMessages.balance

type BalanceStateProps = {
  title: string
  logoURI?: string
  onBuy?: () => void
  onReceive?: () => void
  onSend?: () => void
}

const TokenIcon = ({ logoURI }: { logoURI?: string }) => {
  if (!logoURI) return null

  return (
    <HexagonalIcon size={64}>
      <Image
        source={{ uri: logoURI }}
        style={{
          width: 64,
          height: 64
        }}
      />
    </HexagonalIcon>
  )
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
        <TokenIcon logoURI={logoURI} />
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
        <TokenIcon logoURI={logoURI} />
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
  const navigation = useNavigation()
  const { data: coin, isPending: coinsLoading } = useArtistCoin({ mint })
  const { data: tokenBalance } = useTokenBalance({ mint })

  const handleBuy = useCallback(() => {
    navigation.navigate('BuySell', {
      initialTab: 'buy',
      coinTicker: coin?.ticker
    })
  }, [navigation, coin])

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
          onReceive={() => {}}
        />
      ) : (
        <HasBalanceState
          title={title}
          logoURI={logoURI}
          onBuy={handleBuy}
          onSend={() => {}}
          onReceive={() => {}}
          mint={mint}
        />
      )}
    </Paper>
  )
}
