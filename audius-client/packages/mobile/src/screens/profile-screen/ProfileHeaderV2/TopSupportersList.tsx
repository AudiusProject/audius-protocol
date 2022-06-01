import { useMemo } from 'react'

import { User } from 'audius-client/src/common/models/User'
import { ID } from 'common/models/Identifiers'
import { getUsers } from 'common/store/cache/users/selectors'
import { getSupportersForUser } from 'common/store/tipping/selectors'
import { Dimensions, FlatList } from 'react-native'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'

import { TopSupporterTile } from './TopSupporterTile'
import { TopSupporterTileSkeleton } from './TopSupporterTileSkeleton'
import { ViewAllTopSupportersTile } from './ViewAllTopSupportersTile'

export const MAX_PROFILE_TOP_SUPPORTERS = 5

type ViewAllData = { viewAll: true; supporters: User[] }

type SkeletonData = { loading: true }
const skeletonData: SkeletonData[] = [{ loading: true }, { loading: true }]

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(1),
    marginBottom: spacing(4)
  },
  singleSupporterTile: {
    width: Dimensions.get('window').width - spacing(6)
  }
}))

export const TopSupportersList = () => {
  const styles = useStyles()
  const { user_id, supporter_count } = useSelectProfile(['user_id'])
  const supporters = useSelectorWeb(state =>
    getSupportersForUser(state, user_id)
  )
  const topSupporterIds = useMemo(() => {
    const supporterIds = (supporters
      ? Object.keys(supporters)
      : ([] as unknown)) as ID[]
    return supporterIds.sort(
      (id1, id2) => supporters[id1].rank - supporters[id2].rank
    )
  }, [supporters])

  const topSupporterUsers = useSelectorWeb(state =>
    getUsers(state, { ids: topSupporterIds })
  )

  const topSupporters = useMemo(
    () =>
      topSupporterIds
        .map(supporterId => topSupporterUsers[supporterId])
        .filter(Boolean),
    [topSupporterIds, topSupporterUsers]
  )

  const topSupportersListData = useMemo(() => {
    if (topSupporters.length === 0) {
      return skeletonData
    }
    if (topSupporters.length > MAX_PROFILE_TOP_SUPPORTERS) {
      const viewAllData: ViewAllData = {
        viewAll: true,
        supporters: topSupporters.slice(
          MAX_PROFILE_TOP_SUPPORTERS,
          topSupporters.length
        )
      }
      return [
        ...topSupporters.slice(0, MAX_PROFILE_TOP_SUPPORTERS),
        viewAllData
      ]
    }
    return topSupporters
  }, [topSupporters])

  if (supporter_count === 1) {
    if (topSupporters.length === 0) {
      return <TopSupporterTileSkeleton style={styles.singleSupporterTile} />
    }
    return (
      <TopSupporterTile
        style={styles.singleSupporterTile}
        rank={1}
        supporter={topSupporters[0]}
      />
    )
  }

  return (
    <FlatList<User | SkeletonData | ViewAllData>
      horizontal
      showsHorizontalScrollIndicator={false}
      data={topSupportersListData}
      renderItem={({ item, index }) => {
        if ('loading' in item) return <TopSupporterTileSkeleton />
        if ('viewAll' in item)
          return <ViewAllTopSupportersTile supporters={item.supporters} />
        return (
          <TopSupporterTile
            key={item.user_id}
            rank={index + 1}
            supporter={item}
          />
        )
      }}
    />
  )
}
