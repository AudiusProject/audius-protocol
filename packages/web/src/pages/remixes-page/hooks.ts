import { useMemo } from 'react'

import { useSearchParams as useParams } from 'react-router-dom-v5-compat'

export type RemixSortMethod = 'likes' | 'plays' | 'recent'

export const useRemixPageParams = () => {
  const [urlRemixPageParams] = useParams()

  const sortMethod = urlRemixPageParams.get('sortMethod') as RemixSortMethod
  const isCosign = urlRemixPageParams.get('isCosign')
  const isContestEntry = urlRemixPageParams.get('isContestEntry')

  const remixPageParams = useMemo(
    () => ({
      sortMethod: sortMethod || undefined,
      isCosign: isCosign || undefined,
      isContestEntry: isContestEntry || undefined
    }),
    [sortMethod, isCosign, isContestEntry]
  )
  return remixPageParams
}
