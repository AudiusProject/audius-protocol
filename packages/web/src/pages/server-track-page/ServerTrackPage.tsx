import { ServerTrackPage as DesktopPage } from './desktop/ServerTrackPage'
import { ServerTrackPage as MobilePage } from './mobile/ServerTrackPage'

export type ServerTrackPageProps = {
  track: any
  isMobile: boolean
}

export const ServerTrackPage = ({
  isMobile,
  ...other
}: ServerTrackPageProps) => {
  // @ts-ignore
  return isMobile ? <MobilePage {...other} /> : <DesktopPage {...other} />
}
