import { tippingActions } from '@audius/common/store'
import { useEffect, useMemo } from 'react'

import { useRankedSupportingForUser } from '@audius/common/hooks'
import type { Supporting } from '@audius/common/models'
import { MAX_PROFILE_SUPPORTING_TILES } from '@audius/common/utils'
import { FlatList } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'

import { SupportingTile } from './SupportingTile'
import { SupportingTileSkeleton } from './SupportingTileSkeleton'
import { ViewAllSupportingTile } from './ViewAllSupportingTile'

const { fetchSupportingForUser } = tippingActions

type ViewAllData = { viewAll: true; supporting: Supporting[] }

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

  const dispatch = useDispatch()

  const shouldFetchSupporting = useSelector((state) => {
    return (
      !state.tipping.supporting[user_id] &&
      !state.tipping.supportersOverrides[user_id]
    )
  })

  useEffect(() => {
    if (supporting_count > 0 && shouldFetchSupporting) {
      dispatch(fetchSupportingForUser({ userId: user_id }))
    }
  }, [supporting_count, shouldFetchSupporting, dispatch, user_id])

  const supportingSorted = useRankedSupportingForUser(user_id)

  const supportingListData = useMemo(() => {
    if (supportingSorted.length === 0) {
      return skeletonData
    }
    if (supportingSorted.length > MAX_PROFILE_SUPPORTING_TILES) {
      const viewAllData: ViewAllData = {
        viewAll: true,
        supporting: supportingSorted.slice(
          MAX_PROFILE_SUPPORTING_TILES,
          supportingSorted.length
        )
      }
      return [
        ...supportingSorted.slice(0, MAX_PROFILE_SUPPORTING_TILES),
        viewAllData
      ]
    }
    return supportingSorted
  }, [supportingSorted])

  if (supporting_count === 1) {
    if (supportingSorted.length === 0) {
      return <SupportingTileSkeleton style={styles.singleSupporterTile} />
    }
    return (
      <SupportingTile
        style={styles.singleSupporterTile}
        supporting={supportingSorted[0]}
        scaleTo={0.985}
      />
    )
  }

  return (
    <FlatList<Supporting | SkeletonData | ViewAllData>
      style={styles.list}
      contentContainerStyle={styles.listContentContainer}
      horizontal
      showsHorizontalScrollIndicator={false}
      data={supportingListData}
      renderItem={({ item }) => {
        if ('loading' in item) return <SupportingTileSkeleton />
        if ('viewAll' in item) return <ViewAllSupportingTile />
        return <SupportingTile key={item.receiver_id} supporting={item} />
      }}
    />
  )
}
