import { ServerCollectionPage as DesktopPage } from './desktop/ServerCollectionPage'
// import { ServerCollectionPage as MobilePage } from './mobile/ServerCollectionPage'

export type ServerCollectionPageProps = {
  collection: any
  isMobile: boolean
}

export const ServerCollectionPage = ({
  isMobile,
  ...other
}: ServerCollectionPageProps) => {
  // @ts-ignore
  return <DesktopPage {...other} />

  // return isMobile ? <MobilePage {...other} /> : <DesktopPage {...other} />
}
