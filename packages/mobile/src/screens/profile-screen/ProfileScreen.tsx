import { useCallback, useEffect, useRef, useState } from 'react'

import {
  profilePageSelectors,
  profilePageActions,
  reachabilitySelectors,
  shareModalUIActions,
  modalsActions,
  relatedArtistsUIActions
} from '@audius/common'
import { ShareSource, Status } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { encodeUrlName } from '@audius/common/utils'
import { PortalHost } from '@gorhom/portal'
import { useFocusEffect } from '@react-navigation/native'
import { Animated, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import { IconButton, Screen, ScreenContent } from 'app/components/core'
import { OfflinePlaceholder } from 'app/components/offline-placeholder'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { ProfileHeader } from './ProfileHeader'
import { ProfileScreenSkeleton } from './ProfileScreenSkeleton'
import { ProfileTabNavigator } from './ProfileTabs/ProfileTabNavigator'
import { getIsOwner, useSelectProfileRoot } from './selectors'
const { fetchRelatedArtists } = relatedArtistsUIActions
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const {
  fetchProfile: fetchProfileAction,
  setCurrentUser: setCurrentUserAction
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
    'does_current_user_follow'
  ])
  const handle =
    userHandle && userHandle !== 'accountUser' ? userHandle : profile?.handle
  const handleLower = handle?.toLowerCase() ?? ''
  const isOwner = useSelector((state) => getIsOwner(state, handle ?? ''))
  const dispatch = useDispatch()
  const status = useSelector((state) => getProfileStatus(state, handleLower))
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { neutralLight4 } = useThemeColors()
  const isNotReachable = useSelector(getIsReachable) === false
  const { isEnabled: isChatEnabled } = useFeatureFlag(FeatureFlags.CHAT_ENABLED)

  const setCurrentUser = useCallback(() => {
    dispatch(setCurrentUserAction(handleLower))
  }, [dispatch, handleLower])

  const fetchProfile = useCallback(() => {
    dispatch(fetchProfileAction(handleLower, id ?? null, true, true, false))
  }, [dispatch, handleLower, id])

  useEffect(() => {
    if (!profile?.user_id) return
    dispatch(fetchRelatedArtists({ artistId: profile.user_id }))
  }, [dispatch, profile?.user_id])

  useFocusEffect(setCurrentUser)

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleRefresh = useCallback(() => {
    if (profile) {
      setIsRefreshing(true)
      fetchProfile()
    }
  }, [profile, fetchProfile])

  useEffect(() => {
    if (status === Status.SUCCESS) {
      setIsRefreshing(false)
    }
  }, [status])

  const handlePressTopRight = useCallback(() => {
    if (profile) {
      if (isChatEnabled && !isOwner) {
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
  }, [profile, dispatch, isChatEnabled, isOwner])

  const topbarRight = (
    <IconButton
      fill={neutralLight4}
      icon={isChatEnabled && !isOwner ? IconKebabHorizontal : IconShare}
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
                  <ProfileTabNavigator
                    renderHeader={renderHeader}
                    animatedValue={scrollY}
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                  />
                </>
              )}
            </View>
          </>
        )}
      </ScreenContent>
    </Screen>
  )
}
