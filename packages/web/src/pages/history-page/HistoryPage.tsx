import { useIsMobile } from 'hooks/useIsMobile'

import DesktopHistoryPage from './components/desktop/HistoryPage'
import MobileHistoryPage from './components/mobile/HistoryPage'

const messages = {
  title: 'History',
  description: 'View your listening history'
}

const HistoryPage = () => {
  const isMobile = useIsMobile()
  return isMobile ? (
    <MobileHistoryPage {...messages} />
  ) : (
    <DesktopHistoryPage {...messages} />
  )
}

export default HistoryPage
