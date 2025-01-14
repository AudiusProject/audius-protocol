import { useCallback, useEffect, useRef, useState } from 'react'

import { useUserByParams } from '@audius/common/api'
import { ShareSource } from '@audius/common/models'
import {
  reachabilitySelectors,
  shareModalUIActions,
  modalsActions,
  profilePageTracksLineupActions,
  ProfilePageTabs,
  profilePageFeedLineupActions
} from '@audius/common/store'
import { encodeUrlName } from '@audius/common/utils'
import { PortalHost } from '@gorhom/portal'
import { useNavigationState } from '@react-navigation/native'
import { Animated, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import {
  IconButton,
  IconKebabHorizontal,
  IconShare
} from '@audius/harmony-native'
import { Screen, ScreenContent } from 'app/components/core'
import { ScreenPrimaryContent } from 'app/components/core/Screen/ScreenPrimaryContent'
import { ScreenSecondaryContent } from 'app/components/core/Screen/ScreenSecondaryContent'
import { OfflinePlaceholder } from 'app/components/offline-placeholder'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'

import { ProfileHeader } from './ProfileHeader'
import { ProfileScreenSkeleton } from './ProfileScreenSkeleton'
import { ProfileTabNavigator } from './ProfileTabs/ProfileTabNavigator'
import { getIsOwner } from './selectors'

const { requestOpen: requestOpenShareModal } = shareModalUIActions
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
  const { data: profile, status } = useUserByParams({
    handle: userHandle ?? '',
    userId: id
  })

  const handle =
    userHandle && userHandle !== 'accountUser' ? userHandle : profile?.handle
  const handleLower = handle?.toLowerCase() ?? ''
  const isOwner = useSelector((state) => getIsOwner(state, handle ?? ''))
  const dispatch = useDispatch()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const isNotReachable = useSelector(getIsReachable) === false

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

  const handleRefresh = useCallback(() => {
    // TODO: Investigate why this function over-fires when you pull to refresh
    if (profile) {
      setIsRefreshing(true)
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
  }, [profile, currentTab, dispatch, handleLower])

  useEffect(() => {
    if (status === 'success') {
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
                  <OfflinePlaceholder />
                </>
              ) : (
                <>
                  <ScreenPrimaryContent skeleton={<ProfileScreenSkeleton />}>
                    <PortalHost name='PullToRefreshPortalHost' />
                  </ScreenPrimaryContent>
                  <ScreenSecondaryContent skeleton={<ProfileScreenSkeleton />}>
                    <ProfileTabNavigator
                      renderHeader={renderHeader}
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
