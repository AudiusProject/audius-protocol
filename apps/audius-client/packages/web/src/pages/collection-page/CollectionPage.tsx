import { SmartCollection, CollectionsPageType } from '@audius/common'

import { isMobile } from 'utils/clientUtil'

import CollectionPageProvider from './CollectionPageProvider'
import DesktopCollectionPage from './components/desktop/CollectionPage'
import MobileCollectionPage from './components/mobile/CollectionPage'

type CollectionPageProps = {
  type: CollectionsPageType
  smartCollection?: SmartCollection
}

const isMobileClient = isMobile()

const CollectionPage = (props: CollectionPageProps) => {
  const { type, smartCollection } = props
  const content = isMobileClient ? MobileCollectionPage : DesktopCollectionPage

  return (
    <CollectionPageProvider
      isMobile={isMobileClient}
      smartCollection={smartCollection}
      type={type}
    >
      {content}
    </CollectionPageProvider>
  )
}

export default CollectionPage
