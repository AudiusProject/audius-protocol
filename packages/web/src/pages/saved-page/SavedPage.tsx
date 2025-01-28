import { useIsMobile } from 'hooks/useIsMobile'

import DesktopSavedPage from './components/desktop/SavedPage'
import MobileSavedPage from './components/mobile/SavedPage'

const messages = {
  title: 'Library',
  description: "View tracks that you've favorited"
}

const SavedPage = () => {
  const isMobile = useIsMobile()

  const commonProps = {
    title: messages.title,
    description: messages.description
  }

  return isMobile ? (
    <MobileSavedPage {...commonProps} />
  ) : (
    <DesktopSavedPage {...commonProps} />
  )
}

export default SavedPage
