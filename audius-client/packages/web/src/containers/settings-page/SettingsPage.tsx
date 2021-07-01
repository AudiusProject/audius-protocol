import React from 'react'

import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import SettingsPageProvider from './SettingsPageProvider'
import DesktopSettingsPage from './components/desktop/SettingsPage'
import MobileSettingsPage, { SubPage } from './components/mobile/SettingsPage'

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
