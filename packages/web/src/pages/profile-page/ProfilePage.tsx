import { RefObject, memo, useEffect } from 'react'

import { useGetCurrentUserId } from '@audius/common/api'
import { encodeHashId } from '@audius/common/utils'

import { useIsMobile } from 'hooks/useIsMobile'
import { audiusSdk } from 'services/audius-sdk'

import ProfilePageProvider from './ProfilePageProvider'
import DesktopProfilePage from './components/desktop/ProfilePage'
import MobileProfilePage from './components/mobile/ProfilePage'

type ProfilePageProps = {
  containerRef: RefObject<HTMLDivElement>
}

const ProfilePage = ({ containerRef }: ProfilePageProps) => {
  const isMobile = useIsMobile()
  const content = isMobile ? MobileProfilePage : DesktopProfilePage

  const userId = useGetCurrentUserId({})

  useEffect(() => {
    async function createSymetricKey() {
      const sdk = await audiusSdk()
      const emails = await sdk.emails.batchEncryptEmails([
        {
          seller_user_id: 12,
          grantee_user_ids: [576083161],
          buyer_details: ['ray+ddex3@audius.co', 'saliou+2@audius.co']
        }
      ])
      console.log('HEREE')
      console.log(emails)
    }

    if (userId.data) {
      createSymetricKey()
    }
  }, [userId])

  return (
    <ProfilePageProvider containerRef={containerRef}>
      {content}
    </ProfilePageProvider>
  )
}

export default memo(ProfilePage)
