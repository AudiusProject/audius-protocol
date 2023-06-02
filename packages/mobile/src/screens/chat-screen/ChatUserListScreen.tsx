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
import { View, Image } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useDebounce } from 'react-use'

import IconCompose from 'app/assets/images/iconCompose.svg'
import IconSearch from 'app/assets/images/iconSearch.svg'
import MagnifyingGlass from 'app/assets/images/leftPointingMagnifyingGlass.png'
import {
  Screen,
  Text,
  FlatList,
  ScreenContent,
  TextInput
} from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { ChatUserListItem } from './ChatUserListItem'

const { searchUsers } = searchUsersModalActions
const { getUserList } = searchUsersModalSelectors
const { getUsers } = cacheUsersSelectors
const { fetchBlockees, fetchBlockers, fetchPermissions } = chatActions

const DEBOUNCE_MS = 100

const messages = {
  title: 'New Message',
  search: 'Search Users',
  emptyTitle: 'Search for Friends',
  emptyDescription:
    'Search for fellow music lovers and strike up a conversation.'
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
  searchInputContainer: {
    paddingRight: spacing(5),
    paddingLeft: spacing(4),
    paddingVertical: spacing(6)
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
  },
  emptyContainer: {
    marginTop: spacing(6),
    margin: spacing(2),
    padding: spacing(6),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(6),
    backgroundColor: palette.neutralLight10,
    borderRadius: spacing(2),
    borderColor: palette.background,
    borderWidth: 1
  },
  emptyTextContainer: {
    flexShrink: 1,
    gap: spacing(2)
  },
  magnifyingGlass: {
    height: spacing(16),
    width: spacing(16)
  },
  emptyTitle: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontByWeight.bold,
    lineHeight: typography.fontSize.xxl * 1.3
  },
  emptyDescription: {
    fontSize: typography.fontSize.large,
    lineHeight: typography.fontSize.large * 1.3
  },
  icon: {
    height: spacing(6),
    width: spacing(6)
  }
}))

const ListEmpty = () => {
  const styles = useStyles()

  return (
    <View style={styles.emptyContainer}>
      <Image source={MagnifyingGlass} style={styles.magnifyingGlass} />
      <View style={styles.emptyTextContainer}>
        <Text style={styles.emptyTitle}>{messages.emptyTitle}</Text>
        <Text style={styles.emptyDescription}>{messages.emptyDescription}</Text>
      </View>
    </View>
  )
}

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

  const handleClear = useCallback(() => {
    setQuery('')
  }, [setQuery])

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
              Icon={IconSearch}
              styles={{
                root: styles.searchInputContainer,
                input: styles.searchInputText
              }}
              iconProp={styles.icon}
              onChangeText={handleChange}
              value={query}
              inputAccessoryViewID='none'
              clearable={true}
              onClear={handleClear}
            />
          </View>

          {!isLoading ? (
            <FlatList
              onEndReached={handleLoadMore}
              data={users}
              renderItem={({ item }) => <ChatUserListItem user={item} />}
              keyExtractor={(user: User) => user.handle}
              contentContainerStyle={styles.flatListContainer}
              ListEmptyComponent={<ListEmpty />}
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
