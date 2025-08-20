import { useArtistCoin } from '@audius/common/api'
import { useRoute } from '@react-navigation/native'

import { Flex } from '@audius/harmony-native'
import { Screen, ScreenContent, ScrollView } from 'app/components/core'

import { BalanceCard } from './components/BalanceCard'
import { CoinInfoCard } from './components/CoinInfoCard'
import { CoinInsightsCard } from './components/CoinInsightsCard'
import { CoinLeaderboardCard } from './components/CoinLeaderboardCard'

// TODO: Add External Wallets section

export const CoinDetailsScreen = () => {
  const { mint } = useRoute().params as { mint: string }
  const { data: coin } = useArtistCoin({ mint })
  const { ticker } = coin ?? {}

  return (
    <Screen
      url='/coin-details/:mint'
      variant='secondary'
      title={ticker ?? 'Coin Details'}
    >
      <ScreenContent>
        <ScrollView>
          <Flex column gap='m' ph='s' pv='2xl'>
            <BalanceCard mint={mint} />
            <CoinInfoCard mint={mint} />
            <CoinInsightsCard mint={mint} />
            <CoinLeaderboardCard mint={mint} />
            {/* <ExternalWallets mint={mint} /> */}
          </Flex>
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
