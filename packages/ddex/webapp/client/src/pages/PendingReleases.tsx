import { Collection } from 'components/Collection/Collection'
import { Page } from 'pages/Page'

export const PendingReleases = () => {
  return (
    <Page>
      <Collection collection='pending_releases' />
    </Page>
  )
}
