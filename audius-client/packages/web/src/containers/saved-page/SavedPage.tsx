import React from 'react'
import SavedPageProvider from './SavedPageProvider'
import { connect } from 'react-redux'
import { isMobile } from 'utils/clientUtil'
import { AppState } from 'store/types'

import MobileSavedPage from './components/mobile/SavedPage'
import DesktopSavedPage from './components/desktop/SavedPage'

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
