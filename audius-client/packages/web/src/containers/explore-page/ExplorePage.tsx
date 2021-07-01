import React from 'react'

import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import ExplorePageProvider from './ExplorePageProvider'
import DesktopExplorePage from './components/desktop/ExplorePage'
import MobileExplorePage from './components/mobile/ExplorePage'

type OwnProps = {}

type ExplorePageContentProps = ReturnType<typeof mapStateToProps> & OwnProps
const ExplorePage = ({ isMobile }: ExplorePageContentProps) => {
  const content = isMobile ? MobileExplorePage : DesktopExplorePage

  return <ExplorePageProvider>{content}</ExplorePageProvider>
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(ExplorePage)
