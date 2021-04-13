import React from 'react'
import FeedPageProvider from './FeedPageProvider'
import { connect } from 'react-redux'
import { isMobile } from 'utils/clientUtil'
import { AppState } from 'store/types'
import FeedPageMobileContent from './components/mobile/FeedPageContent'
import FeedPageContent from './components/desktop/FeedPageContent'

interface OwnProps {
  containerRef: React.RefObject<HTMLDivElement>
}

type FeedPageContentProps = ReturnType<typeof mapStateToProps> & OwnProps

const FeedPage = ({ containerRef, isMobile }: FeedPageContentProps) => {
  const content = isMobile ? FeedPageMobileContent : FeedPageContent

  return (
    <FeedPageProvider
      // @ts-ignore
      containerRef={containerRef}
    >
      {content}
    </FeedPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(FeedPage)
