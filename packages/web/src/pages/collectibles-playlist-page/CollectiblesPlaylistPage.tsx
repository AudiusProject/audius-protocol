import { useIsMobile } from 'utils/clientUtil'

import DesktopCollectionPage from '../collection-page/components/desktop/CollectionPage'
import MobileCollectionPage from '../collection-page/components/mobile/CollectionPage'

import { CollectiblesPlaylistPageProvider } from './CollectiblesPlaylistPageProvider'

export const CollectiblesPlaylistPage = () => {
  const isMobile = useIsMobile()
  const content = isMobile ? MobileCollectionPage : DesktopCollectionPage

  return (
    <CollectiblesPlaylistPageProvider>
      {content}
    </CollectiblesPlaylistPageProvider>
  )
}
