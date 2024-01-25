import { useIsMobile } from 'hooks/useIsMobile'

import HistoryPageProvider from './HistoryPageProvider'
import DesktopHistoryPage from './components/desktop/HistoryPage'
import MobileHistoryPage from './components/mobile/HistoryPage'

const HistoryPage = () => {
  const isMobile = useIsMobile()
  const content = isMobile ? MobileHistoryPage : DesktopHistoryPage

  return <HistoryPageProvider>{content}</HistoryPageProvider>
}

export default HistoryPage
