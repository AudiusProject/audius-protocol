import { useIsMobile } from 'hooks/useIsMobile'

import SavedPageProvider from './SavedPageProvider'
import DesktopSavedPage from './components/desktop/SavedPage'
import MobileSavedPage from './components/mobile/SavedPage'

const SavedPage = () => {
  const isMobile = useIsMobile()
  const content = isMobile ? MobileSavedPage : DesktopSavedPage

  return <SavedPageProvider>{content}</SavedPageProvider>
}

export default SavedPage
