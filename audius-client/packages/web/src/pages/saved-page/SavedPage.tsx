import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import SavedPageProvider from './SavedPageProvider'
import DesktopSavedPage from './components/desktop/SavedPage'
import MobileSavedPage from './components/mobile/SavedPage'

type OwnProps = {}

type SavedPageProps = ReturnType<typeof mapStateToProps> & OwnProps
const SavedPage = ({ isMobile }: SavedPageProps) => {
  const content = isMobile ? MobileSavedPage : DesktopSavedPage

  return <SavedPageProvider>{content}</SavedPageProvider>
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(SavedPage)
