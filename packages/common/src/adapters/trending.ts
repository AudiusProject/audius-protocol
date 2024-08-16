import { full } from '@audius/sdk'

import { ID } from '~/models'
import { TrendingIds } from '~/models/Trending'
import { decodeHashId } from '~/utils'

const makeIdList = (input: { id: string }[]): ID[] => {
  return input.map(({ id }) => decodeHashId(id)).filter(Boolean) as ID[]
}

export const trendingIdsFromSDK = (
  input?: full.TrendingTimesIds
): TrendingIds => {
  return input
    ? {
        week: makeIdList(input.week ?? []),
        month: makeIdList(input.month ?? []),
        year: makeIdList(input.year ?? []),
        allTime: []
      }
    : {
        week: [],
        month: [],
        year: [],
        allTime: []
      }
}
