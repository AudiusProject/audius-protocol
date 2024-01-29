import { RefObject } from 'react'

import { useIsMobile } from 'hooks/useIsMobile'

import FeedPageProvider from './FeedPageProvider'
import FeedPageContent from './components/desktop/FeedPageContent'
import FeedPageMobileContent from './components/mobile/FeedPageContent'

type FeedPageContentProps = {
  containerRef: RefObject<HTMLDivElement>
}

const FeedPage = ({ containerRef }: FeedPageContentProps) => {
  const isMobile = useIsMobile()
  const content = isMobile ? FeedPageMobileContent : FeedPageContent

  return (
    <FeedPageProvider containerRef={containerRef}>{content}</FeedPageProvider>
  )
}

export default FeedPage
