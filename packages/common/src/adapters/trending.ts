import { full } from '@audius/sdk'

import { HashId } from '~/models'

const makeIdList = (input: { id: string }[]) => {
  return input.map(({ id }) => HashId.parse(id))
}

export const trendingIdsFromSDK = (input: full.TrendingTimesIds) => {
  return {
    week: makeIdList(input.week ?? []),
    month: makeIdList(input.month ?? []),
    year: makeIdList(input.year ?? [])
  }
}
