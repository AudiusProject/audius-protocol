import React from 'react'
import TrendingPageProvider from './TrendingPageProvider'
import { connect } from 'react-redux'
import { isMobile } from 'utils/clientUtil'
import { AppState } from 'store/types'
import TrendingPageMobileContent from './components/mobile/TrendingPageContent'
import TrendingPageContent from './components/desktop/TrendingPageContent'

interface OwnProps {
  containerRef: React.RefObject<HTMLDivElement>
}

type TrendingPageContentProps = ReturnType<typeof mapStateToProps> & OwnProps

const TrendingPage = ({ containerRef, isMobile }: TrendingPageContentProps) => {
  const content = isMobile ? TrendingPageMobileContent : TrendingPageContent

  return (
    <TrendingPageProvider
      // @ts-ignore
      containerRef={containerRef}
    >
      {content}
    </TrendingPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(TrendingPage)
