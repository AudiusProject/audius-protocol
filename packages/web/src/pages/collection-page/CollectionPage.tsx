import { CollectionsPageType } from '@audius/common/store'

import { useIsMobile } from 'hooks/useIsMobile'

import CollectionPageProvider from './CollectionPageProvider'
import DesktopCollectionPage from './components/desktop/CollectionPage'
import MobileCollectionPage from './components/mobile/CollectionPage'

type CollectionPageProps = {
  type: CollectionsPageType
}

const CollectionPage = (props: CollectionPageProps) => {
  const { type } = props
  const isMobile = useIsMobile()
  const content = isMobile ? MobileCollectionPage : DesktopCollectionPage

  return (
    <CollectionPageProvider isMobile={isMobile} type={type}>
      {content}
    </CollectionPageProvider>
  )
}

export default CollectionPage
