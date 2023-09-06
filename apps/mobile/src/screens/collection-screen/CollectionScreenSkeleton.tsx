import { View } from 'react-native'

import { StaticSkeleton } from 'app/components/skeleton/Skeleton'
import { EntitySkeleton } from 'app/components/skeletons'
import { TrackListItemSkeleton } from 'app/components/track-list/TrackListItemSkeleton'

type CollectionScreenSkeletonProps = {
  collectionType?: 'playlist' | 'album'
}

export const CollectionScreenSkeleton = (
  props: CollectionScreenSkeletonProps
) => {
  const { collectionType } = props

  return (
    <EntitySkeleton entityType={collectionType}>
      <View>
        <StaticSkeleton />
        <StaticSkeleton />
      </View>
      <TrackListItemSkeleton index={0} />
      <TrackListItemSkeleton index={1} />
    </EntitySkeleton>
  )
}
