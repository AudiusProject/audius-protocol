import { useArtistCoin, useCurrentUserId } from '@audius/common/api'
import { route } from '@audius/common/utils'
import { useRoute, useNavigation } from '@react-navigation/native'

import { Flex, IconCompose, IconButton } from '@audius/harmony-native'
import { Screen, ScreenContent, ScrollView } from 'app/components/core'

import { BalanceCard } from './components/BalanceCard'
import { CoinInfoCard } from './components/CoinInfoCard'
import { CoinInsightsCard } from './components/CoinInsightsCard'
import { CoinLeaderboardCard } from './components/CoinLeaderboardCard'
import { ExternalWalletsCard } from './components/ExternalWalletsCard'

export const CoinDetailsScreen = () => {
  const { mint } = useRoute().params as { mint: string }
  const navigation = useNavigation()
  const { data: coin } = useArtistCoin(mint)
  const { data: currentUserId } = useCurrentUserId()
  const { ticker, ownerId } = coin ?? {}

  const isOwner = currentUserId === ownerId

  const handleEditPress = () => {
    if (ticker) {
      ;(navigation as any).navigate('EditCoinDetailsScreen', { ticker })
    }
  }

  const topbarRight = isOwner ? (
    <IconButton
      icon={IconCompose}
      color='subdued'
      size='l'
      onPress={handleEditPress}
    />
  ) : undefined

  return (
    <Screen
      url={route.ASSET_DETAIL_PAGE}
      variant='secondary'
      topbarRight={topbarRight}
      title={ticker ? `$${ticker}` : 'Coin Details'}
    >
      <ScreenContent>
        <ScrollView>
          <Flex column gap='m' ph='s' pv='2xl'>
            <BalanceCard mint={mint} />
            <CoinInfoCard mint={mint} />
            <CoinInsightsCard mint={mint} />
            <CoinLeaderboardCard mint={mint} />
            <ExternalWalletsCard mint={mint} />
          </Flex>
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
