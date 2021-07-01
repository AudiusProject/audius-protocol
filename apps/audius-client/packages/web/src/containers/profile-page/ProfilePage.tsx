import React from 'react'

import { useIsMobile } from 'utils/clientUtil'

import ProfilePageProvider from './ProfilePageProvider'
import DesktopProfilePage from './components/desktop/ProfilePage'
import MobileProfilePage from './components/mobile/ProfilePage'

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
