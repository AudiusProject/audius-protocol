import { useCallback, useEffect, useState } from 'react'

import type { CreateChatModalState, User } from '@audius/common'
import {
  FOLLOWERS_USER_LIST_TAG,
  Status,
  accountSelectors,
  cacheUsersSelectors,
  chatActions,
  followersUserListActions,
  followersUserListSelectors,
  searchUsersModalActions,
  searchUsersModalSelectors,
  statusIsNotFinalized,
  chatSelectors,
  useProxySelector,
  userListActions
} from '@audius/common'
import { View, Image } from 'react-native'
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view'
import { useDispatch, useSelector } from 'react-redux'
import { useDebounce } from 'react-use'

import { IconCompose, IconSearch } from '@audius/harmony-native'
import MagnifyingGlass from 'app/assets/images/leftPointingMagnifyingGlass.png'
import { Screen, ScreenContent, Text, TextInput } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'

import { ChatUserListItem } from './ChatUserListItem'
import { HeaderShadow } from './HeaderShadow'

const { getAccountUser } = accountSelectors
const { searchUsers } = searchUsersModalActions
const { getUserList } = searchUsersModalSelectors
const { getUsers } = cacheUsersSelectors
const { fetchBlockees, fetchBlockers, fetchPermissions } = chatActions
const { getUserList: getChatsUserList } = chatSelectors
const { getUserList: getFollowersUserList } = followersUserListSelectors

const DEBOUNCE_MS = 150

const messages = {
  title: 'New Message',
  search: ' Search Users',
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
    paddingHorizontal: spacing(2),
    paddingBottom: spacing(2)
  },
  searchBorder: {
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1
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
  flatListContainer: {
    minHeight: '100%',
    flexGrow: 1
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
  },
  footerPadding: {
    height: spacing(30)
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

const useDefaultUserList = (
  defaultUserList: CreateChatModalState['defaultUserList']
) => {
  const dispatch = useDispatch()
  const currentUser = useSelector(getAccountUser)
  const followersUserList = useSelector(getFollowersUserList)
  const chatsUserList = useSelector(getChatsUserList)

  const { hasMore, loading, userIds } =
    defaultUserList === 'chats' ? chatsUserList : followersUserList

  const loadMore = useCallback(() => {
    if (currentUser) {
      dispatch(followersUserListActions.setFollowers(currentUser?.user_id))
      dispatch(userListActions.loadMore(FOLLOWERS_USER_LIST_TAG))
    }
  }, [dispatch, currentUser])

  useEffect(() => {
    loadMore()
  }, [loadMore])

  return {
    hasMore,
    loadMore,
    // Emulating Status behavior for consistency below. UserList has a legacy
    // pattern with errorSagas and doesn't use Status directly
    status: loading ? Status.LOADING : Status.SUCCESS,
    userIds
  }
}

const useQueryUserList = (query: string) => {
  const dispatch = useDispatch()
  const { userIds, status, hasMore } = useSelector(getUserList)

  const loadMore = useCallback(() => {
    dispatch(searchUsers({ query }))
  }, [query, dispatch])

  useEffect(() => {
    loadMore()
  }, [loadMore])

  return { hasMore, loadMore, status, userIds }
}

export const ChatUserListScreen = () => {
  const styles = useStyles()
  const [query, setQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const dispatch = useDispatch()
  const { params } = useRoute<'ChatUserList'>()
  const presetMessage = params?.presetMessage
  const defaultUserListType = params?.defaultUserList
  const defaultUserList = useDefaultUserList(defaultUserListType)
  const queryUserList = useQueryUserList(query)

  const hasQuery = query.length > 0

  const { hasMore, loadMore, status, userIds } = hasQuery
    ? queryUserList
    : defaultUserList

  const users = useProxySelector(
    (state) => {
      const ids = userIds
      const users = getUsers(state, { ids })
      return ids.map((id) => users[id])
    },
    [userIds]
  )

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
      setQuery(inputValue)
    },
    DEBOUNCE_MS,
    [inputValue, setQuery, dispatch]
  )

  const handleClear = useCallback(() => {
    setInputValue('')
    setQuery('')
  }, [setQuery])

  const handleLoadMore = useCallback(() => {
    if (status !== Status.LOADING && hasMore) {
      loadMore()
    }
  }, [status, loadMore, hasMore])

  const isLoading = statusIsNotFinalized(status) && userIds.length === 0

  return (
    <Screen
      url='/chat'
      title={messages.title}
      icon={IconCompose}
      variant='secondary'
      topbarRight={null}
    >
      <ScreenContent>
        <HeaderShadow />
        <View style={styles.rootContainer}>
          <View
            style={[
              styles.searchContainer,
              // Only show the border below the search input if
              // there are scrollable users below
              users?.length ? styles.searchBorder : null
            ]}
          >
            <TextInput
              placeholder={messages.search}
              autoFocus={true}
              Icon={IconSearch}
              styles={{
                root: styles.searchInputContainer,
                input: styles.searchInputText
              }}
              iconProp={styles.icon}
              onChangeText={setInputValue}
              value={inputValue}
              inputAccessoryViewID='none'
              clearable={true}
              onClear={handleClear}
            />
          </View>

          {isLoading ? (
            <View style={styles.spinnerContainer}>
              <LoadingSpinner style={styles.loadingSpinner} />
            </View>
          ) : (
            <KeyboardAwareFlatList
              onEndReached={handleLoadMore}
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              data={users}
              renderItem={({ item }) => (
                <ChatUserListItem
                  userId={item.user_id}
                  presetMessage={presetMessage}
                />
              )}
              keyExtractor={(user: User) => user.handle}
              contentContainerStyle={styles.flatListContainer}
              // Only show empty component if there is no search query
              ListEmptyComponent={query ? null : <ListEmpty />}
              keyboardShouldPersistTaps='always'
              ListFooterComponent={<View style={styles.footerPadding} />}
            />
          )}
        </View>
      </ScreenContent>
    </Screen>
  )
}
