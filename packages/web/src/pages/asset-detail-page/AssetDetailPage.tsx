import { useArtistCoinByTicker } from '@audius/common/api'
import { ASSET_DETAIL_PAGE } from '@audius/common/src/utils/route'
import { Flex, LoadingSpinner } from '@audius/harmony'
import { Redirect, useParams } from 'react-router-dom'

import { Header } from 'components/header/desktop/Header'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import Page from 'components/page/Page'
import { useIsMobile } from 'hooks/useIsMobile'
import { BASE_URL } from 'utils/route'

import { useAssetDetailTabs } from './AssetDetailTabs'

type AssetDetailPageContentProps = {
  mint: string
  title: string
}

const DesktopAssetDetailPageContent = ({
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

const MobileAssetDetailPageContent = ({
  mint,
  title
}: AssetDetailPageContentProps) => {
  const { body } = useAssetDetailTabs({ mint })

  return (
    <MobilePageContainer
      title={title}
      canonicalUrl={`${BASE_URL}${ASSET_DETAIL_PAGE}/${title}`}
    >
      <Flex column w='100%' p='l'>
        {body}
      </Flex>
    </MobilePageContainer>
  )
}

export const AssetDetailPage = () => {
  const { ticker } = useParams<{ ticker: string }>()
  const isMobile = useIsMobile()

  const {
    data: coin,
    isPending,
    isSuccess,
    error: coinError
  } = useArtistCoinByTicker({ ticker: `$${ticker}` })

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

  return isMobile ? (
    <MobileAssetDetailPageContent
      mint={coin?.mint ?? ''}
      title={coin?.ticker ?? ''}
    />
  ) : (
    <DesktopAssetDetailPageContent
      mint={coin?.mint ?? ''}
      title={coin?.ticker ?? ''}
    />
  )
}
