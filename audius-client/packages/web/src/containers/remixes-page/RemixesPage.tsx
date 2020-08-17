import React from 'react'

import RemixesPageProvider from './RemixesPageProvider'
import RemixesPageDesktopContent from './components/desktop/RemixesPage'
import RemixesPageMobileContent from './components/mobile/RemixesPage'
import { useIsMobile } from 'utils/clientUtil'

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
