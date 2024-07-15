import { useMemo } from 'react'

import {
  SearchCategory,
  useGetSearchResults as useGetSearchResultsApi
} from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  SearchSortMethod,
  accountSelectors,
  searchResultsPageActions
} from '@audius/common/store'
import { Genre, Mood } from '@audius/sdk'
import { useDispatch, useSelector } from 'react-redux'
import { useRouteMatch } from 'react-router-dom'
import { useSearchParams as useParams } from 'react-router-dom-v5-compat'

import { SEARCH_PAGE } from 'utils/route'

import { CategoryView } from './types'

const { getUserId } = accountSelectors
const { fetchSearchPageResultsSucceeded } = searchResultsPageActions

type SearchResultsApiType = ReturnType<typeof useGetSearchResultsApi>

type SearchResultsType<C extends SearchCategory> = {
  status: SearchResultsApiType['status']
  data: C extends 'all'
    ? SearchResultsApiType['data']
    : SearchResultsApiType['data'][Exclude<C, 'all'>]
}

export const useGetSearchResults = <C extends SearchCategory>(
  category: C
): SearchResultsType<C> => {
  const { query, category: ignoredCategory, ...filters } = useSearchParams()
  const dispatch = useDispatch()

  const currentUserId = useSelector(getUserId)
  const { isEnabled: isUSDCEnabled } = useFeatureFlag(
    FeatureFlags.USDC_PURCHASES
  )
  const { data, status } = useGetSearchResultsApi(
    {
      query: query || '',
      ...filters,
      category,
      currentUserId,
      limit: category === 'all' ? 12 : undefined,
      includePurchaseable: isUSDCEnabled
    },
    { debounce: 500 }
  )

  if (category === 'all') {
    if (status === Status.SUCCESS) {
      // We need to populate the legacy search store so the tracks lineup
      // can be populated
      const results = {
        users: data.users.map(({ user_id: id }) => id),
        tracks: data.tracks.map(({ track_id: id }) => id),
        albums: data.albums.map(({ playlist_id: id }) => id),
        playlists: data.playlists.map(({ playlist_id: id }) => id)
      }

      dispatch(
        fetchSearchPageResultsSucceeded({
          results,
          searchText: query ?? ''
        })
      )
    }

    return { data, status } as SearchResultsType<C>
  } else {
    return {
      data: data?.[category as Exclude<C, 'all'>],
      status
    } as SearchResultsType<C>
  }
}

export const useSearchParams = () => {
  const [urlSearchParams] = useParams()

  const routeMatch = useRouteMatch<{ category: string }>(SEARCH_PAGE)
  const category =
    (routeMatch?.params.category as CategoryView) || CategoryView.ALL
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
      category,
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
      category,
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
