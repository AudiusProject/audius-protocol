import { RefObject, useEffect } from 'react'

import { useDebouncedCallback } from '@audius/common/hooks'
import { useLocation } from 'react-router-dom'
import { useNavigationType } from 'react-router-dom-v5-compat'

import { useIsMobile } from 'hooks/useIsMobile'
import { useMainContentRef } from 'pages/MainContentContext'

import FeedPageProvider from './FeedPageProvider'
import FeedPageContent from './components/desktop/FeedPageContent'
import FeedPageMobileContent from './components/mobile/FeedPageContent'

type FeedPageContentProps = {
  containerRef: RefObject<HTMLDivElement>
}

const FeedPage = ({ containerRef }: FeedPageContentProps) => {
  const isMobile = useIsMobile()
  const content = isMobile ? FeedPageMobileContent : FeedPageContent

  const contentRef = useMainContentRef()

  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'POP') {
      const currentRef = contentRef.current
      const savedScrollPosition = sessionStorage.getItem(
        `scrollPosition-${location.pathname}`
      )

      if (savedScrollPosition !== null) {
        console.log('Popping to ', savedScrollPosition)
        currentRef?.scrollTo(0, parseInt(savedScrollPosition, 10))
      }
    }
  }, [contentRef, location.pathname, navigationType])

  const handleScroll = useDebouncedCallback(
    () => {
      const scrollPosition: number = contentRef.current?.scrollTop ?? 0
      console.log('SCROLL', scrollPosition)
      sessionStorage.setItem(
        `scrollPosition-${location.pathname}`,
        scrollPosition.toString()
      )
    },
    [contentRef, location.pathname],
    50
  )

  useEffect(() => {
    const currentRef = contentRef.current
    currentRef?.addEventListener('scroll', handleScroll)
    return () => currentRef?.removeEventListener('scroll', handleScroll)
  }, [contentRef, handleScroll])

  return (
    <FeedPageProvider containerRef={containerRef}>{content}</FeedPageProvider>
  )
}

export default FeedPage
