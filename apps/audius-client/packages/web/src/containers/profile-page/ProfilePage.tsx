import React from 'react'
import ProfilePageProvider from './ProfilePageProvider'

import MobileProfilePage from './components/mobile/ProfilePage'
import DesktopProfilePage from './components/desktop/ProfilePage'
import { useIsMobile } from 'utils/clientUtil'

type ProfilePageProps = {
  containerRef: React.RefObject<HTMLDivElement>
}

const ProfilePage = ({ containerRef }: ProfilePageProps) => {
  const isMobile = useIsMobile()
  const content = isMobile ? MobileProfilePage : DesktopProfilePage

  return (
    <ProfilePageProvider containerRef={containerRef}>
      {content}
    </ProfilePageProvider>
  )
}

export default ProfilePage
