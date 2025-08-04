import { Fragment, useCallback, useContext } from 'react'

import {
  useUserCoins,
  useCurrentUserId,
  useArtistCoins,
  UserCoin
} from '@audius/common/api'
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
  Paper,
  Text,
  useMedia,
  useTheme
} from '@audius/harmony'
import { encodeHashId } from '@audius/sdk'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import Skeleton from 'components/skeleton/Skeleton'
import { ToastContext } from 'components/toast/ToastContext'
import { env } from 'services/env'

import { AudioCoinCard } from './AudioCoinCard'
import { CoinCard } from './CoinCard'

const YourCoinsSkeleton = () => {
  const { spacing } = useTheme()
  const { isMobile } = useMedia()

  return (
    <Paper column shadow='far' borderRadius='l' css={{ overflow: 'hidden' }}>
      <Flex
        alignItems='center'
        justifyContent='space-between'
        p={isMobile ? spacing.l : undefined}
        alignSelf='stretch'
      >
        <Flex alignItems='center' gap='m' p='xl' flex={1}>
          <Skeleton width='64px' height='64px' />
          <Flex direction='column' gap='xs'>
            <Skeleton width='120px' height='24px' />
            <Skeleton width='80px' height='16px' />
          </Flex>
        </Flex>
      </Flex>
    </Paper>
  )
}

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

const CoinCardWithBalance = ({ coin }: { coin: UserCoin }) => {
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

  const { data: coinsData } = useArtistCoins({ mint: [coin.mint] })
  const coinData = coinsData?.[0] ?? null

  const isLoading = isTokenBalanceLoading || isTokenPriceLoading

  if (coin.mint === env.WAUDIO_MINT_ADDRESS)
    return <AudioCoinCard onClick={() => handleCoinClick(coin.mint)} />

  return (
    <CoinCard
      icon={coinData?.logoUri}
      symbol={tokenSymbol ?? ''}
      balance={tokenBalanceFormatted || ''}
      dollarValue={tokenDollarValue || ''}
      loading={isLoading}
      onClick={() => handleCoinClick(coin.mint)}
    />
  )
}

export const YourCoins = () => {
  const { spacing } = useTheme()
  const { isMobile } = useMedia()
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

  const { data: currentUserId } = useCurrentUserId()
  const userIdString = currentUserId ? encodeHashId(currentUserId) : ''

  const { data: artistCoins, isPending: isLoadingCoins } = useUserCoins({
    userId: userIdString || ''
  })

  if (isLoadingCoins || !userIdString) {
    return <YourCoinsSkeleton />
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
    </Paper>
  )
}
