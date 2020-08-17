import React from 'react'
import DiscoverPageProvider from './DiscoverPageProvider'
import { connect } from 'react-redux'
import { isMobile } from 'utils/clientUtil'
import { AppState } from 'store/types'
import TrendingPageMobileContent from './components/mobile/TrendingPageContent'
import FeedPageMobileContent from './components/mobile/FeedPageContent'
import TrendingPageContent from './components/desktop/TrendingPageContent'
import FeedPageContent from './components/desktop/FeedPageContent'

interface OwnProps {
  feedIsMain?: boolean
  containerRef: React.RefObject<HTMLDivElement>
}

type DiscoverPageContentProps = ReturnType<typeof mapStateToProps> & OwnProps

const DiscoverPage = ({
  feedIsMain,
  containerRef,
  isMobile
}: DiscoverPageContentProps) => {
  let content
  if (isMobile && feedIsMain) content = FeedPageMobileContent
  else if (isMobile && !feedIsMain) content = TrendingPageMobileContent
  else if (!isMobile && feedIsMain) content = FeedPageContent
  else content = TrendingPageContent

  return (
    <DiscoverPageProvider
      // @ts-ignore
      feedIsMain={feedIsMain}
      containerRef={containerRef}
    >
      {content}
    </DiscoverPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(DiscoverPage)
