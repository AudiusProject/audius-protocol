import { RefObject, useEffect } from 'react'

import { useLocation } from 'react-router-dom'
import { useNavigationType } from 'react-router-dom-v5-compat'

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

  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP') {
      const savedScrollPosition = sessionStorage.getItem(
        `scrollPosition-${location.pathname}`
      )

      console.log('POP', savedScrollPosition)
      if (savedScrollPosition !== null) {
        window.scrollTo(0, parseInt(savedScrollPosition, 10))
      }
    } else {
      window.scrollTo(0, 0) // Reset scroll for new pages
    }
  }, [location.pathname, navigationType])

  useEffect(() => {
    const handleScroll = () => {
      console.log('SCROLL', window.scrollY)
      sessionStorage.setItem(
        `scrollPosition-${location.pathname}`,
        window.scrollY.toString()
      )
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  return (
    <FeedPageProvider containerRef={containerRef}>{content}</FeedPageProvider>
  )
}

export default FeedPage
