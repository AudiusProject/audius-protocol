import { route } from '@audius/common/utils'

import { Header } from 'components/header/desktop/Header'
import { Page } from 'components/page/Page'
import { BASE_URL } from 'utils/route'
import { createSeoDescription } from 'utils/seo'

const { EXPLORE_PREMIUM_TRACKS_PAGE } = route

const messages = {
  pageTitle: 'Premium Tracks',
  pageDescription: createSeoDescription(
    'Explore premium music available to purchase.'
  )
}

type PremiumTracksPageContentProps = {
  lineup: JSX.Element
}

export const PremiumTracksPageContent = ({
  lineup
}: PremiumTracksPageContentProps) => {
  const header = <Header primary={messages.pageTitle} />
  return (
    <Page
      title={messages.pageTitle}
      description={messages.pageDescription}
      canonicalUrl={`${BASE_URL}${EXPLORE_PREMIUM_TRACKS_PAGE}`}
      size='large'
      header={header}
    >
      {lineup}
    </Page>
  )
}
