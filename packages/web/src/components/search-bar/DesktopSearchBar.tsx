import { useCallback, useState, useRef, useEffect, useMemo } from 'react'

import { useSearchAutocomplete } from '@audius/common/api'
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
import { useDebounce, usePrevious } from 'react-use'

import { searchResultsPage } from 'utils/route'

import styles from './DesktopSearchBar.module.css'
import { UserResult, TrackResult, CollectionResult } from './SearchBarResult'
const { SEARCH_PAGE } = route

const DEFAULT_LIMIT = 3
const DEBOUNCE_MS = 400

const messages = {
  viewMoreResults: 'View More Results',
  noResults: 'No Results',
  searchPlaceholder: 'Search',
  clearSearch: 'Clear search',
  categories: {
    profiles: 'Profiles',
    tracks: 'Tracks',
    playlists: 'Playlists',
    albums: 'Albums'
  }
}

const ViewMoreButton = ({ query }: { query: string }) => (
  <Flex
    as={Link}
    // @ts-expect-error
    to={searchResultsPage('all', query)}
    alignItems='center'
    ph='l'
    pv='m'
    gap='2xs'
    css={{
      cursor: 'pointer'
    }}
  >
    <Text variant='label' size='s' color='subdued' className={styles.primary}>
      {messages.viewMoreResults}
    </Text>
    <IconArrowRight size='s' color='subdued' className={styles.iconArrow} />
  </Flex>
)

const NoResults = () => (
  <Flex alignItems='center' ph='l' pv='m'>
    <Text variant='label' size='s' color='subdued'>
      {messages.noResults}
    </Text>
  </Flex>
)

export const DesktopSearchBar = () => {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('query') || ''

  const [inputValue, setInputValue] = useState(initialQuery)
  const [debouncedValue, setDebouncedValue] = useState(inputValue)
  useDebounce(
    () => {
      setDebouncedValue(inputValue)
    },
    DEBOUNCE_MS,
    [inputValue]
  )

  const inputRef = useRef<InputRef>(null)
  const history = useHistory()

  const isSearchPage = !!matchPath(location.pathname, { path: SEARCH_PAGE })

  const { data, isLoading } = useSearchAutocomplete(
    { query: debouncedValue, limit: DEFAULT_LIMIT },
    { enabled: !isSearchPage }
  )
  const previousDebouncedValue = usePrevious(debouncedValue)
  useEffect(() => {
    if (isSearchPage && debouncedValue !== previousDebouncedValue) {
      const newParams = new URLSearchParams(searchParams)
      newParams.set('query', debouncedValue)
      setSearchParams(newParams)
    }
  }, [
    debouncedValue,
    isSearchPage,
    setSearchParams,
    previousDebouncedValue,
    searchParams
  ])

  const handleSearch = useCallback((value: string) => {
    setInputValue(value)
  }, [])

  const handleClear = useCallback(() => {
    setInputValue('')
  }, [])

  const handleSelect = useCallback(() => {
    setInputValue('')
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        if (isSearchPage) {
          const newParams = new URLSearchParams(searchParams)
          newParams.set('query', debouncedValue)
          setSearchParams(newParams)
        } else {
          history.push(searchResultsPage('all', inputValue))
        }
      }
    },
    [
      debouncedValue,
      history,
      inputValue,
      isSearchPage,
      searchParams,
      setSearchParams
    ]
  )

  const renderSuffix = () => {
    if (inputValue && !isLoading) {
      return (
        <IconButton
          icon={IconCloseAlt}
          size='2xs'
          color='subdued'
          onClick={handleClear}
          aria-label={messages.clearSearch}
        />
      )
    }

    if (inputValue && isLoading) {
      return <LoadingSpinner size='s' />
    }
  }

  const options = useMemo(() => {
    if (!data) return []

    const baseOptions = [
      {
        label: messages.categories.profiles,
        options: data.users.map((user) => ({
          label: <UserResult user={user} />,
          value: user.user_id
        }))
      },
      {
        label: messages.categories.tracks,
        options: data.tracks.map((track) => ({
          label: <TrackResult track={track} />,
          value: track.track_id
        }))
      },
      {
        label: messages.categories.playlists,
        options: data.playlists.map((playlist) => ({
          label: <CollectionResult collection={playlist} />,
          value: playlist.playlist_id
        }))
      },
      {
        label: messages.categories.albums,
        options: data.albums.map((album) => ({
          label: <CollectionResult collection={album} />,
          value: album.playlist_id
        }))
      }
    ].filter((group) => group.options.length > 0)

    const hasNoResults = inputValue && baseOptions.length === 0
    const hasResults = baseOptions.length > 0

    if (hasResults && inputValue) {
      baseOptions.push({
        options: [
          {
            label: <ViewMoreButton query={inputValue} />,
            // @ts-expect-error
            value: 'viewMore'
          }
        ]
      })
    } else if (hasNoResults) {
      baseOptions.push({
        options: [
          {
            label: <NoResults />,
            // @ts-expect-error
            value: 'no-results'
          }
        ]
      })
    }

    return baseOptions
  }, [data, inputValue])

  const showResults = !isSearchPage && !!(data || isLoading)
  // Calculate hasNoResults for the dropdown class name
  const hasNoResults =
    data &&
    inputValue &&
    options.length === 1 &&
    String(options[0].options?.[0]?.value) === 'no-results'

  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = useCallback(() => {
    const searchElement = inputRef.current?.input?.closest(
      '.ant-select-selection-search'
    )
    if (searchElement) {
      searchElement.classList.add('expanded')
    }
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    if (!document.hasFocus()) return

    const searchElement = inputRef.current?.input?.closest(
      '.ant-select-selection-search'
    )
    if (searchElement) {
      setTimeout(
        () => searchElement.classList.remove('expanded'),
        // Wait for dropdown to close before contracting
        showResults ? 100 : 0
      )
    }
    setIsFocused(false)
  }, [showResults])

  return (
    <Flex className={styles.searchBar}>
      <AutoComplete
        dropdownClassName={cn(styles.searchBox, {
          [styles.searchBoxEmpty]: hasNoResults
        })}
        dropdownMatchSelectWidth={false}
        options={options}
        value={inputValue}
        onSearch={handleSearch}
        onSelect={handleSelect}
        getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
        open={showResults && isFocused}
      >
        <Input
          inputMode='search'
          ref={inputRef}
          placeholder={messages.searchPlaceholder}
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
