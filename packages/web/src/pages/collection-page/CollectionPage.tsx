import { useFollowUser, useUnfollowUser } from '@audius/common/api'
import { SmartCollection } from '@audius/common/models'
import { CollectionsPageType } from '@audius/common/store'

import { useIsMobile } from 'hooks/useIsMobile'

import CollectionPageProvider from './CollectionPageProvider'
import DesktopCollectionPage from './components/desktop/CollectionPage'
import MobileCollectionPage from './components/mobile/CollectionPage'

type CollectionPageProps = {
  type: CollectionsPageType
  smartCollection?: SmartCollection
}

const CollectionPage = (props: CollectionPageProps) => {
  const { type, smartCollection } = props
  const isMobile = useIsMobile()
  const content = isMobile ? MobileCollectionPage : DesktopCollectionPage
  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()

  return (
    <CollectionPageProvider
      isMobile={isMobile}
      smartCollection={smartCollection}
      type={type}
      onFollow={followUser}
      onUnfollow={unfollowUser}
    >
      {content}
    </CollectionPageProvider>
  )
}

export default CollectionPage
