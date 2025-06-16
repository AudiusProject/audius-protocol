import { useIsMobile } from 'hooks/useIsMobile'

import LibraryPageProvider from './LibraryPageProvider'
import DesktopLibraryPage from './components/desktop/LibraryPage'
import MobileLibraryPage from './components/mobile/LibraryPage'

const LibraryPage = () => {
  const isMobile = useIsMobile()
  const content = isMobile ? MobileLibraryPage : DesktopLibraryPage

  return <LibraryPageProvider>{content}</LibraryPageProvider>
}

export default LibraryPage
