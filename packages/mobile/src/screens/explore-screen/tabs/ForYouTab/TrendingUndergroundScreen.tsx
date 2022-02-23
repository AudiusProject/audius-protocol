import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import { trendingUndergroundLineupActions } from 'audius-client/src/common/store/pages/trending-underground/lineup/actions'
import { getLineup } from 'audius-client/src/common/store/pages/trending-underground/lineup/selectors'

import { RewardsBanner } from 'app/components/audio-rewards'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

const getTrendingUndergroundLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  header: 'Underground Trending'
}

export const TrendingUndergroundScreen = () => {
  const lineup = useSelectorWeb(getTrendingUndergroundLineup)

  return (
    <>
      <Header text={messages.header} />
      <Lineup
        lineup={lineup}
        header={<RewardsBanner type='underground' />}
        actions={trendingUndergroundLineupActions}
        rankIconCount={5}
        isTrending
      />
    </>
  )
}
