import { ID } from '@audius/common/src/models/Identifiers'

import { DesktopServerTrackPage } from './DesktopServerTrackPage'
import { MobileServerTrackPage } from './MobileServerTrackPage'

type ServerTrackPageProps = {
  trackId: ID
  isMobile: boolean
}

export const ServerTrackPage = (props: ServerTrackPageProps) => {
  const { isMobile } = props
  return isMobile ? <MobileServerTrackPage /> : <DesktopServerTrackPage />
}
