import { useArtistCoin } from '@audius/common/api'
import { Flex, LoadingSpinner } from '@audius/harmony'
import { Redirect, useParams } from 'react-router-dom'

import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import WalletModal from 'pages/audio-page/WalletModal'

import { useAssetDetailTabs } from './AssetDetailTabs'

export const AssetDetailPage = () => {
  const { mint } = useParams<{ mint: string }>()

  const {
    data: coin,
    isLoading: coinLoading,
    error: coinError
  } = useArtistCoin({ mint: mint || '' })

  if (!mint) {
    return <Redirect to='/wallet' />
  }

  if (coinLoading) {
    return (
      <Flex justifyContent='center' alignItems='center' h='100vh'>
        <LoadingSpinner />
      </Flex>
    )
  }

  if (coinError || !coin) {
    return <Redirect to='/wallet' />
  }

  return <AssetDetailPageContent mint={coin.mint} title={coin.ticker ?? ''} />
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
      <WalletModal />
      {body}
    </Page>
  )
}
