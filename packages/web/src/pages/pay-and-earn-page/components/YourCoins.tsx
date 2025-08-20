import { Fragment, useCallback, useContext } from 'react'

import {
  useArtistCoins,
  useCurrentUserId,
  UserCoin,
  useUserCoins
} from '@audius/common/api'
import {
  useFeatureFlag,
  useFormattedTokenBalance,
  useIsManagedAccount
} from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import {
  CoinPairItem,
  useBuySellModal,
  useGroupCoinPairs
} from '@audius/common/store'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconCaretRight,
  Paper,
  Text,
  useMedia,
  useTheme
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'
import { roundedHexClipPath } from '~harmony/icons/SVGDefs'

import Skeleton from 'components/skeleton/Skeleton'
import { ToastContext } from 'components/toast/ToastContext'

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
          <Skeleton
            width='64px'
            height='64px'
            css={{
              clipPath: `url(#${roundedHexClipPath})`
            }}
          />
          <Flex direction='column' gap='xs'>
            <Skeleton width='200px' height='36px' />
            <Skeleton width='100px' height='24px' />
          </Flex>
        </Flex>
      </Flex>
      <Divider />
      <Flex gap='m' p='xl' flex={1} direction='column'>
        <Skeleton width='180px' height='28px' />
        <Skeleton width='300px' height='22px' />
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

const YourCoinsHeader = ({ isLoading }: { isLoading: boolean }) => {
  const { onOpen: openBuySellModal } = useBuySellModal()
  const isManagedAccount = useIsManagedAccount()
  const { toast } = useContext(ToastContext)
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

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
      {isWalletUIBuySellEnabled && !isLoading ? (
        <Button variant='secondary' size='small' onClick={handleBuySellClick}>
          {messages.buySell}
        </Button>
      ) : null}
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

  const { data: coinsData, isPending: coinsDataLoading } = useArtistCoins({
    mint: [coin.mint]
  })
  const coinData = coinsData?.[0] ?? null

  const isLoading =
    isTokenBalanceLoading || isTokenPriceLoading || coinsDataLoading

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

const FindMoreCoins = ({ css }: { css?: any }) => {
  const { color, spacing } = useTheme()
  const { isMobile } = useMedia()
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    dispatch(push('/wallet/coins'))
  }, [dispatch])

  return (
    <Flex
      h='100%'
      p={isMobile ? spacing.l : spacing.xl}
      css={{
        cursor: 'pointer',
        '&:hover': { backgroundColor: color.background.surface2 },
        ...css
      }}
      onClick={handleClick}
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
  )
}

export const YourCoins = () => {
  const { data: currentUserId } = useCurrentUserId()

  const { data: artistCoins, isPending: isLoadingCoins } = useUserCoins({
    userId: currentUserId
  })

  const { isMobile, isTablet } = useMedia()
  const coinPairs = useGroupCoinPairs(artistCoins, isMobile || isTablet)

  return (
    <Paper column shadow='far' borderRadius='l' css={{ overflow: 'hidden' }}>
      <YourCoinsHeader isLoading={isLoadingCoins} />
      <Flex column>
        {isLoadingCoins || !currentUserId ? <YourCoinsSkeleton /> : null}
        {coinPairs.map((pair, rowIndex) => (
          <Fragment key={`row-${rowIndex}`}>
            <Flex alignItems='stretch'>
              {pair.map((item: CoinPairItem, colIndex) => (
                <Fragment key={item === 'find-more' ? 'find-more' : item.mint}>
                  {colIndex > 0 && <Divider orientation='vertical' />}
                  <Box flex={1}>
                    {item === 'find-more' ? (
                      <FindMoreCoins />
                    ) : (
                      <CoinCardWithBalance coin={item} />
                    )}
                  </Box>
                </Fragment>
              ))}
            </Flex>
            {rowIndex < coinPairs.length - 1 && <Divider />}
          </Fragment>
        ))}
      </Flex>
    </Paper>
  )
}
