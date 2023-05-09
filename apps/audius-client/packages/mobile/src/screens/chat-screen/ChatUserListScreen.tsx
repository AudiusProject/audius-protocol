import { useState, useCallback, useEffect } from 'react'

import type { User, ID } from '@audius/common'
import {
  searchUsersModalSelectors,
  searchUsersModalActions,
  useProxySelector,
  chatActions,
  cacheUsersSelectors,
  Status
} from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useDebounce } from 'react-use'

import IconCompose from 'app/assets/images/iconCompose.svg'
import IconSearch from 'app/assets/images/iconSearch.svg'
import { Screen, FlatList, ScreenContent, TextInput } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { ChatUserListItem } from './ChatUserListItem'

const { searchUsers } = searchUsersModalActions
const { getUserList } = searchUsersModalSelectors
const { getUsers } = cacheUsersSelectors
const { fetchBlockees, fetchBlockers, fetchPermissions } = chatActions

const DEBOUNCE_MS = 100

const messages = {
  title: 'New Message',
  search: 'Search Users'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootContainer: {
    backgroundColor: palette.white,
    flexGrow: 1
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1
  },
  loadingSpinner: {
    height: spacing(15),
    width: spacing(15),
    marginBottom: spacing(20)
  },
  searchContainer: {
    marginTop: spacing(8),
    marginHorizontal: spacing(2),
    marginBottom: spacing(2)
  },
  searchIcon: {
    width: spacing(5),
    height: spacing(5)
  },
  searchInputContainer: {
    paddingRight: spacing(5),
    paddingLeft: spacing(4),
    paddingVertical: spacing(5)
  },
  searchInputText: {
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.large
  },
  profilePicture: {
    height: spacing(18),
    width: spacing(18)
  },
  shadow: {
    borderBottomColor: palette.neutralLight6,
    borderBottomWidth: 3,
    borderBottomLeftRadius: 1
  },
  flatListContainer: {
    minHeight: '100%'
  }
}))

type ChatUserListScreenProps = {
  debounceMs?: number
  defaultUserList?: {
    userIds: ID[]
    loadMore: () => void
    loading: boolean
  }
}

export const ChatUserListScreen = (props: ChatUserListScreenProps) => {
  const {
    debounceMs = DEBOUNCE_MS,
    defaultUserList = {
      userIds: [],
      loading: false,
      loadMore: () => {}
    }
  } = props
  const styles = useStyles()
  const palette = useThemeColors()
  const [query, setQuery] = useState('')
  const [hasQuery, setHasQuery] = useState(false)
  const dispatch = useDispatch()

  const { userIds, hasMore, status } = useSelector(getUserList)
  const users = useProxySelector(
    (state) => {
      const ids = hasQuery ? userIds : defaultUserList.userIds
      const users = getUsers(state, { ids })
      return ids.map((id) => users[id])
    },
    [hasQuery, userIds]
  )
  const isLoading =
    hasQuery && status === Status.LOADING && userIds.length === 0

  useEffect(() => {
    dispatch(fetchBlockees())
    dispatch(fetchBlockers())
  }, [dispatch])

  useEffect(() => {
    if (userIds.length > 0) {
      dispatch(fetchPermissions({ userIds }))
    }
  }, [dispatch, userIds])

  useDebounce(
    () => {
      dispatch(searchUsers({ query }))
      setHasQuery(!!query)
    },
    debounceMs,
    [query, setHasQuery, dispatch]
  )

  const handleChange = useCallback(
    (text: string) => {
      setQuery(text)
    },
    [setQuery]
  )

  const handleLoadMore = useCallback(() => {
    if (status === Status.LOADING || defaultUserList.loading || !hasMore) {
      return
    }
    if (hasQuery) {
      dispatch(searchUsers({ query }))
    } else {
      defaultUserList.loadMore()
    }
  }, [status, defaultUserList, hasMore, hasQuery, dispatch, query])

  return (
    <Screen
      url='/chat'
      title={messages.title}
      icon={IconCompose}
      variant='secondary'
      topbarRight={null}
    >
      <ScreenContent>
        <View style={styles.shadow} />
        <View style={styles.rootContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder={messages.search}
              Icon={() => (
                <IconSearch
                  fill={palette.neutralLight4}
                  width={styles.searchIcon.width}
                  height={styles.searchIcon.height}
                />
              )}
              styles={{
                root: styles.searchInputContainer,
                input: styles.searchInputText
              }}
              onChangeText={handleChange}
              value={query}
              inputAccessoryViewID='none'
            />
          </View>

          {!isLoading ? (
            <FlatList
              onEndReached={handleLoadMore}
              data={users}
              renderItem={({ item }) => <ChatUserListItem user={item} />}
              keyExtractor={(user: User) => user.handle}
              contentContainerStyle={styles.flatListContainer}
            />
          ) : (
            <View style={styles.spinnerContainer}>
              <LoadingSpinner style={styles.loadingSpinner} />
            </View>
          )}
        </View>
      </ScreenContent>
    </Screen>
  )
}
