import React from 'react'

import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import TrendingPageProvider from './TrendingPageProvider'
import TrendingPageContent from './components/desktop/TrendingPageContent'
import TrendingPageMobileContent from './components/mobile/TrendingPageContent'

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
