import React from 'react'

import { connect, useSelector } from 'react-redux'

import { isRemoteConfigLoaded } from 'containers/remote-config/selectors'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import ExplorePageProvider from './ExplorePageProvider'
import DesktopExplorePage from './components/desktop/ExplorePage'
import MobileExplorePage from './components/mobile/ExplorePage'

type OwnProps = {}

type ExplorePageContentProps = ReturnType<typeof mapStateToProps> & OwnProps
const ExplorePage = ({ isMobile }: ExplorePageContentProps) => {
  const content = isMobile ? MobileExplorePage : DesktopExplorePage

  // Do not render content until remote config is loaded so
  // that tiling layout does not change.
  // TODO: Remove this when Remixables feature flag is removed
  const remoteConfigLoaded = useSelector(isRemoteConfigLoaded)
  if (!remoteConfigLoaded) return null

  return <ExplorePageProvider>{content}</ExplorePageProvider>
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(ExplorePage)
