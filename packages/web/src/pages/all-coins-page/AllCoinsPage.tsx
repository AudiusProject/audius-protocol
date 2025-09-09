import { useState } from 'react'

import { useArtistCoins } from '@audius/common/api'
import { useFormattedTokenBalance } from '@audius/common/hooks'
import {
  Flex,
  IconSearch,
  LoadingSpinner,
  Paper,
  TextInput
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import { ArtistCoinRow } from './components/ArtistCoinRow'

const ArtistCoinRowWithData = ({ coin }: { coin: any }) => {
  const dispatch = useDispatch()

  const { tokenDollarValue, isTokenPriceLoading } = useFormattedTokenBalance(
    coin.mint
  )

  const handleCoinClick = () => {
    dispatch(push(`/wallet/${coin.ticker}`))
  }

  const isLoading = isTokenPriceLoading

  return (
    <ArtistCoinRow
      icon={coin.logoUri ?? ''}
      symbol={coin.ticker ?? ''}
      dollarValue={tokenDollarValue || ''}
      loading={isLoading}
      onClick={handleCoinClick}
      mint={coin.mint}
    />
  )
}

const messages = {
  title: 'All Coins',
  search: 'Search for Coins'
}

export const AllCoinsPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: artistCoins, isPending: isLoadingCoins } = useArtistCoins()

  if (isLoadingCoins) {
    return (
      <Flex justifyContent='center' alignItems='center' h='100vh'>
        <LoadingSpinner />
      </Flex>
    )
  }

  const filteredCoins =
    artistCoins?.filter((coin) =>
      coin.ticker?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

  const header = <Header primary={messages.title} showBackButton={true} />

  return (
    <Page title={messages.title} header={header}>
      <Paper borderRadius='xl' backgroundColor='white' shadow='mid' w='100%'>
        <Flex column gap='xl' w='100%'>
          <Flex p='l' pb='none'>
            <TextInput
              label={messages.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startIcon={IconSearch}
            />
          </Flex>
          <Flex column>
            {filteredCoins.map((coin) => (
              <ArtistCoinRowWithData key={coin.mint} coin={coin} />
            ))}
          </Flex>
        </Flex>
      </Paper>
    </Page>
  )
}
