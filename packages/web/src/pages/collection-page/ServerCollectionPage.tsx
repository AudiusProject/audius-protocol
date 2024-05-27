import { ID } from '@audius/common/src/models/Identifiers'

import { DesktopServerCollectionPage } from './DesktopServerCollectionPage'
import { MobileServerCollectionPage } from './MobileServerCollectionPage'

type ServerCollectionPageProps = {
  collectionId: ID
  isMobile: boolean
}

export const ServerCollectionPage = (props: ServerCollectionPageProps) => {
  const { collectionId, isMobile } = props
  return isMobile ? (
    <MobileServerCollectionPage collectionId={collectionId} />
  ) : (
    <DesktopServerCollectionPage collectionId={collectionId} />
  )
}
