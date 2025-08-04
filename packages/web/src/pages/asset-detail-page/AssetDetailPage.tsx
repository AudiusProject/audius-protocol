import { Redirect, useParams } from 'react-router-dom'

import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import WalletModal from 'pages/audio-page/WalletModal'

import { useAssetDetailTabs } from './AssetDetailTabs'
import { ASSET_ROUTES } from './constants'
import { AssetName } from './types'

export const AssetDetailPage = () => {
  const { slug } = useParams<{ slug: string }>()

  if (!slug || !(slug in ASSET_ROUTES)) {
    return <Redirect to='/wallet' />
  }

  // At this point, we know slug is a valid key
  const typedSlug = slug as AssetName
  const routeConfig = ASSET_ROUTES[typedSlug]
  const title = routeConfig.title

  return <AssetDetailPageContent assetName={typedSlug} title={title} />
}

type AssetDetailPageContentProps = {
  assetName: AssetName
  title: string
}

const AssetDetailPageContent = ({
  assetName,
  title
}: AssetDetailPageContentProps) => {
  const { tabs, body } = useAssetDetailTabs({ assetName })

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
