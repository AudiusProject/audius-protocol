import { useCallback, useState, useRef, useEffect } from 'react'

import { useSearchAutocomplete } from '@audius/common/src/api/tan-query/useSearchAutocomplete'
import { route } from '@audius/common/utils'
import {
  IconSearch,
  IconCloseAlt,
  IconButton,
  IconArrowRight,
  Flex,
  LoadingSpinner,
  Text
} from '@audius/harmony'
import AutoComplete from 'antd/lib/auto-complete'
import Input from 'antd/lib/input'
import type { InputRef } from 'antd/lib/input'
import cn from 'classnames'
import { Link, useHistory, useLocation, matchPath } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom-v5-compat'
import { useThrottle } from 'react-use'

import { searchResultsPage } from 'utils/route'

import styles from './DesktopSearchBar.module.css'
import { UserResult, TrackResult, CollectionResult } from './SearchBarResult'
const { SEARCH_PAGE } = route

const DEFAULT_LIMIT = 3
const THROTTLE_MS = 400

const ViewMoreButton = ({ query }: { query: string }) => (
  <Link to={searchResultsPage('all', query)}>
    <Flex
      alignItems='center'
      ph='l'
      pv='m'
      gap='2xs'
      css={{
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'var(--neutral-light-8)'
        }
      }}
    >
      <Text variant='label' size='s' color='subdued'>
        View More Results
      </Text>
      <IconArrowRight size='s' color='subdued' />
    </Flex>
  </Link>
)

const NoResults = () => (
  <Flex alignItems='center' ph='l' pv='m'>
    <Text variant='label' size='s' color='subdued'>
      No Results
    </Text>
  </Flex>
)

export const DesktopSearchBar = () => {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('query') || ''

  const [inputValue, setInputValue] = useState(initialQuery)
  const throttledValue = useThrottle(inputValue, THROTTLE_MS)
  const inputRef = useRef<InputRef>(null)
  const history = useHistory()

  const isSearchPage = !!matchPath(location.pathname, { path: SEARCH_PAGE })

  const { data, isLoading } = useSearchAutocomplete(
    { query: throttledValue, limit: DEFAULT_LIMIT },
    { enabled: !isSearchPage }
  )

  useEffect(() => {
    if (isSearchPage) {
      setSearchParams({ query: throttledValue })
    }
  }, [throttledValue, isSearchPage, setSearchParams])

  const handleSearch = useCallback((value: string) => {
    setInputValue(value)
  }, [])

  const handleClear = useCallback(() => {
    setInputValue('')
  }, [])

  const handleFocus = useCallback(() => {
    const searchElement = inputRef.current?.input?.closest(
      '.ant-select-selection-search'
    )
    if (searchElement) {
      searchElement.classList.add('expanded')
    }
  }, [])

  const handleBlur = useCallback(() => {
    const searchElement = inputRef.current?.input?.closest(
      '.ant-select-selection-search'
    )
    if (searchElement) {
      searchElement.classList.remove('expanded')
    }
  }, [])

  const handleSelect = useCallback(() => {
    setInputValue('')
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        if (isSearchPage) {
          setSearchParams({ query: inputValue })
        } else {
          history.push(searchResultsPage('all', inputValue))
        }
      }
    },
    [history, inputValue, isSearchPage, setSearchParams]
  )

  const renderSuffix = () => {
    if (inputValue && !isLoading) {
      return (
        <IconButton
          icon={IconCloseAlt}
          size='2xs'
          color='subdued'
          onClick={handleClear}
          aria-label='Clear search'
        />
      )
    }

    if (inputValue && isLoading) {
      return <LoadingSpinner size='s' />
    }
  }

  const options = data
    ? [
        {
          label: 'Profiles',
          options: data.users.map((user) => ({
            label: <UserResult user={user} />,
            value: user.user_id
          }))
        },
        {
          label: 'Tracks',
          options: data.tracks.map((track) => ({
            label: <TrackResult track={track} />,
            value: track.track_id
          }))
        },
        {
          label: 'Playlists',
          options: data.playlists.map((playlist) => ({
            label: <CollectionResult collection={playlist} />,
            value: playlist.playlist_id
          }))
        },
        {
          label: 'Albums',
          options: data.albums.map((album) => ({
            label: <CollectionResult collection={album} />,
            value: album.playlist_id
          }))
        }
      ].filter((group) => group.options.length > 0)
    : []

  const showResults = !isSearchPage && (data || isLoading)
  const hasNoResults = data && inputValue && options.length === 0
  const hasResults = data && options.length > 0

  const viewMoreOption =
    hasResults && inputValue
      ? [
          {
            options: [
              {
                label: <ViewMoreButton query={inputValue} />,
                value: 'viewMore'
              }
            ]
          }
        ]
      : []

  const noResultsOption = hasNoResults
    ? [{ options: [{ label: <NoResults />, value: 'no-results' }] }]
    : []

  return (
    <Flex className={styles.searchBar}>
      <AutoComplete
        dropdownClassName={cn(styles.searchBox, {
          [styles.searchBoxEmpty]: hasNoResults
        })}
        dropdownMatchSelectWidth={false}
        options={
          showResults ? [...options, ...viewMoreOption, ...noResultsOption] : []
        }
        value={inputValue}
        onSearch={handleSearch}
        onSelect={handleSelect}
        getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
      >
        <Input
          inputMode='search'
          ref={inputRef}
          placeholder='Search'
          name='search'
          autoComplete='off'
          type='search'
          prefix={<IconSearch color='subdued' />}
          suffix={renderSuffix()}
          spellCheck={false}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </AutoComplete>
    </Flex>
  )
}
