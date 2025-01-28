import { useTrendingPlaylists } from '@audius/common/api'
import { trendingPlaylistsPageLineupActions } from '@audius/common/store'

import { RewardsBanner } from 'app/components/audio-rewards'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'

const messages = {
  header: 'Trending Playlists'
}

export const TrendingPlaylistsScreen = () => {
  const { lineup, loadNextPage, pageSize } = useTrendingPlaylists()

  return (
    <Screen>
      <ScreenHeader text={messages.header} />
      <ScreenContent>
        <Lineup
          tanQuery
          lineup={lineup}
          header={<RewardsBanner type='playlists' />}
          loadMore={loadNextPage}
          actions={trendingPlaylistsPageLineupActions}
          rankIconCount={5}
          pageSize={pageSize}
          isTrending
        />
      </ScreenContent>
    </Screen>
  )
}
