import { RefObject, memo } from 'react'

import { useUpdateProfile } from '@audius/common/api'

import { useIsMobile } from 'hooks/useIsMobile'

import ProfilePageProvider from './ProfilePageProvider'
import DesktopProfilePage from './components/desktop/ProfilePage'
import MobileProfilePage from './components/mobile/ProfilePage'

type ProfilePageProps = {
  containerRef: RefObject<HTMLDivElement>
}

const ProfilePage = ({ containerRef }: ProfilePageProps) => {
  const isMobile = useIsMobile()
  const content = isMobile ? MobileProfilePage : DesktopProfilePage
  const { mutate: updateProfile } = useUpdateProfile()

  return (
    <ProfilePageProvider
      containerRef={containerRef}
      updateProfile={updateProfile}
    >
      {content}
    </ProfilePageProvider>
  )
}

export default memo(ProfilePage)
