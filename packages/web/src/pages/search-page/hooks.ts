import { useCallback, useContext, useMemo } from 'react'

import { SearchSortMethod } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Genre, Mood } from '@audius/sdk'
import { isEmpty } from 'lodash'
import { generatePath, useRouteMatch } from 'react-router-dom'
import { useSearchParams as useParams } from 'react-router-dom-v5-compat'

import { useHistoryContext } from 'app/HistoryProvider'
import { RouterContext } from 'components/animated-switch/RouterContextProvider'
import { useIsMobile } from 'hooks/useIsMobile'

import { CategoryKey, CategoryView } from './types'
import { urlSearchParamsToObject } from './utils'

const { SEARCH_BASE_ROUTE, SEARCH_PAGE } = route

export const useShowSearchResults = () => {
  const { query, genre, mood, isPremium, hasDownloads, isVerified, bpm, key } =
    useSearchParams()

  return (
    query ||
    genre ||
    mood ||
    isVerified ||
    hasDownloads ||
    bpm ||
    key ||
    isPremium
  )
}

export const useSearchCategory = () => {
  const isMobile = useIsMobile()
  const routeMatch = useRouteMatch<{ category: string }>(SEARCH_PAGE)
  const categoryParam = routeMatch?.params.category as CategoryView

  const category = isMobile ? (categoryParam ?? 'all') : categoryParam

  const { history } = useHistoryContext()
  const searchParams = useSearchParams()
  const { setStackReset } = useContext(RouterContext)

  const setCategory = useCallback(
    (newCategory: CategoryKey) => {
      // Do not animate on mobile
      setStackReset(true)

      const commonFilterParams = Object.fromEntries(
        Object.entries(searchParams)
          .filter(([key, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      )
      const pathname =
        newCategory === 'all'
          ? generatePath(SEARCH_BASE_ROUTE)
          : generatePath(SEARCH_PAGE, { category: newCategory })

      history.push({
        pathname,
        search: !isEmpty(commonFilterParams)
          ? new URLSearchParams(
              Object.fromEntries(
                Object.entries(commonFilterParams).map(([k, v]) => [
                  k,
                  String(v)
                ])
              )
            ).toString()
          : undefined,
        state: {}
      })
    },
    [searchParams, history, setStackReset]
  )

  return [category || CategoryView.ALL, setCategory] as const
}

export const useSearchParams = () => {
  const [urlSearchParams] = useParams()

  const query = urlSearchParams.get('query')
  const sortMethod = urlSearchParams.get('sortMethod') as SearchSortMethod
  const genre = urlSearchParams.get('genre')
  const mood = urlSearchParams.get('mood')
  const bpm = urlSearchParams.get('bpm')
  const key = urlSearchParams.get('key')
  const isVerified = urlSearchParams.get('isVerified')
  const hasDownloads = urlSearchParams.get('hasDownloads')
  const isPremium = urlSearchParams.get('isPremium')

  const searchParams = useMemo(
    () => ({
      query: query || undefined,
      genre: (genre || undefined) as Genre,
      mood: (mood || undefined) as Mood,
      bpm: bpm || undefined,
      key: key || undefined,
      isVerified: isVerified === 'true' ? true : undefined,
      hasDownloads: hasDownloads === 'true' ? true : undefined,
      isPremium: isPremium === 'true' ? true : undefined,
      sortMethod: sortMethod || undefined
    }),
    [
      query,
      genre,
      mood,
      bpm,
      key,
      isVerified,
      hasDownloads,
      isPremium,
      sortMethod
    ]
  )
  return searchParams
}

export const useUpdateSearchParams = (key: string) => {
  const [searchParams, setUrlSearchParams] = useParams()
  return (value: string) => {
    if (value) {
      setUrlSearchParams({
        ...urlSearchParamsToObject(searchParams),
        [key]: value
      })
    } else {
      const { [key]: ignored, ...params } =
        urlSearchParamsToObject(searchParams)
      setUrlSearchParams(params)
    }
  }
}
