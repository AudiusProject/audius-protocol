import { useArtistCoins } from '@audius/common/api'
import { useFormattedTokenBalance } from '@audius/common/hooks'
import { Box, Flex, LoadingSpinner } from '@audius/harmony'
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

  const handleCoinClick = (mint: string) => {
    dispatch(push(`/wallet/${mint}`))
  }

  const isLoading = isTokenPriceLoading

  return (
    <ArtistCoinRow
      icon={coin.logoUri ?? ''}
      symbol={coin.ticker ?? ''}
      dollarValue={tokenDollarValue || ''}
      loading={isLoading}
      onClick={() => handleCoinClick(coin.mint)}
      mint={coin.mint}
    />
  )
}

const messages = {
  title: 'All Coins'
}

export const AllCoinsPage = () => {
  const { data: artistCoins, isPending: isLoadingCoins } = useArtistCoins()

  if (isLoadingCoins) {
    return (
      <Flex justifyContent='center' alignItems='center' h='100vh'>
        <LoadingSpinner />
      </Flex>
    )
  }

  const header = <Header primary={messages.title} showBackButton={true} />

  return (
    <Page title={messages.title} header={header}>
      <Box p='l'>
        <Flex column gap='s'>
          {artistCoins?.map((coin) => (
            <Flex key={coin.mint}>
              <ArtistCoinRowWithData coin={coin} />
            </Flex>
          ))}
        </Flex>
      </Box>
    </Page>
  )
}
