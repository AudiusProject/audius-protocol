import { useCallback, useEffect, useRef, useState } from 'react'

import { ShareSource, Status } from '@audius/common/models'
import {
  profilePageActions,
  profilePageSelectors,
  reachabilitySelectors,
  shareModalUIActions,
  modalsActions,
  profilePageTracksLineupActions,
  ProfilePageTabs,
  profilePageFeedLineupActions
} from '@audius/common/store'
import { encodeUrlName } from '@audius/common/utils'
import { PortalHost } from '@gorhom/portal'
import { useFocusEffect, useNavigationState } from '@react-navigation/native'
import { Animated, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import {
  IconButton,
  IconKebabHorizontal,
  IconShare
} from '@audius/harmony-native'
import { Screen, ScreenContent } from 'app/components/core'
import { ScreenSecondaryContent } from 'app/components/core/Screen/ScreenSecondaryContent'
import { useIsScreenReady } from 'app/components/core/Screen/hooks/useIsScreenReady'
import { OfflinePlaceholder } from 'app/components/offline-placeholder'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'

import { ProfileHeader } from './ProfileHeader'
import {
  ProfileScreenSkeleton,
  ProfileTabsSkeleton
} from './ProfileScreenSkeleton'
import { ProfileTabNavigator } from './ProfileTabs/ProfileTabNavigator'
import { getIsOwner, useSelectProfileRoot } from './selectors'
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const {
  fetchProfile: fetchProfileAction,
  setCurrentUser: setCurrentUserAction,
  fetchCollections
} = profilePageActions
const { getProfileStatus } = profilePageSelectors
const { getIsReachable } = reachabilitySelectors
const { setVisibility } = modalsActions

const useStyles = makeStyles(() => ({
  navigator: {
    height: '100%'
  }
}))

export const ProfileScreen = () => {
  const styles = useStyles()
  const { params } = useRoute<'Profile'>()
  const { handle: userHandle, id } = params
  const profile = useSelectProfileRoot([
    'user_id',
    'handle',
    'track_count',
    'does_current_user_follow'
  ])
  const handle =
    userHandle && userHandle !== 'accountUser' ? userHandle : profile?.handle
  const handleLower = handle?.toLowerCase() ?? ''
  const isOwner = useSelector((state) => getIsOwner(state, handle ?? ''))
  const dispatch = useDispatch()
  const status = useSelector((state) => getProfileStatus(state, handleLower))
  const [isRefreshing, setIsRefreshing] = useState(false)
  const isNotReachable = useSelector(getIsReachable) === false
  const isScreenReady = useIsScreenReady()

  const setCurrentUser = useCallback(() => {
    dispatch(setCurrentUserAction(handleLower))
  }, [dispatch, handleLower])

  const currentTab = useNavigationState((state) => {
    const tabIndex = state.routes[1].state?.index
    if (profile?.track_count && profile?.track_count > 0) {
      switch (tabIndex) {
        case 0:
          return ProfilePageTabs.TRACKS
        case 1:
          return ProfilePageTabs.ALBUMS
        case 2:
          return ProfilePageTabs.PLAYLISTS
        case 3:
          return ProfilePageTabs.REPOSTS
        default:
          return ProfilePageTabs.TRACKS
      }
    }
    switch (tabIndex) {
      case 0:
        return ProfilePageTabs.REPOSTS
      case 1:
        return ProfilePageTabs.PLAYLISTS
      default:
        return ProfilePageTabs.REPOSTS
    }
  }) as ProfilePageTabs

  const fetchProfile = useCallback(() => {
    if (!isScreenReady) return
    dispatch(fetchProfileAction(handleLower, id ?? null, true, true, false))
  }, [dispatch, handleLower, id, isScreenReady])

  useFocusEffect(setCurrentUser)

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleRefresh = useCallback(() => {
    // TODO: Investigate why this function over-fires when you pull to refresh
    if (profile) {
      setIsRefreshing(true)
      fetchProfile()
      switch (currentTab) {
        case ProfilePageTabs.TRACKS:
          dispatch(
            profilePageTracksLineupActions.refreshInView(
              true,
              { userId: profile.user_id },
              null,
              { handle: handleLower }
            )
          )
          break
        case ProfilePageTabs.PLAYLISTS:
        case ProfilePageTabs.ALBUMS:
          dispatch(fetchCollections(handleLower))
          break
        case ProfilePageTabs.REPOSTS:
          dispatch(
            profilePageFeedLineupActions.refreshInView(
              true,
              { userId: profile.user_id },
              null,
              { handle: handleLower }
            )
          )
          break
      }
    }
  }, [profile, fetchProfile, currentTab, dispatch, handleLower])

  useEffect(() => {
    if (status === Status.SUCCESS) {
      setIsRefreshing(false)
    }
  }, [status])

  const handlePressTopRight = useCallback(() => {
    if (profile) {
      if (!isOwner) {
        dispatch(
          setVisibility({
            modal: 'ProfileActions',
            visible: true
          })
        )
      } else {
        dispatch(
          requestOpenShareModal({
            type: 'profile',
            profileId: profile.user_id,
            source: ShareSource.PAGE
          })
        )
      }
    }
  }, [profile, dispatch, isOwner])

  const topbarRight = (
    <IconButton
      color='subdued'
      icon={!isOwner ? IconKebabHorizontal : IconShare}
      onPress={handlePressTopRight}
    />
  )

  const scrollY = useRef(new Animated.Value(0)).current

  const renderHeader = useCallback(
    () => <ProfileHeader scrollY={scrollY} />,
    [scrollY]
  )

  return (
    <Screen
      topbarRight={topbarRight}
      url={handle && `/${encodeUrlName(handle)}`}
    >
      <ScreenContent isOfflineCapable>
        {!profile ? (
          <ProfileScreenSkeleton />
        ) : (
          <>
            <View style={styles.navigator}>
              {isNotReachable ? (
                <>
                  {renderHeader()}
                  <OfflinePlaceholder />
                </>
              ) : (
                <>
                  <PortalHost name='PullToRefreshPortalHost' />
                  {renderHeader()}
                  <ScreenSecondaryContent skeleton={<ProfileTabsSkeleton />}>
                    <ProfileTabNavigator
                      animatedValue={scrollY}
                      refreshing={isRefreshing}
                      onRefresh={handleRefresh}
                    />
                  </ScreenSecondaryContent>
                </>
              )}
            </View>
          </>
        )}
      </ScreenContent>
    </Screen>
  )
}
