import { full, HashId } from '@audius/sdk'

import { removeNullable } from '~/utils'

const makeIdList = (input: { id: string }[]) => {
  return input.map(({ id }) => HashId.parse(id)).filter(removeNullable)
}

export const trendingIdsFromSDK = (input: full.TrendingTimesIds) => {
  return {
    week: makeIdList(input.week ?? []),
    month: makeIdList(input.month ?? []),
    year: makeIdList(input.year ?? [])
  }
}
