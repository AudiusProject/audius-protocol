import {
  premiumTracksPageLineupActions,
  premiumTracksPageLineupSelectors,
  lineupSelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import { useCallback } from 'react'
const { makeGetLineupMetadatas } = lineupSelectors
const { getLineup } = premiumTracksPageLineupSelectors

const getPremiumTracksLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  header: 'Premium Tracks'
}

export const PremiumTracksScreen = () => {
  const dispatch = useDispatch()
  const lineup = useSelector(getPremiumTracksLineup)
  const loadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatch(premiumTracksPageLineupActions.fetchLineupMetadatas(offset, limit, overwrite))
  }, [])
  return (
    <Screen>
      <ScreenHeader text={messages.header} />
      <ScreenContent>
        <Lineup
          loadMore={loadMore}
          lineup={lineup}
          actions={premiumTracksPageLineupActions}
          selfLoad
          pullToRefresh
        />
      </ScreenContent>
    </Screen>
  )
}
