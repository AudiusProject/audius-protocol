import { useMemo } from 'react'

import {
  SearchCategory,
  useGetSearchResults as useGetSearchResultsApi
} from '@audius/common/api'
import { ID, Status } from '@audius/common/models'
import { SearchSortMethod, accountSelectors } from '@audius/common/store'
import { Genre, Mood } from '@audius/sdk'
import { useSelector } from 'react-redux'
import { useRouteMatch } from 'react-router-dom'
import { useSearchParams as useParams } from 'react-router-dom-v5-compat'

import { useIsMobile } from 'hooks/useIsMobile'
import { SEARCH_PAGE } from 'utils/route'

import { CategoryView } from './types'

const { getAccountStatus, getUserId } = accountSelectors

type SearchResultsApiType = ReturnType<typeof useGetSearchResultsApi>

export const ALL_RESULTS_LIMIT = 12

type SearchResultsType<C extends SearchCategory> = {
  status: SearchResultsApiType['status']
  data: C extends 'all'
    ? {
        users: ID[]
        tracks: ID[]
        playlists: ID[]
        albums: ID[]
      }
    : ID[]
}

export const useGetSearchResults = <C extends SearchCategory>(
  category: C
): SearchResultsType<C> => {
  const { query, ...filters } = useSearchParams()

  const accountStatus = useSelector(getAccountStatus)
  const currentUserId = useSelector(getUserId)

  const params = {
    query: query || '',
    ...filters,
    category,
    currentUserId,
    limit: category === 'all' ? ALL_RESULTS_LIMIT : undefined,
    offset: 0
  }

  // TODO: Properly type data when `shallow` is true
  const { data, status } = useGetSearchResultsApi(params, {
    // We pass shallow here because the top level search results don't care
    // about the actual entities, just the ids. The nested componets pull
    // the entities from the cache. This prevents unnecessary re-renders at the top
    shallow: true,
    debounce: 500,
    // TODO: do we need this on mobile too
    // Only search when the account has finished loading,
    // or if the user is not logged in
    disabled: accountStatus === Status.LOADING || accountStatus === Status.IDLE
  })

  if (category === 'all') {
    return { data: data as any, status } as SearchResultsType<C>
  } else {
    return {
      data: data?.[category as Exclude<C, 'all'>] as any,
      status
    } as SearchResultsType<C>
  }
}

export const useSearchCategory = () => {
  const isMobile = useIsMobile()
  const routeMatch = useRouteMatch<{ category: string }>(SEARCH_PAGE)
  const categoryParam = routeMatch?.params.category as CategoryView

  const category = isMobile ? categoryParam ?? 'profiles' : categoryParam
  return category || CategoryView.ALL
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
      query,
      genre: (genre || undefined) as Genre,
      mood: (mood || undefined) as Mood,
      bpm: bpm || undefined,
      key: key || undefined,
      isVerified: isVerified === 'true',
      hasDownloads: hasDownloads === 'true',
      isPremium: isPremium === 'true',
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

const urlSearchParamsToObject = (
  searchParams: URLSearchParams
): Record<string, string> =>
  [...searchParams.entries()].reduce(
    (result, [key, value]) => ({
      ...result,
      [key]: value
    }),
    {}
  )

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

type MoodInfo = {
  label: Mood
  value: Mood
  icon: JSX.Element
}

export const MOODS: Record<Mood, MoodInfo> = {
  Peaceful: {
    label: Mood.PEACEFUL,
    value: Mood.PEACEFUL,
    icon: <i className='emoji dove-of-peace' />
  },
  Romantic: {
    label: Mood.ROMANTIC,
    value: Mood.ROMANTIC,
    icon: <i className='emoji heart-with-arrow' />
  },
  Sentimental: {
    label: Mood.SENTIMENTAL,
    value: Mood.SENTIMENTAL,
    icon: <i className='emoji crying-face' />
  },
  Tender: {
    label: Mood.TENDER,
    value: Mood.TENDER,
    icon: <i className='emoji relieved-face' />
  },
  Easygoing: {
    label: Mood.EASYGOING,
    value: Mood.EASYGOING,
    icon: <i className='emoji slightly-smiling-face' />
  },
  Yearning: {
    label: Mood.YEARNING,
    value: Mood.YEARNING,
    icon: <i className='emoji eyes' />
  },
  Sophisticated: {
    label: Mood.SOPHISTICATED,
    value: Mood.SOPHISTICATED,
    icon: <i className='emoji face-with-monocle' />
  },
  Sensual: {
    label: Mood.SENSUAL,
    value: Mood.SENSUAL,
    icon: <i className='emoji face-throwing-a-kiss' />
  },
  Cool: {
    label: Mood.COOL,
    value: Mood.COOL,
    icon: <i className='emoji smiling-face-with-sunglasses' />
  },
  Gritty: {
    label: Mood.GRITTY,
    value: Mood.GRITTY,
    icon: <i className='emoji pouting-face' />
  },
  Melancholy: {
    label: Mood.MELANCHOLY,
    value: Mood.MELANCHOLY,
    icon: <i className='emoji cloud-with-rain' />
  },
  Serious: {
    label: Mood.SERIOUS,
    value: Mood.SERIOUS,
    icon: <i className='emoji neutral-face' />
  },
  Brooding: {
    label: Mood.BROODING,
    value: Mood.BROODING,
    icon: <i className='emoji thinking-face' />
  },
  Fiery: {
    label: Mood.FIERY,
    value: Mood.FIERY,
    icon: <i className='emoji fire' />
  },
  Defiant: {
    label: Mood.DEFIANT,
    value: Mood.DEFIANT,
    icon: <i className='emoji smiling-face-with-horns' />
  },
  Aggressive: {
    label: Mood.AGGRESSIVE,
    value: Mood.AGGRESSIVE,
    icon: <i className='emoji serious-face-with-symbols-covering-mouth' />
  },
  Rowdy: {
    label: Mood.ROWDY,
    value: Mood.ROWDY,
    icon: <i className='emoji face-with-cowboy-hat' />
  },
  Excited: {
    label: Mood.EXCITED,
    value: Mood.EXCITED,
    icon: <i className='emoji party-popper' />
  },
  Energizing: {
    label: Mood.ENERGIZING,
    value: Mood.ENERGIZING,
    icon: <i className='emoji grinning-face-with-star-eyes' />
  },
  Empowering: {
    label: Mood.EMPOWERING,
    value: Mood.EMPOWERING,
    icon: <i className='emoji flexed-biceps' />
  },
  Stirring: {
    label: Mood.STIRRING,
    value: Mood.STIRRING,
    icon: <i className='emoji astonished-face' />
  },
  Upbeat: {
    label: Mood.UPBEAT,
    value: Mood.UPBEAT,
    icon: <i className='emoji person-raising-both-hands-in-celebration' />
  },
  Other: {
    label: Mood.OTHER,
    value: Mood.OTHER,
    icon: <i className='emoji shrug' />
  }
}
