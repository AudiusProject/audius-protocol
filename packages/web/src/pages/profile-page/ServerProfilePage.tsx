import { ID } from '@audius/common/src/models/Identifiers'

import { ServerProfilePage as DesktopPage } from './DesktopServerProfilePage'
import { ServerProfilePage as MobilePage } from './MobileServerProfilePage'

type ServerProfilePageProps = {
  userId: ID
  isMobile: boolean
}

export const ServerProfilePage = (props: ServerProfilePageProps) => {
  const { userId, isMobile } = props
  return isMobile ? (
    <MobilePage userId={userId} />
  ) : (
    <DesktopPage userId={userId} />
  )
}
