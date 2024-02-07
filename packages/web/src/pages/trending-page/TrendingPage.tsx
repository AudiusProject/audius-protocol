import { RefObject } from 'react'

import { useIsMobile } from 'hooks/useIsMobile'

import TrendingPageProvider from './TrendingPageProvider'
import TrendingPageContent from './components/desktop/TrendingPageContent'
import TrendingPageMobileContent from './components/mobile/TrendingPageContent'

interface TrendingPageContentProps {
  containerRef: RefObject<HTMLDivElement>
}

const TrendingPage = ({ containerRef }: TrendingPageContentProps) => {
  const isMobile = useIsMobile()
  const content = isMobile ? TrendingPageMobileContent : TrendingPageContent

  return (
    <TrendingPageProvider containerRef={containerRef}>
      {content}
    </TrendingPageProvider>
  )
}

export default TrendingPage
