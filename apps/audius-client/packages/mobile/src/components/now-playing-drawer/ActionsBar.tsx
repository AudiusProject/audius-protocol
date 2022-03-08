import { useCallback } from 'react'

import {
  FavoriteSource,
  RepostSource,
  ShareSource
} from 'audius-client/src/common/models/Analytics'
import {
  repostTrack,
  saveTrack,
  undoRepostTrack,
  unsaveTrack
} from 'audius-client/src/common/store/social/tracks/actions'
import { Track } from 'common/models/Track'
import { getUserId } from 'common/store/account/selectors'
import { getMethod as getCastMethod } from 'common/store/cast/selectors'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { View, StyleSheet, NativeModules } from 'react-native'

import IconFavoriteOffDark from 'app/assets/animations/iconFavoriteOffDark.json'
import IconFavoriteOffLight from 'app/assets/animations/iconFavoriteOffLight.json'
import IconFavoriteOnDark from 'app/assets/animations/iconFavoriteOnDark.json'
import IconFavoriteOnLight from 'app/assets/animations/iconFavoriteOnLight.json'
import IconRepostOffDark from 'app/assets/animations/iconRepostOffDark.json'
import IconRepostOffLight from 'app/assets/animations/iconRepostOffLight.json'
import IconRepostOnDark from 'app/assets/animations/iconRepostOnDark.json'
import IconRepostOnLight from 'app/assets/animations/iconRepostOnLight.json'
import IconAirplay from 'app/assets/images/iconAirplay.svg'
import IconChromecast from 'app/assets/images/iconChromecast.svg'
import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import AnimatedButtonProvider from 'app/components/animated-button/AnimatedButtonProvider'
import { IconButton } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { showCastPicker } from 'app/store/googleCast/controller'
import { Theme, ThemeColors, useThemeVariant } from 'app/utils/theme'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 40,
      height: 48,
      borderRadius: 10,
      backgroundColor: themeColors.neutralLight8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly'
    },
    button: {
      flexGrow: 1,
      display: 'flex',
      alignItems: 'center'
    },
    animatedIcon: {
      width: 28,
      height: 28
    },
    icon: {
      width: 24,
      height: 24
    }
  })

type ActionsBarProps = {
  track: Track
}

export const ActionsBar = ({ track }: ActionsBarProps) => {
  const styles = useThemedStyles(createStyles)
  const themeVariant = useThemeVariant()
  const isDarkMode = themeVariant === Theme.DARK
  const currentUserId = useSelectorWeb(getUserId)
  const castMethod = useSelectorWeb(getCastMethod)

  const dispatchWeb = useDispatchWeb()

  const onToggleFavorite = useCallback(() => {
    if (track) {
      if (track.has_current_user_saved) {
        dispatchWeb(unsaveTrack(track.track_id, FavoriteSource.NOW_PLAYING))
      } else {
        dispatchWeb(saveTrack(track.track_id, FavoriteSource.NOW_PLAYING))
      }
    }
  }, [dispatchWeb, track])

  const onToggleRepost = useCallback(() => {
    if (track) {
      if (track.has_current_user_reposted) {
        dispatchWeb(undoRepostTrack(track.track_id, RepostSource.NOW_PLAYING))
      } else {
        dispatchWeb(repostTrack(track.track_id, RepostSource.NOW_PLAYING))
      }
    }
  }, [dispatchWeb, track])

  const onPressShare = useCallback(() => {
    if (track) {
      dispatchWeb(
        requestOpenShareModal({
          type: 'track',
          trackId: track.track_id,
          source: ShareSource.NOW_PLAYING
        })
      )
    }
  }, [dispatchWeb, track])

  const onPressOverflow = useCallback(() => {
    if (track) {
      const isOwner = currentUserId === track.owner_id
      const overflowActions = [
        !isOwner
          ? track.has_current_user_reposted
            ? OverflowAction.UNREPOST
            : OverflowAction.REPOST
          : null,
        !isOwner
          ? track.has_current_user_saved
            ? OverflowAction.UNFAVORITE
            : OverflowAction.FAVORITE
          : null,
        OverflowAction.SHARE,
        OverflowAction.ADD_TO_PLAYLIST,
        OverflowAction.VIEW_TRACK_PAGE,
        OverflowAction.VIEW_ARTIST_PAGE
      ].filter(Boolean) as OverflowAction[]

      dispatchWeb(
        openOverflowMenu({
          source: OverflowSource.TRACKS,
          id: track.track_id,
          overflowActions
        })
      )
    }
  }, [track, currentUserId, dispatchWeb])

  const renderCastButton = () => {
    const airplay = NativeModules.AirplayViewManager
    if (castMethod === 'airplay') {
      return (
        <IconButton
          onPress={airplay.click}
          icon={IconAirplay}
          styles={{ icon: styles.icon, root: styles.button }}
        />
      )
    }
    return (
      <IconButton
        onPress={showCastPicker}
        icon={IconChromecast}
        styles={{ icon: styles.icon, root: styles.button }}
      />
    )
  }
  const renderRepostButton = () => {
    return (
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        iconLightJSON={[IconRepostOnLight, IconRepostOffLight]}
        iconDarkJSON={[IconRepostOnDark, IconRepostOffDark]}
        iconIndex={track.has_current_user_reposted ? 1 : 0}
        onPress={onToggleRepost}
        style={styles.button}
        wrapperStyle={styles.animatedIcon}
      />
    )
  }
  const renderFavoriteButton = () => {
    return (
      <AnimatedButtonProvider
        isDarkMode={isDarkMode}
        iconLightJSON={[IconFavoriteOnLight, IconFavoriteOffLight]}
        iconDarkJSON={[IconFavoriteOnDark, IconFavoriteOffDark]}
        iconIndex={track.has_current_user_saved ? 1 : 0}
        onPress={onToggleFavorite}
        style={styles.button}
        wrapperStyle={styles.animatedIcon}
      />
    )
  }
  const renderShareButton = () => {
    return (
      <IconButton
        icon={IconShare}
        styles={{ icon: styles.icon, root: styles.button }}
        onPress={onPressShare}
      />
    )
  }
  const renderOptionsButton = () => {
    return (
      <IconButton
        icon={IconKebabHorizontal}
        styles={{ icon: styles.icon, root: styles.button }}
        onPress={onPressOverflow}
      />
    )
  }
  return (
    <View style={styles.container}>
      {renderCastButton()}
      {renderRepostButton()}
      {renderFavoriteButton()}
      {renderShareButton()}
      {renderOptionsButton()}
    </View>
  )
}
