import React, { ReactNode } from 'react'

import { connect } from 'react-redux'

import SearchPageProvider from 'containers/search-page/SearchPageProvider'
import DesktopSearchPageContent from 'containers/search-page/components/desktop/SearchPageContent'
import MobileSearchPageContent from 'containers/search-page/components/mobile/SearchPageContent'
import Client from 'models/Client'
import { AppState } from 'store/types'
import { getClient } from 'utils/clientUtil'

type ownProps = {
  scrollToTop: () => void
  containerRef: ReactNode
}

type SearchPageProps = ownProps & ReturnType<typeof mapStateToProps>

const SearchPage = ({ scrollToTop, containerRef }: SearchPageProps) => {
  const client = getClient()
  const isMobile = client === Client.MOBILE
  const content = isMobile ? MobileSearchPageContent : DesktopSearchPageContent

  return (
    <SearchPageProvider
      scrollToTop={scrollToTop}
      containerRef={containerRef}
      isMobile={isMobile}
    >
      {content}
    </SearchPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {}
}

export default connect(mapStateToProps)(SearchPage)
