import React from 'react'

import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import ExploreCollectionsPageProvider from './ExploreCollectionsPageProvider'
import DesktopCollectionsPage from './components/desktop/CollectionsPage'
import MobileCollectionsPage from './components/mobile/CollectionsPage'
import { ExploreCollectionsVariant } from './store/types'

type OwnProps = {
  variant: ExploreCollectionsVariant
}

type ExploreCollectionsPageContentProps = ReturnType<typeof mapStateToProps> &
  OwnProps
const ExploreCollectionsPage = ({
  variant,
  isMobile
}: ExploreCollectionsPageContentProps) => {
  const content = isMobile ? MobileCollectionsPage : DesktopCollectionsPage

  return (
    <ExploreCollectionsPageProvider isMobile={isMobile} variant={variant}>
      {content}
    </ExploreCollectionsPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(ExploreCollectionsPage)
