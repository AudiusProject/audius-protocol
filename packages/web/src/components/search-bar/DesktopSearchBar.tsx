import { useCallback, useEffect, useRef, useState } from 'react'

import {
  imageBlank as placeholderArt,
  imageProfilePicEmpty as profilePicEmpty
} from '@audius/common/assets'
import {
  BadgeTier,
  Kind,
  Name,
  SquareSizes,
  Status,
  User
} from '@audius/common/models'
import { getTierForUser, searchActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  IconArrowRight as IconArrow,
  IconSearch,
  setupHotkeys,
  removeHotkeys,
  IconCloseAlt,
  IconButton,
  Box
} from '@audius/harmony'
import { useTransition, animated } from '@react-spring/web'
import AutoComplete from 'antd/lib/auto-complete'
import Input from 'antd/lib/input'
import cn from 'classnames'
import Lottie from 'lottie-react'
import { useDispatch, useSelector } from 'react-redux'
import { matchPath, useHistory, useLocation } from 'react-router-dom'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { make } from 'common/store/analytics/actions'
import {
  fetchSearch,
  cancelFetchSearch,
  clearSearch
} from 'common/store/search-bar/actions'
import { getSearch } from 'common/store/search-bar/selectors'
import SearchBarResult from 'components/search-bar/SearchBarResult'
import { push } from 'utils/navigation'
import { getPathname } from 'utils/route'

import styles from './DesktopSearchBar.module.css'

const { profilePage, collectionPage, SEARCH_PAGE } = route
const { addItem: addRecentSearch } = searchActions

const SEARCH_BAR_OPTION = 'SEARCH_BAR_OPTION'
const ALL_RESULTS_OPTION = 'ALL_RESULTS_OPTION'
const NO_RESULTS_OPTION = 'NO_RESULTS_OPTION'
const maxLength = 500

const messages = {
  searchTagsTitle: (tag: string) => `Search Tags for ${tag}`,
  searchTagsDisabled: () => 'Search Tags'
}

type TagSearchPopupProps = {
  tag: string
  style?: any
  onClick: () => void
  disabled: boolean
  focused: boolean
}

const TagSearchPopup = ({
  tag,
  style,
  onClick,
  disabled,
  focused
}: TagSearchPopupProps) => (
  <div
    style={style}
    className={styles.tagSearchPopup}
    onClick={() => !disabled && onClick()}
  >
    <div
      className={cn(
        { [styles.enabled]: !disabled },
        { [styles.focused]: focused }
      )}
      tabIndex={-1}
    >
      {messages[disabled ? 'searchTagsDisabled' : 'searchTagsTitle'](tag)}
      {!disabled && <IconArrow className={styles.tagArrow} />}
    </div>
  </div>
)

type SearchBarProps = {
  isViewingSearchPage?: boolean
}

type SearchResultItem = {
  key: string
  primary: string
  secondary?: string
  id: number
  userId: number
  artwork: Record<SquareSizes, string> | null
  size: SquareSizes | null
  defaultImage: any
  isVerifiedUser: boolean
  tier: BadgeTier
  kind: Kind
}

