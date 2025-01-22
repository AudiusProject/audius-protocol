import { RefObject } from 'react'

import { useCurrentUserId, useFeed } from '@audius/common/src/api'

import { useIsMobile } from 'hooks/useIsMobile'

import FeedPageProvider from './FeedPageProvider'
import FeedPageContent from './components/desktop/FeedPageContent'
import FeedPageMobileContent from './components/mobile/FeedPageContent'

type FeedPageContentProps = {
  containerRef: RefObject<HTMLDivElement>
}

const FeedPage = ({ containerRef }: FeedPageContentProps) => {
  const isMobile = useIsMobile()
  const { data: currentUserId } = useCurrentUserId()
  const content = isMobile ? FeedPageMobileContent : FeedPageContent

  const queryResults = useFeed({
    userId: currentUserId
  })
  console.log({ queryResults, currentUserId })

  return (
    <FeedPageProvider containerRef={containerRef}>{content}</FeedPageProvider>
  )
}

export default FeedPage
