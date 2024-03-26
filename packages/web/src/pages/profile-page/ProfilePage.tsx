import { RefObject, memo } from 'react'

import { useSsrContext } from 'ssr/SsrContext'

import ProfilePageProvider from './ProfilePageProvider'
import DesktopProfilePage from './components/desktop/ProfilePage'
import MobileProfilePage from './components/mobile/ProfilePage'

type ProfilePageProps = {
  containerRef: RefObject<HTMLDivElement>
}

const ProfilePage = ({ containerRef }: ProfilePageProps) => {
  const { isMobile } = useSsrContext()
  const content = isMobile ? MobileProfilePage : DesktopProfilePage

  return (
    <ProfilePageProvider containerRef={containerRef}>
      {content}
    </ProfilePageProvider>
  )
}

export default memo(ProfilePage)
