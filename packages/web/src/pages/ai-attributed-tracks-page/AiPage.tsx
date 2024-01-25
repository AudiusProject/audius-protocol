import { RefObject } from 'react'

import { useIsMobile } from 'hooks/useIsMobile'

import AiPageProvider from './AiPageProvider'
import AiPageDesktopContent from './components/desktop/AiPage'
import AiPageMobileContent from './components/mobile/AiPage'

type AiPageProps = {
  containerRef: RefObject<HTMLDivElement>
}

const AiPage = ({ containerRef }: AiPageProps) => {
  const isMobile = useIsMobile()
  const content = isMobile ? AiPageMobileContent : AiPageDesktopContent

  return <AiPageProvider containerRef={containerRef}>{content}</AiPageProvider>
}

export default AiPage
