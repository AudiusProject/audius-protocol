import { useIsMobile } from 'hooks/useIsMobile'

import { EditCollectionPage as EditCollectionDesktopPage } from './desktop/EditCollectionPage'
import EditCollectionMobilePage from './mobile/EditCollectionPage'

export const EditCollectionPage = () => {
  const isMobile = useIsMobile()
  return isMobile ? <EditCollectionMobilePage /> : <EditCollectionDesktopPage />
}
