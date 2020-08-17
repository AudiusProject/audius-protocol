import React from 'react'
import HistoryPageProvider from './HistoryPageProvider'
import { connect } from 'react-redux'
import { isMobile } from 'utils/clientUtil'
import { AppState } from 'store/types'

import MobileHistoryPage from './components/mobile/HistoryPage'
import DesktopHistoryPage from './components/desktop/HistoryPage'

type HistoryPageProps = ReturnType<typeof mapStateToProps>
const HistoryPage = ({ isMobile }: HistoryPageProps) => {
  const content = isMobile ? MobileHistoryPage : DesktopHistoryPage

  return <HistoryPageProvider>{content}</HistoryPageProvider>
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(HistoryPage)
