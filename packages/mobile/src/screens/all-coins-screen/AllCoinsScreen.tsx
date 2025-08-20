import { useArtistCoins } from '@audius/common/api'

import {
  Box,
  Divider,
  Flex,
  LoadingSpinner,
  Paper
} from '@audius/harmony-native'
import { Screen, ScreenContent, ScrollView } from 'app/components/core'

import { CoinCard } from '../wallet-screen/components/CoinCard'

// TODO: Add the search bar
// TODO: Add the 'looking for more' section

export const AllCoinsScreen = () => {
  const { data: artistCoins, isPending: isLoadingCoins } = useArtistCoins()

  return (
    <Screen url='/wallet/coins' variant='secondary' title='All Coins'>
      <ScreenContent>
        <ScrollView>
          {isLoadingCoins ? (
            <Flex justifyContent='center' alignItems='center' h='100vh'>
              <LoadingSpinner />
            </Flex>
          ) : (
            <Flex column gap='l' pv='2xl' ph='s'>
              <Paper column borderRadius='xl'>
                {artistCoins?.map((coin) => (
                  <Box key={coin.mint}>
                    <CoinCard mint={coin.mint} showUserBalance={false} />
                    <Divider />
                  </Box>
                ))}
              </Paper>
            </Flex>
          )}
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
