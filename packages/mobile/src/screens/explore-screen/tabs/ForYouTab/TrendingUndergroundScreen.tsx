import {
  trendingUndergroundPageLineupActions,
  trendingUndergroundPageLineupSelectors,
  lineupSelectors
} from '@audius/common'
import { useSelector } from 'react-redux'

import { RewardsBanner } from 'app/components/audio-rewards'
import { Header } from 'app/components/header'
import { Lineup } from 'app/components/lineup'
const { makeGetLineupMetadatas } = lineupSelectors
const { getLineup } = trendingUndergroundPageLineupSelectors

const getTrendingUndergroundLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  header: 'Underground Trending'
}

export const TrendingUndergroundScreen = () => {
  const lineup = useSelector(getTrendingUndergroundLineup)

  return (
    <>
      <Header text={messages.header} />
      <Lineup
        lineup={lineup}
        header={<RewardsBanner type='underground' />}
        actions={trendingUndergroundPageLineupActions}
        rankIconCount={5}
        isTrending
        selfLoad
      />
    </>
  )
}
