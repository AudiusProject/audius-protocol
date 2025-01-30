import { useIsMobile } from 'hooks/useIsMobile'

import HistoryPageProvider from './HistoryPageProvider'
import DesktopHistoryPage from './components/desktop/HistoryPage'
import MobileHistoryPage from './components/mobile/HistoryPage'

const messages = {
  title: 'History',
  description: 'View your listening history'
}

const HistoryPage = () => {
  // const isMobile = useIsMobile()
  return <DesktopHistoryPage {...messages} />
}

export default HistoryPage