const DesktopSearchBar = ({ isViewingSearchPage = false }: SearchBarProps) => {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [debounce, setDebounce] = useState<NodeJS.Timeout | null>(null)
  const [openAnimationTimeout, setOpenAnimationTimeout] =
    useState<NodeJS.Timeout | null>(null)
  const [shouldDismissTagPopup, setShouldDismissTagPopup] = useState(false)
  const [tagPopupFocused, setTagPopupFocused] = useState(false)

  const autoCompleteRef = useRef<any>()
  const searchBarRef = useRef<HTMLDivElement>(null)

  const dispatch = useDispatch()
  const history = useHistory()
  const location = useLocation()
  const search = useSelector(getSearch)

  useEffect(() => {
    const hook = setupHotkeys({
      191 /* slash */: () => {
        autoCompleteRef.current?.focus()
      }
    })

    return () => {
      removeHotkeys(hook)
    }
  }, [])

  const isTagSearch = useCallback(() => value[0] === '#', [value])

  const handleSubmit = useCallback(
    (value: string) => {
      const pathname = '/search'
      const locationSearchParams = new URLSearchParams(location.search)

      if (value) {
        locationSearchParams.set('query', value)
      } else {
        locationSearchParams.delete('query')
      }

      let newPath = pathname
      const searchMatch = matchPath(getPathname(location), {
        path: SEARCH_PAGE
      })

      if (searchMatch) {
        newPath = searchMatch.url
      }

      value = encodeURIComponent(value)
      history.push({
        pathname: newPath,
        search: locationSearchParams.toString(),
        state: {}
      })
    },
    [history, location]
  )

  const handleSearch = useCallback(
    (searchValue: string, fetch = true) => {
      const trimmedValue = searchValue.slice(0, maxLength)
      if (trimmedValue === value) return
      setValue(trimmedValue)

      // Set the search state but don't actually call search
      dispatch(fetchSearch(trimmedValue))
      // Set a debounce timer for 400ms to actually send the search
      if (debounce) clearTimeout(debounce)
      const newDebounce = setTimeout(() => {
        dispatch(fetchSearch(trimmedValue))
        if (isViewingSearchPage) {
          handleSubmit(trimmedValue)
        }
      }, 400)
      setDebounce(newDebounce)
    },
    [value, dispatch, debounce, isViewingSearchPage, handleSubmit]
  )

  const handleFocus = useCallback(() => {
    setShouldDismissTagPopup(false)
    searchBarRef.current
      ?.getElementsByClassName('ant-select-selection-search')[0]
      ?.classList.add('expanded')
    if (value !== '') {
      // Delay search results open animation while the search bar expands.
      const timeout = setTimeout(() => {
        handleSearch(value)
        setOpen(true)
      }, 200)
      setOpenAnimationTimeout(timeout)
    }
  }, [value, handleSearch])

  const handleBlur = useCallback(() => {
    if (document.hasFocus()) {
      dispatch(cancelFetchSearch())
      // Clear the open animation timeout just in case the user suddenly loses focus on the
      // search bar while an animation to open is happening.
      if (openAnimationTimeout) clearTimeout(openAnimationTimeout)
      if (open) {
        // Delay search bar collapse while search results close.
        setTimeout(() => {
          searchBarRef.current
            ?.getElementsByClassName('ant-select-selection-search')[0]
            ?.classList.remove('expanded')
        }, 200)
      } else {
        searchBarRef.current
          ?.getElementsByClassName('ant-select-selection-search')[0]
          ?.classList.remove('expanded')
      }
      setOpen(false)
    }
  }, [open, openAnimationTimeout, dispatch])

  const handleSelect = useCallback(
    (selectedValue: string) => {
      if (
        selectedValue === SEARCH_BAR_OPTION ||
        selectedValue === ALL_RESULTS_OPTION
      ) {
        // Disallow empty searches.
        if (value !== '') {
          handleSubmit(value)
        }
      } else if (selectedValue !== NO_RESULTS_OPTION) {
        // Have to do this lookup because ant d autocomplete only accepts string values
        const results = search.users
          .map(
            (user) =>
              ({
                key: profilePage(user.handle),
                primary: user.name || user.handle,
                userId: user.user_id,
                id: user.user_id,
                artwork: user.profile_picture,
                size: user.profile_picture_sizes
                  ? SquareSizes.SIZE_150_BY_150
                  : null,
                defaultImage: profilePicEmpty,
                isVerifiedUser: user.is_verified,
                tier: getTierForUser(user as unknown as User),
                kind: Kind.USERS
              }) as SearchResultItem
          )
          .concat(
            search.tracks.map(
              (track) =>
                ({
                  key: track.user ? track.permalink : '',
                  primary: track.title,
                  secondary: track.user ? track.user.name : '',
                  id: track.track_id,
                  userId: track.owner_id,
                  artwork: track.cover_art_sizes,
                  size: track.cover_art_sizes
                    ? SquareSizes.SIZE_150_BY_150
                    : null,
                  defaultImage: placeholderArt,
                  isVerifiedUser: track.user.is_verified,
                  tier: getTierForUser(track.user as unknown as User),
                  kind: Kind.TRACKS
                }) as SearchResultItem
            )
          )
          .concat(
            search.playlists.map(
              (playlist) =>
                ({
                  primary: playlist.playlist_name,
                  secondary: playlist.user ? playlist.user.name : '',
                  key: playlist.user
                    ? collectionPage(
                        playlist.user.handle,
                        playlist.playlist_name,
                        playlist.playlist_id,
                        '',
                        playlist.is_album
                      )
                    : '',
                  id: playlist.playlist_id,
                  userId: playlist.playlist_owner_id,
                  artwork: playlist.cover_art_sizes,
                  size: playlist.cover_art_sizes
                    ? SquareSizes.SIZE_150_BY_150
                    : null,
                  defaultImage: placeholderArt,
                  isVerifiedUser: playlist.user.is_verified,
                  tier: getTierForUser(playlist.user as unknown as User),
                  kind: Kind.COLLECTIONS
                }) as SearchResultItem
            )
          )
          .concat(
            search.albums.map(
              (album) =>
                ({
                  key: album.user
                    ? collectionPage(
                        album.user.handle,
                        album.playlist_name,
                        album.playlist_id,
                        '',
                        true
                      )
                    : '',
                  primary: album.playlist_name,
                  secondary: album.user ? album.user.name : '',
                  id: album.playlist_id,
                  userId: album.playlist_owner_id,
                  artwork: album.cover_art_sizes,
                  size: album.cover_art_sizes
                    ? SquareSizes.SIZE_150_BY_150
                    : null,
                  defaultImage: placeholderArt,
                  isVerifiedUser: album.user.is_verified,
                  tier: getTierForUser(album.user as unknown as User),
                  kind: Kind.COLLECTIONS
                }) as SearchResultItem
            )
          )

        const recentSearch = results.find(({ key }) => key === selectedValue)
        if (recentSearch) {
          dispatch(
            addRecentSearch({
              searchItem: {
                kind: recentSearch.kind,
                id: recentSearch.id
              }
            })
          )
        }
        dispatch(push(selectedValue))
        dispatch(
          make(Name.SEARCH_RESULT_SELECT, {
            term: search.searchText,
            kind: recentSearch?.kind,
            id: recentSearch?.id,
            source: 'autocomplete'
          })
        )
      }
      // Lose focus on the bar, timeout the blur so it pops to the end of the event loop.
      setTimeout(() => {
        autoCompleteRef.current?.blur()
      }, 0)
      handleBlur()
    },
    [
      handleBlur,
      value,
      handleSubmit,
      search.users,
      search.tracks,
      search.playlists,
      search.albums,
      search.searchText,
      dispatch
    ]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Stop up arrow and down arrow from moving the cursor in the text input.
      switch (e.keyCode) {
        case 38 /* up */:
          e.preventDefault()
          setTagPopupFocused(false)
          break
        case 40 /* down */:
          e.preventDefault()
          setTagPopupFocused(true)
          break
        case 27 /* esc */:
          setTagPopupFocused(false)
          autoCompleteRef.current?.blur()
          handleBlur()
          break
        case 13 /* enter */:
          autoCompleteRef.current?.blur()
          setTagPopupFocused(false)
          if (isTagSearch()) setShouldDismissTagPopup(true)
          if ((isTagSearch() && value.length > 1) || !isTagSearch()) {
            handleSubmit(value)
            setDebounce(null)
          }
          break
        default:
      }
    },
    [value, isTagSearch, handleBlur, handleSubmit]
  )

  const handleClear = useCallback(() => {
    dispatch(clearSearch())
    setValue('')

    const locationSearchParams = new URLSearchParams(location.search)
    locationSearchParams.delete('query')

    let newPath = '/search'
    const searchMatch = matchPath(getPathname(location), {
      path: SEARCH_PAGE
    })

    if (searchMatch) {
      newPath = searchMatch.url
    }

    history.push({
      pathname: newPath,
      search: locationSearchParams.toString(),
      state: {}
    })
  }, [dispatch, history, location])

  const renderTitle = (title: string) => (
    <span className={styles.searchResultHeading}>
      {title}
      <div className={styles.customHr} />
    </span>
  )

  const searchResults = [
    {
      title: 'Profiles',
      children: search.users.map(
        (user) =>
          ({
            key: profilePage(user.handle),
            primary: user.name || user.handle,
            userId: user.user_id,
            id: user.user_id,
            artwork: user.profile_picture,
            size: user.profile_picture_sizes
              ? SquareSizes.SIZE_150_BY_150
              : null,
            defaultImage: profilePicEmpty,
            isVerifiedUser: user.is_verified,
            tier: getTierForUser(user as unknown as User),
            kind: Kind.USERS
          }) as SearchResultItem
      )
    },
    {
      title: 'Tracks',
      children: search.tracks.map(
        (track) =>
          ({
            key: track.user ? track.permalink : '',
            primary: track.title,
            secondary: track.user ? track.user.name : '',
            id: track.track_id,
            userId: track.owner_id,
            artwork: track.cover_art_sizes,
            size: track.cover_art_sizes ? SquareSizes.SIZE_150_BY_150 : null,
            defaultImage: placeholderArt,
            isVerifiedUser: track.user.is_verified,
            tier: getTierForUser(track.user as unknown as User),
            kind: Kind.TRACKS
          }) as SearchResultItem
      )
    },
    {
      title: 'Playlists',
      children: search.playlists.map(
        (playlist) =>
          ({
            primary: playlist.playlist_name,
            secondary: playlist.user ? playlist.user.name : '',
            key: playlist.user
              ? collectionPage(
                  playlist.user.handle,
                  playlist.playlist_name,
                  playlist.playlist_id,
                  '',
                  playlist.is_album
                )
              : '',
            id: playlist.playlist_id,
            userId: playlist.playlist_owner_id,
            artwork: playlist.cover_art_sizes,
            size: playlist.cover_art_sizes ? SquareSizes.SIZE_150_BY_150 : null,
            defaultImage: placeholderArt,
            isVerifiedUser: playlist.user.is_verified,
            tier: getTierForUser(playlist.user as unknown as User),
            kind: Kind.COLLECTIONS
          }) as SearchResultItem
      )
    },
    {
      title: 'Albums',
      children: search.albums.map(
        (album) =>
          ({
            key: album.user
              ? collectionPage(
                  album.user.handle,
                  album.playlist_name,
                  album.playlist_id,
                  '',
                  true
                )
              : '',
            primary: album.playlist_name,
            secondary: album.user ? album.user.name : '',
            id: album.playlist_id,
            userId: album.playlist_owner_id,
            artwork: album.cover_art_sizes,
            size: album.cover_art_sizes ? SquareSizes.SIZE_150_BY_150 : null,
            defaultImage: placeholderArt,
            isVerifiedUser: album.user.is_verified,
            tier: getTierForUser(album.user as unknown as User),
            kind: Kind.COLLECTIONS
          }) as SearchResultItem
      )
    }
  ]
    .filter((group) => {
      if (group.children.length < 1) {
        return false
      }
      const vals = group.children
        .slice(0, Math.min(3, group.children.length))
        .filter((opt) => {
          return opt.key || opt.primary
        })
      if (vals.length < 1) {
        return false
      }
      return true
    })
    .map((group) => ({
      label: renderTitle(group.title),
      options: group.children
        .slice(0, Math.min(3, group.children.length))
        .map((opt) => ({
          label: (
            <div className={styles.option} key={opt.key || opt.primary}>
              <SearchBarResult
                kind={opt.kind}
                userId={opt.userId}
                artwork={opt.artwork}
                size={opt.size}
                primary={opt.primary}
                defaultImage={opt.defaultImage}
                secondary={opt.secondary}
                isVerifiedUser={opt.isVerifiedUser}
                tier={opt.tier}
              />
            </div>
          ),
          value: (opt.key || opt.primary).toString()
        }))
    }))

  const resultsCount =
    search.users.length +
    search.tracks.length +
    search.playlists.length +
    search.albums.length

  const options =
    resultsCount > 0
      ? [
          ...searchResults,
          {
            label: (
              <div key={ALL_RESULTS_OPTION} className={styles.allResultsOption}>
                <div className={styles.allResultsOptionWrapper}>
                  <div>
                    <span>View More Results</span>
                    <IconArrow
                      color='default'
                      height={8}
                      width={8}
                      className={styles.iconArrow}
                    />
                  </div>
                </div>
              </div>
            ),
            value: ALL_RESULTS_OPTION
          }
        ]
      : search.status === Status.LOADING && search.searchText !== ''
        ? [
            {
              label: (
                <div key={NO_RESULTS_OPTION} className={styles.noResultsOption}>
                  <div className={styles.noResults}>
                    <span>No Results</span>
                  </div>
                </div>
              ),
              value: NO_RESULTS_OPTION
            }
          ]
        : []

  const showAutocomplete = !isTagSearch() && open && !isViewingSearchPage
  const showTagPopup = isTagSearch() && open && !shouldDismissTagPopup
  const showSpinner = search.status === Status.LOADING && open

  const renderSuffix = () => {
    if (value && !showSpinner) {
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

    if (!isTagSearch() && value) {
      return (
        <div
          className={cn(styles.loadingAnimation, {
            [styles.show]: showSpinner
          })}
        >
          <Lottie loop autoplay animationData={loadingSpinner} />
        </div>
      )
    }
  }

  const transitions = useTransition(showTagPopup, {
    from: { opacity: 0, transform: 'translate(0px, -16px)' },
    enter: { opacity: 1, transform: 'translate(0px, 0px)' },
    leave: { opacity: 0, transform: 'translate(0px, -16px)' },
    config: {
      tension: 310,
      friction: 26
    }
  })

  return (
    <Box>
      <div
        className={styles.searchBar}
        id='search-bar-autocomplete'
        ref={searchBarRef}
      >
        <AutoComplete
          ref={autoCompleteRef}
          dropdownClassName={cn(styles.searchBox, {
            [styles.hasResults]: searchResults.length
          })}
          dropdownMatchSelectWidth={false}
          options={options}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSelect={handleSelect}
          onSearch={handleSearch}
          onChange={() => {
            if (debounce) clearTimeout(debounce)
          }}
          open={showAutocomplete}
          value={value}
          getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
        >
          <Input
            placeholder='Search'
            name='search'
            autoComplete='off'
            type='search'
            prefix={
              <IconSearch color='subdued' onClick={() => handleSubmit('')} />
            }
            suffix={renderSuffix()}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />
        </AutoComplete>
        {transitions(
          (style, item) =>
            item && (
              <animated.div style={style}>
                <TagSearchPopup
                  tag={value}
                  onClick={() => handleSubmit(value)}
                  disabled={value.length < 2}
                  focused={tagPopupFocused}
                />
              </animated.div>
            )
        )}
      </div>
    </Box>
  )
}

export default DesktopSearchBar
