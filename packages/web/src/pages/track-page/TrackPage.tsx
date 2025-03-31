import { useFollowUser, useUnfollowUser } from '@audius/common/api'

import { useIsMobile } from 'hooks/useIsMobile'

import TrackPageProvider from './TrackPageProvider'
import TrackPageDesktopContent from './components/desktop/TrackPage'
import TrackPageMobileContent from './components/mobile/TrackPage'

const TrackPage = () => {
  const isMobile = useIsMobile()
  const content = isMobile ? TrackPageMobileContent : TrackPageDesktopContent
  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()

  return (
    <TrackPageProvider onFollow={followUser} onUnfollow={unfollowUser}>
      {content}
    </TrackPageProvider>
  )
}

export default TrackPage
