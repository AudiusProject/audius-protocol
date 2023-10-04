import { useCallback } from 'react'

import {
  premiumTracksPageLineupActions,
  premiumTracksPageLineupSelectors,
  lineupSelectors
} from '@audius/common'
import { useDispatch } from 'react-redux'

import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
const { makeGetLineupMetadatas } = lineupSelectors
const { getLineup } = premiumTracksPageLineupSelectors

const getPremiumTracksLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  header: 'Premium Tracks'
}

export const PremiumTracksScreen = () => {
  const dispatch = useDispatch()
  const loadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      dispatch(
        premiumTracksPageLineupActions.fetchLineupMetadatas(
          offset,
          limit,
          overwrite
        )
      )
    },
    [dispatch]
  )
  return (
    <Screen>
      <ScreenHeader text={messages.header} />
      <ScreenContent>
        <Lineup
          loadMore={loadMore}
          lineupSelector={getPremiumTracksLineup}
          actions={premiumTracksPageLineupActions}
          selfLoad
          pullToRefresh
        />
      </ScreenContent>
    </Screen>
  )
}
