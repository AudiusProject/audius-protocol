import { useCallback, useState } from 'react'

import { useArtistCoins } from '@audius/common/api'
import { route } from '@audius/common/utils'

import {
  Box,
  Button,
  Divider,
  Flex,
  IconSearch,
  LoadingSpinner,
  Paper,
  Text,
  TextInput,
  TextInputSize
} from '@audius/harmony-native'
import { Screen, ScreenContent, ScrollView } from 'app/components/core'

import { CoinCard } from '../wallet-screen/components/CoinCard'

const messages = {
  lookingForMore: 'Looking for more?',
  explore:
    "We're gradually expanding support for more artist coins.  For details on launching your own, contact our team.",
  contactUs: 'Contact Us',
  search: 'Search For Coins'
}

export const AllCoinsScreen = () => {
  const { data: artistCoins, isPending: isLoadingCoins } = useArtistCoins()
  const [searchQuery, setSearchQuery] = useState('')

  const handleContactUs = useCallback(() => {
    // Contact support via email with route.AUDIUS_CONTACT_EMAIL_LINK
    // Or open the help center link (route.AUDIUS_HELP_LINK)
  }, [])

  const filteredCoins = artistCoins?.filter((coin) => {
    if (!coin.ticker) return true
    return coin.ticker.toLowerCase().includes(searchQuery.toLowerCase().trim())
  })

  return (
    <Screen url={route.ALL_COINS_PAGE} variant='secondary' title='All Coins'>
      <ScreenContent>
        <ScrollView>
          {isLoadingCoins ? (
            <Flex justifyContent='center' alignItems='center' h='100vh'>
              <LoadingSpinner />
            </Flex>
          ) : (
            <Flex column gap='l' pv='2xl' ph='s'>
              <Paper column borderRadius='xl'>
                <Flex p='xl'>
                  <TextInput
                    label='Search'
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    size={TextInputSize.SMALL}
                    startIcon={IconSearch}
                    placeholder={messages.search}
                  />
                </Flex>
                <Divider />
                {filteredCoins?.map((coin) => (
                  <Box key={coin.mint}>
                    <CoinCard mint={coin.mint} showUserBalance={false} />
                    <Divider />
                  </Box>
                ))}
              </Paper>
              <Paper column borderRadius='xl' p='xl' gap='l'>
                <Text textAlign='center' variant='heading' size='s'>
                  {messages.lookingForMore}
                </Text>
                <Text textAlign='center' variant='body' size='m'>
                  {messages.explore}
                </Text>
                <Button
                  variant='secondary'
                  size='small'
                  onPress={handleContactUs}
                >
                  {messages.contactUs}
                </Button>
              </Paper>
            </Flex>
          )}
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
