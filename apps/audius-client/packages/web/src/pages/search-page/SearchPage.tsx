import { ReactNode } from 'react'

import { connect } from 'react-redux'

import Client from 'common/models/Client'
import SearchPageProvider from 'pages/search-page/SearchPageProvider'
import DesktopSearchPageContent from 'pages/search-page/components/desktop/SearchPageContent'
import MobileSearchPageContent from 'pages/search-page/components/mobile/SearchPageContent'
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
      isMobile={isMobile}>
      {content}
    </SearchPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {}
}

export default connect(mapStateToProps)(SearchPage)
