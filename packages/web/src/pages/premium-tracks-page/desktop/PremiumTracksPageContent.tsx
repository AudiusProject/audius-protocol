import DesktopHeader from 'components/header/desktop/Header'
import { Page } from 'components/page/Page'
import { BASE_URL, EXPLORE_PREMIUM_TRACKS_PAGE } from 'utils/route'
import { createSeoDescription } from 'utils/seo'

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
  const header = <DesktopHeader primary={messages.pageTitle} variant='main' />
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
