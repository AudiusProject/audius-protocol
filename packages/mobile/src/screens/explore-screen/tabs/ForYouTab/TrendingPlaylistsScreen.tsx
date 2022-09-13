import {
  lineupSelectors,
  trendingPlaylistsPageLineupSelectors,
  trendingPlaylistsPageLineupActions
} from '@audius/common'
import { useSelector } from 'react-redux'

import { RewardsBanner } from 'app/components/audio-rewards'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
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
      <Header text={messages.header} />
      <Lineup
        lineup={lineup}
        header={<RewardsBanner type='playlists' />}
        actions={trendingPlaylistsPageLineupActions}
        rankIconCount={5}
        isTrending
        selfLoad
      />
    </Screen>
  )
}
