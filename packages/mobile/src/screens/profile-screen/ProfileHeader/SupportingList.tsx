import { useMemo } from 'react'

import type { CommonState, ID, Supporting } from '@audius/common'
import {
  stringWeiToBN,
  tippingSelectors,
  MAX_PROFILE_SUPPORTING_TILES
} from '@audius/common'
import { FlatList } from 'react-native'
import { useSelector } from 'react-redux'

import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { useSelectProfile } from '../selectors'

import { SupportingTile } from './SupportingTile'
import { SupportingTileSkeleton } from './SupportingTileSkeleton'
import { ViewAllSupportingTile } from './ViewAllSupportingTile'
const { getOptimisticSupportingForUser } = tippingSelectors

type ViewAllData = { viewAll: true; supporting: Supporting[] }

type SkeletonData = { loading: true }
const skeletonData: SkeletonData[] = [{ loading: true }, { loading: true }]

const useStyles = makeStyles(() => ({
  singleSupporterTile: {
    marginHorizontal: 0
  }
}))

export const SupportingList = () => {
  const styles = useStyles()
  const { user_id, supporting_count } = useSelectProfile(['user_id'])
  const supportingForUser = useSelector((state: CommonState) =>
    getOptimisticSupportingForUser(state, user_id)
  )
  const supportingIdsSorted = useMemo(() => {
    const ids = (
      supportingForUser ? Object.keys(supportingForUser) : ([] as unknown)
    ) as ID[]
    return ids.sort((id1, id2) => {
      const amount1BN = stringWeiToBN(supportingForUser[id1].amount)
      const amount2BN = stringWeiToBN(supportingForUser[id2].amount)
      return amount1BN.gte(amount2BN) ? -1 : 1
    })
  }, [supportingForUser])

  const supportingSorted = useMemo(
    () =>
      supportingIdsSorted
        .map((supporterId) => supportingForUser[supporterId])
        .filter(Boolean),
    [supportingIdsSorted, supportingForUser]
  )

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
      style={{
        marginHorizontal: spacing(-3)
      }}
      contentContainerStyle={{
        paddingHorizontal: spacing(2)
      }}
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
