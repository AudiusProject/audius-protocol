import { full, HashId } from '@audius/sdk'

import { ID } from '~/models'

const makeIdList = (input: { id: string }[]): ID[] => {
  return input.map(({ id }) => HashId.parse(id)).filter(Boolean) as ID[]
}

export const trendingIdsFromSDK = (input: full.TrendingTimesIds) => {
  return {
    week: makeIdList(input.week ?? []),
    month: makeIdList(input.month ?? []),
    year: makeIdList(input.year ?? [])
  }
}
