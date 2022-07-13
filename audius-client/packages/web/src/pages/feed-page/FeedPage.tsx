import { RefObject } from 'react'

import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import FeedPageProvider from './FeedPageProvider'
import FeedPageContent from './components/desktop/FeedPageContent'
import FeedPageMobileContent from './components/mobile/FeedPageContent'

interface OwnProps {
  containerRef: RefObject<HTMLDivElement>
}

type FeedPageContentProps = ReturnType<typeof mapStateToProps> & OwnProps

const FeedPage = ({ containerRef, isMobile }: FeedPageContentProps) => {
  const content = isMobile ? FeedPageMobileContent : FeedPageContent

  return (
    <FeedPageProvider
      // @ts-ignore
      containerRef={containerRef}>
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
