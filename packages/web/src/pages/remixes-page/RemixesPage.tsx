import { RefObject } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/src/services/remote-config/feature-flags'

import { useIsMobile } from 'hooks/useIsMobile'

import RemixesPageProvider from './RemixesPageProvider'
import NewRemixesPageDesktopContent from './components/desktop/NewRemixesPage'
import RemixesPageDesktopContent from './components/desktop/RemixesPage'
import NewRemixesPageMobileContent from './components/mobile/NewRemixesPage'
import RemixesPageMobileContent from './components/mobile/RemixesPage'

type RemixesPageProps = {
  containerRef: RefObject<HTMLDivElement>
}

const RemixesPage = ({ containerRef }: RemixesPageProps) => {
  const isMobile = useIsMobile()
  const { isEnabled: isRemixContestEnabled } = useFeatureFlag(
    FeatureFlags.REMIX_CONTEST
  )

  let content = isMobile ? RemixesPageMobileContent : RemixesPageDesktopContent

  if (isRemixContestEnabled) {
<<<<<<< Updated upstream
    content = isMobile ? RemixesPageMobileContent : NewRemixesPageDesktopContent
=======
    content = isMobile
      ? NewRemixesPageMobileContent
      : NewRemixesPageDesktopContent
>>>>>>> Stashed changes
  }
  return (
    <RemixesPageProvider containerRef={containerRef}>
      {content}
    </RemixesPageProvider>
  )
}

export default RemixesPage
