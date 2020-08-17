import React from 'react'
import SettingsPageProvider from './SettingsPageProvider'
import { connect } from 'react-redux'
import { isMobile } from 'utils/clientUtil'
import { AppState } from 'store/types'

import MobileSettingsPage, { SubPage } from './components/mobile/SettingsPage'
import DesktopSettingsPage from './components/desktop/SettingsPage'

type OwnProps = {
  containerRef: React.RefObject<HTMLDivElement>
  subPage?: SubPage
}

type SettingsPageProps = ReturnType<typeof mapStateToProps> & OwnProps
const SettingsPage = ({ isMobile, subPage }: SettingsPageProps) => {
  const content = isMobile ? MobileSettingsPage : DesktopSettingsPage

  return (
    <SettingsPageProvider subPage={subPage}>{content}</SettingsPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(SettingsPage)
