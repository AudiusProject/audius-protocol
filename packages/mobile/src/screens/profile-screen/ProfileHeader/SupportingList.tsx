import { useMemo } from 'react'

import { useSupportedUsers } from '@audius/common/api'
import type { SupportedUserMetadata } from '@audius/common/models'
import {
  MAX_PROFILE_SUPPORTING_TILES,
  SUPPORTING_PAGINATION_SIZE
} from '@audius/common/utils'
import { FlatList } from 'react-native'

import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'

import { SupportingTile } from './SupportingTile'
import { SupportingTileSkeleton } from './SupportingTileSkeleton'
import { ViewAllSupportingTile } from './ViewAllSupportingTile'

type ViewAllData = { viewAll: true; supportedUsers: SupportedUserMetadata[] }

type SkeletonData = { loading: true }
const skeletonData: SkeletonData[] = [{ loading: true }, { loading: true }]

const useStyles = makeStyles(({ spacing }) => ({
  list: { marginHorizontal: spacing(-3) },
  listContentContainer: { paddingHorizontal: spacing(2) },
  singleSupporterTile: {
    marginHorizontal: 0
  }
}))

export const SupportingList = () => {
  const styles = useStyles()
  const { user_id, supporting_count } = useSelectProfile([
    'user_id',
    'supporting_count'
  ])

  const { data: supportedUsers = [] } = useSupportedUsers({
    userId: user_id,
    limit: SUPPORTING_PAGINATION_SIZE
  })

  const supportingListData = useMemo(() => {
    if (supportedUsers.length === 0) {
      return skeletonData
    }
    if (supportedUsers.length > MAX_PROFILE_SUPPORTING_TILES) {
      const viewAllData: ViewAllData = {
        viewAll: true,
        supportedUsers: supportedUsers.slice(
          MAX_PROFILE_SUPPORTING_TILES,
          supportedUsers.length
        )
      }
      return [
        ...supportedUsers.slice(0, MAX_PROFILE_SUPPORTING_TILES),
        viewAllData
      ]
    }
    return supportedUsers
  }, [supportedUsers])

  if (supporting_count === 1) {
    if (supportedUsers.length === 0) {
      return <SupportingTileSkeleton style={styles.singleSupporterTile} />
    }
    return (
      <SupportingTile
        style={styles.singleSupporterTile}
        supportedUser={supportedUsers[0]}
        scaleTo={0.985}
      />
    )
  }

  return (
    <FlatList<SupportedUserMetadata | SkeletonData | ViewAllData>
      style={styles.list}
      contentContainerStyle={styles.listContentContainer}
      horizontal
      showsHorizontalScrollIndicator={false}
      data={supportingListData}
      renderItem={({ item }) => {
        if ('loading' in item) return <SupportingTileSkeleton />
        if ('viewAll' in item)
          return <ViewAllSupportingTile supportedUsers={item.supportedUsers} />
        return (
          <SupportingTile key={item.receiver.user_id} supportedUser={item} />
        )
      }}
    />
  )
}
