import { useState, useCallback } from 'react'

import type { ID } from '@audius/common'
import {
  searchUsersModalSelectors,
  searchUsersModalActions,
  useProxySelector,
  cacheUsersSelectors,
  chatActions,
  Status
} from '@audius/common'
import { Text, View } from 'react-native'
import { TouchableHighlight } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { useDebounce } from 'react-use'

import IconCompose from 'app/assets/images/iconCompose.svg'
import IconSearch from 'app/assets/images/iconSearch.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import { Screen, FlatList, ScreenContent, TextInput } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { ProfilePicture } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const { searchUsers } = searchUsersModalActions
const { getUserList } = searchUsersModalSelectors
const { getUsers } = cacheUsersSelectors
const { createChat } = chatActions

const DEBOUNCE_MS = 100

const messages = {
  title: 'New Message',
  search: 'Search Users',
  followsYou: 'Follows You',
  followers: 'Followers'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootContainer: {
    backgroundColor: palette.white,
    flexGrow: 1
  },
  loadingSpinner: {
    height: spacing(20),
    width: spacing(20),
    alignSelf: 'center'
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
    paddingRight: spacing(4.5),
    paddingVertical: spacing(4.5)
  },
  searchInputText: {
    fontFamily: typography.fontByWeight.bold,
    fontSize: typography.fontSize.large
  },
  profilePicture: {
    height: spacing(18),
    width: spacing(18)
  },
  userContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(4),
    borderBottomColor: palette.neutralLight4,
    borderBottomWidth: 1
  },
  userNameContainer: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    marginLeft: spacing(2.5)
  },
  userName: {
    fontSize: typography.fontSize.small,
    fontWeight: 'bold',
    color: palette.neutral
  },
  followContainer: {
    marginTop: spacing(1),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  handle: {
    fontSize: typography.fontSize.small,
    color: palette.neutral
  },
  followersContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  followersCount: {
    fontWeight: '800',
    marginHorizontal: spacing(1),
    color: palette.neutralLight4,
    fontSize: typography.fontSize.small
  },
  followers: {
    color: palette.neutralLight4,
    fontSize: typography.fontSize.small
  },
  iconUser: {
    height: spacing(4),
    width: spacing(4)
  },
  followsYouTag: {
    fontSize: typography.fontSize.xxs,
    fontFamily: typography.fontByWeight.heavy,
    letterSpacing: 0.64,
    textTransform: 'uppercase',
    color: palette.neutralLight4,
    borderWidth: 1,
    borderRadius: spacing(1),
    borderColor: palette.neutralLight4,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2)
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

  const { userIds, status } = useSelector(getUserList)
  const users = useProxySelector(
    (state) => {
      const ids = hasQuery ? userIds : defaultUserList.userIds
      const users = getUsers(state, { ids })
      return ids.map((id) => users[id])
    },
    [hasQuery, userIds]
  )

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
    if (status === Status.LOADING || defaultUserList.loading) {
      return
    }
    if (hasQuery) {
      dispatch(searchUsers({ query }))
    } else {
      defaultUserList.loadMore()
    }
  }, [hasQuery, query, status, defaultUserList, dispatch])

  const handlePress = (item) => {
    dispatch(createChat({ userIds: [item.user_id] }))
  }

  const renderItem = ({ item, index }) => {
    if (!item) {
      return <LoadingSpinner />
    }

    return (
      <TouchableHighlight onPress={() => handlePress(item)}>
        <View style={styles.userContainer} key={item.key}>
          <ProfilePicture profile={item} style={styles.profilePicture} />
          <View style={styles.userNameContainer}>
            <UserBadges user={item} nameStyle={styles.userName} />
            <Text style={styles.handle}>@{item.handle}</Text>
            <View style={styles.followContainer}>
              <View style={styles.followersContainer}>
                <IconUser
                  fill={palette.neutralLight4}
                  height={styles.iconUser.height}
                  width={styles.iconUser.width}
                />
                <Text style={styles.followersCount}>{item.follower_count}</Text>
                <Text style={styles.followers}>{messages.followers}</Text>
              </View>
              {item.does_follow_current_user ? (
                <Text style={styles.followsYouTag}>{messages.followsYou}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }

  return (
    <Screen
      url='/chat'
      title={messages.title}
      icon={IconCompose}
      variant='secondary'
      topbarRight={null}
    >
      <ScreenContent>
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
            />
          </View>

          {users.length > 0 ? (
            <FlatList
              onEndReached={handleLoadMore}
              data={users}
              renderItem={renderItem}
              keyExtractor={(user) => user.user_id}
            />
          ) : (
            <LoadingSpinner style={styles.loadingSpinner} />
          )}
        </View>
      </ScreenContent>
    </Screen>
  )
}
