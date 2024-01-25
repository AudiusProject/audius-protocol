import { RefObject } from 'react'

import { useIsMobile } from 'hooks/useIsMobile'

import RemixesPageProvider from './RemixesPageProvider'
import RemixesPageDesktopContent from './components/desktop/RemixesPage'
import RemixesPageMobileContent from './components/mobile/RemixesPage'

type RemixesPageProps = {
  containerRef: RefObject<HTMLDivElement>
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
