import { useCallback, useContext, Fragment } from 'react'

import { env } from 'process'

import { useArtistCoins } from '@audius/common/api'
import {
  useFeatureFlag,
  useFormattedTokenBalance,
  useIsManagedAccount
} from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import { useBuySellModal } from '@audius/common/store'
import {
  Button,
  Divider,
  Flex,
  IconCaretRight,
  Paper,
  Text,
  useMedia,
  useTheme
} from '@audius/harmony'
import { Coin } from '@audius/sdk'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { ToastContext } from 'components/toast/ToastContext'

import { AudioCoinCard } from './AudioCoinCard'
import { CoinCard } from './CoinCard'

const messages = {
  ...buySellMessages,
  managedAccount: "You can't do that as a managed user",
  findMoreCoins: 'Find More Coins',
  exploreArtistCoins: 'Explore available artist coins on Audius.',
  bonkTicker: '$BONK'
}

const YourCoinsHeader = () => {
  const { onOpen: openBuySellModal } = useBuySellModal()
  const isManagedAccount = useIsManagedAccount()
  const { toast } = useContext(ToastContext)

  const handleBuySellClick = useCallback(() => {
    if (isManagedAccount) {
      toast(messages.managedAccount)
    } else {
      openBuySellModal()
    }
  }, [isManagedAccount, openBuySellModal, toast])

  return (
    <Flex
      alignItems='center'
      justifyContent='space-between'
      p='l'
      borderBottom='default'
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

const CoinCardWithBalance = ({ coin }: { coin: Coin }) => {
  const dispatch = useDispatch()

  const tokenSymbol = coin.ticker

  const handleCoinClick = useCallback(
    (mint: string) => {
      dispatch(push(`/wallet/${mint}`))
    },
    [dispatch]
  )

  const {
    tokenBalanceFormatted,
    tokenDollarValue,
    isTokenBalanceLoading,
    isTokenPriceLoading
  } = useFormattedTokenBalance(coin.mint)

  const isLoading = isTokenBalanceLoading || isTokenPriceLoading

  if (coin.mint === env.WAUDIO_MINT_ADDRESS) return <AudioCoinCard />

  return (
    <CoinCard
      icon={coin.tokenInfo.logoURI}
      symbol={tokenSymbol ?? ''}
      balance={tokenBalanceFormatted || ''}
      dollarValue={tokenDollarValue || ''}
      loading={isLoading}
      onClick={() => handleCoinClick(coin.mint)}
    />
  )
}

export const YourCoins = () => {
  const { color, spacing } = useTheme()
  const { isMobile } = useMedia()
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

  const { data: artistCoins, isPending: isLoadingCoins } = useArtistCoins()

  if (isLoadingCoins) {
    return null
  }

  return (
    <Paper column shadow='far' borderRadius='l' css={{ overflow: 'hidden' }}>
      {isWalletUIBuySellEnabled ? <YourCoinsHeader /> : null}
      <Flex
        alignItems='center'
        justifyContent='space-between'
        p={isMobile ? spacing.l : undefined}
        alignSelf='stretch'
      >
        {artistCoins?.map((coin, index) => {
          if (coin.ticker === 'USDC') return null
          return (
            <Fragment key={coin.mint}>
              {index > 0 && <Divider orientation='vertical' />}
              <CoinCardWithBalance coin={coin} />
            </Fragment>
          )
        })}
      </Flex>
      <Flex
        p={isMobile ? spacing.l : spacing.xl}
        css={{
          cursor: 'pointer',
          '&:hover': { backgroundColor: color.background.surface2 }
        }}
      >
        <Flex flex={1} alignItems='center' justifyContent='space-between'>
          <Flex column gap='xs'>
            <Text variant='heading' size='m' color='default'>
              {messages.findMoreCoins}
            </Text>
            <Text color='subdued'>{messages.exploreArtistCoins}</Text>
          </Flex>
          <IconCaretRight size='l' color='subdued' />
        </Flex>
      </Flex>
    </Paper>
  )
}
