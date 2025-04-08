import { useCallback, useContext, useMemo } from 'react'

import { SearchSortMethod } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Genre, Mood } from '@audius/sdk'
import { intersection, isEmpty } from 'lodash'
import { generatePath, useRouteMatch } from 'react-router-dom'
import { useSearchParams as useParams } from 'react-router-dom-v5-compat'

import { useHistoryContext } from 'app/HistoryProvider'
import { RouterContext } from 'components/animated-switch/RouterContextProvider'
import { useIsMobile } from 'hooks/useIsMobile'

import { categories } from './categories'
import { CategoryKey, CategoryView } from './types'
import { urlSearchParamsToObject } from './utils'

const { SEARCH_BASE_ROUTE, SEARCH_PAGE } = route

export const useRemixPageParams = () => {
  const [urlRemixPageParams] = useParams()

  const sortMethod = urlRemixPageParams.get('sortMethod') as SearchSortMethod

  const remixPageParams = useMemo(
    () => ({
      sortMethod: sortMethod || undefined
    }),
    [sortMethod]
  )
  return remixPageParams
}
