import {
  trendingUndergroundPageLineupActions,
  trendingUndergroundPageLineupSelectors,
  lineupSelectors
} from '@audius/common'

import { RewardsBanner } from 'app/components/audio-rewards'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
const { getLineup } = trendingUndergroundPageLineupSelectors

const getTrendingUndergroundLineup =
  lineupSelectors.makeGetLineupMetadatas(getLineup)

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
        actions={trendingUndergroundPageLineupActions}
        rankIconCount={5}
        isTrending
      />
    </>
  )
}
