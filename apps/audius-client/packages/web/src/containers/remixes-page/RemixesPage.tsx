import React from 'react'

import { useIsMobile } from 'utils/clientUtil'

import RemixesPageProvider from './RemixesPageProvider'
import RemixesPageDesktopContent from './components/desktop/RemixesPage'
import RemixesPageMobileContent from './components/mobile/RemixesPage'

type RemixesPageProps = {
  containerRef: React.RefObject<HTMLDivElement>
}

const RemixesPage = ({ containerRef }: RemixesPageProps) => {
  const isMobile = useIsMobile()
  const content = isMobile
    ? RemixesPageMobileContent
    : RemixesPageDesktopContent

  return (
    <RemixesPageProvider containerRef={containerRef}>
      {content}
    </RemixesPageProvider>
  )
}

export default RemixesPage
