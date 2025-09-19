import { useArtistCoinByTicker } from '@audius/common/api'
import { Flex, LoadingSpinner } from '@audius/harmony'
import { Redirect, useParams } from 'react-router-dom'

import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import { useAssetDetailTabs } from './AssetDetailTabs'

export const AssetDetailPage = () => {
  const { ticker } = useParams<{ ticker: string }>()

  const {
    data: coin,
    isPending,
    isSuccess,
    error: coinError
  } = useArtistCoinByTicker({ ticker: ticker })

  if (!ticker) {
    return <Redirect to='/wallet' />
  }

  if (isPending) {
    return (
      <Flex
        justifyContent='center'
        alignItems='center'
        css={{ minHeight: '100vh' }}
      >
        <LoadingSpinner />
      </Flex>
    )
  }

  if (coinError || (isSuccess && !coin)) {
    return <Redirect to='/wallet' />
  }

  return <AssetDetailPageContent mint={coin?.mint} title={coin?.ticker} />
}

type AssetDetailPageContentProps = {
  mint: string
  title: string
}

const AssetDetailPageContent = ({
  mint,
  title
}: AssetDetailPageContentProps) => {
  const { tabs, body } = useAssetDetailTabs({ mint })

  const header = (
    <Header primary={title} showBackButton={true} bottomBar={tabs} />
  )

  return (
    <Page title={title} header={header}>
      {body}
    </Page>
  )
}
