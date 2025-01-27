import { useTrendingUnderground } from '@audius/common/api'
import { trendingUndergroundPageLineupActions } from '@audius/common/store'

import { RewardsBanner } from 'app/components/audio-rewards'
import { Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'

const messages = {
  header: 'Underground Trending'
}

export const TrendingUndergroundScreen = () => {
  const { lineup, loadNextPage, pageSize } = useTrendingUnderground()

  return (
    <Screen>
      <ScreenHeader text={messages.header} />
      <ScreenContent>
        <Lineup
          tanQuery
          lineup={lineup}
          header={<RewardsBanner type='underground' />}
          loadMore={loadNextPage}
          actions={trendingUndergroundPageLineupActions}
          rankIconCount={5}
          pageSize={pageSize}
          isTrending
        />
      </ScreenContent>
    </Screen>
  )
}
