import {
  lineupSelectors,
  trendingPlaylistsPageLineupSelectors,
  trendingPlaylistsPageLineupActions
} from '@audius/common/store'
import { useSelector } from 'react-redux'

import { RewardsBanner } from 'app/components/audio-rewards'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
const { getLineup } = trendingPlaylistsPageLineupSelectors
const { makeGetLineupMetadatas } = lineupSelectors

const getTrendingPlaylistsLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  header: 'Trending Playlists'
}

export const TrendingPlaylistsScreen = () => {
  const lineup = useSelector(getTrendingPlaylistsLineup)

  return (
    <Screen>
      <ScreenHeader text={messages.header} />
      <ScreenContent>
        <Lineup
          lineup={lineup}
          header={<RewardsBanner type='playlists' />}
          actions={trendingPlaylistsPageLineupActions}
          rankIconCount={5}
          isTrending
          selfLoad
        />
      </ScreenContent>
    </Screen>
  )
}
