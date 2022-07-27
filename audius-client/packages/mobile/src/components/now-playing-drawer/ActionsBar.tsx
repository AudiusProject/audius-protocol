import { useCallback, useLayoutEffect } from 'react'

import type { Track } from '@audius/common'
import { FavoriteSource, RepostSource, ShareSource } from '@audius/common'
import { updateMethod } from 'audius-client/src/common/store/cast/slice'
import {
  repostTrack,
  saveTrack,
  undoRepostTrack,
  unsaveTrack
} from 'audius-client/src/common/store/social/tracks/actions'
import { getUserId } from 'common/store/account/selectors'
import {
  getMethod as getCastMethod,
  getIsCasting
} from 'common/store/cast/selectors'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import {
  OverflowAction,
  OverflowSource
} from 'common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'common/store/ui/share-modal/slice'
import { View, Platform } from 'react-native'
import { CastButton } from 'react-native-google-cast'

import IconAirplay from 'app/assets/images/iconAirplay.svg'
import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import { useAirplay } from 'app/components/audio/Airplay'
import { IconButton } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { FavoriteButton } from './FavoriteButton'
import { RepostButton } from './RepostButton'

const useStyles = makeStyles(({ palette, spacing }) => ({
  container: {
    marginTop: spacing(10),
    height: spacing(12),
    borderRadius: 10,
    backgroundColor: palette.neutralLight8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly'
  },
  button: {
    flexGrow: 1,
    alignItems: 'center'
  },
  animatedIcon: {
    width: spacing(7),
    height: spacing(7)
  },
  icon: {
    width: spacing(6),
    height: spacing(6)
  }
}))

type ActionsBarProps = {
  track: Track
}

export const ActionsBar = ({ track }: ActionsBarProps) => {
  const styles = useStyles()
  const currentUserId = useSelectorWeb(getUserId)
  const castMethod = useSelectorWeb(getCastMethod)
  const isCasting = useSelectorWeb(getIsCasting)
  const { neutral, primary } = useThemeColors()
  const dispatchWeb = useDispatchWeb()

  useLayoutEffect(() => {
    if (Platform.OS === 'android' && castMethod === 'airplay') {
      dispatchWeb(updateMethod({ method: 'chromecast' }))
    }
  }, [castMethod, dispatchWeb])

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

  const { openAirplayDialog } = useAirplay()

  const renderCastButton = () => {
    if (castMethod === 'airplay') {
      return (
        <IconButton
          onPress={openAirplayDialog}
          icon={IconAirplay}
          fill={isCasting ? primary : neutral}
          styles={{ icon: styles.icon, root: styles.button }}
        />
      )
    }
    return (
      <CastButton
        style={{
          ...styles.button,
          ...styles.icon,
          tintColor: isCasting ? primary : neutral
        }}
      />
    )
  }

  const renderRepostButton = () => {
    return (
      <RepostButton
        iconIndex={track.has_current_user_reposted ? 1 : 0}
        onPress={onToggleRepost}
        style={styles.button}
        wrapperStyle={styles.animatedIcon}
      />
    )
  }

  const renderFavoriteButton = () => {
    return (
      <FavoriteButton
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
