import React from 'react'

import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import HistoryPageProvider from './HistoryPageProvider'
import DesktopHistoryPage from './components/desktop/HistoryPage'
import MobileHistoryPage from './components/mobile/HistoryPage'

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
