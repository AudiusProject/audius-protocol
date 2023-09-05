import { isMobile } from 'utils/clientUtil'

import DesktopCollectionPage from '../collection-page/components/desktop/CollectionPage'
import MobileCollectionPage from '../collection-page/components/mobile/CollectionPage'

import { CollectiblesPlaylistPageProvider } from './CollectiblesPlaylistPageProvider'

const isMobileClient = isMobile()

export const CollectiblesPlaylistPage = () => {
  const content = isMobileClient ? MobileCollectionPage : DesktopCollectionPage

  return (
    <CollectiblesPlaylistPageProvider>
      {content}
    </CollectiblesPlaylistPageProvider>
  )
}
