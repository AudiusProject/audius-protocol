import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { trendingPlaylistLineupActions } from 'audius-client/src/common/store/pages/trending-playlists/lineups/actions'
import { getLineup } from 'audius-client/src/common/store/pages/trending-playlists/lineups/selectors'

import { RewardsBanner } from 'app/components/audio-rewards'
import { Screen } from 'app/components/core'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

const getTrendingPlaylistsLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  header: 'Trending Playlists'
}

export const TrendingPlaylistsScreen = () => {
  const lineup = useSelectorWeb(getTrendingPlaylistsLineup)

  return (
    <Screen>
      <Header text={messages.header} />
      <Lineup
        lineup={lineup}
        header={<RewardsBanner type='playlists' />}
        actions={trendingPlaylistLineupActions}
        rankIconCount={5}
        isTrending
      />
    </Screen>
  )
}
