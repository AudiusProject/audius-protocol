import {
  FavoriteSource,
  RepostSource,
  ShareSource
} from 'audius-client/src/common/models/Analytics'
import { ID } from 'audius-client/src/common/models/Identifiers'
import {
  repostTrack,
  saveTrack,
  undoRepostTrack,
  unsaveTrack
} from 'audius-client/src/common/store/social/tracks/actions'
import {
  OverflowAction,
  OverflowSource
} from 'audius-client/src/common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'audius-client/src/common/store/ui/share-modal/slice'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { StyleSheet, View } from 'react-native'

import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import FavoriteButton from 'app/components/favorite-button'
import IconButton from 'app/components/icon-button/IconButton'
import RepostButton from 'app/components/repost-button'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
import { ThemeColors, useThemeColors } from 'app/utils/theme'

type TrackScreenActionButtonsProps = {
  hasReposted: boolean
  hasSaved: boolean
  isFollowing: boolean
  isOwner: boolean
  isPublished?: boolean
  isUnlisted: boolean
  showFavorite: boolean
  showOverflow: boolean
  showRepost: boolean
  showShare: boolean
  trackId: ID
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      ...flexRowCentered(),
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: themeColors.neutralLight7,
      height: 60,
      paddingTop: 12,
      paddingBottom: 8
    },

    actionButton: {
      ...flexRowCentered(),
      width: 30,
      height: '100%',
      justifyContent: 'center',
      position: 'relative',
      bottom: 1,
      marginHorizontal: 16
    },

    icon: {
      height: 30,
      width: 30
    },

    iconWrapper: {
      ...flexRowCentered(),
      width: 30,
      height: '100%',
      overflow: 'visible',
      marginHorizontal: 12
    }
  })

/**
 * The action buttons on track and playlist screens
 */
export const TrackScreenActionButtons = ({
  hasReposted,
  hasSaved,
  isFollowing,
  isOwner,
  isPublished = true,
  isUnlisted,
  showFavorite,
  showOverflow,
  showRepost,
  showShare,
  trackId
}: TrackScreenActionButtonsProps) => {
  const styles = useThemedStyles(createStyles)
  const { neutralLight4, neutralLight8 } = useThemeColors()
  const dispatchWeb = useDispatchWeb()

  const onToggleSave = () => {
    if (!isOwner) {
      if (hasSaved) {
        dispatchWeb(unsaveTrack(trackId, FavoriteSource.TRACK_PAGE))
      } else {
        dispatchWeb(saveTrack(trackId, FavoriteSource.TRACK_PAGE))
      }
    }
  }

  const onToggleRepost = () => {
    if (!isOwner) {
      if (hasReposted) {
        dispatchWeb(undoRepostTrack(trackId, RepostSource.TRACK_PAGE))
      } else {
        dispatchWeb(repostTrack(trackId, RepostSource.TRACK_PAGE))
      }
    }
  }

  const onShare = () => {
    dispatchWeb(
      requestOpenShareModal({
        type: 'track',
        trackId,
        source: ShareSource.PAGE
      })
    )
  }
  const onPressOverflow = () => {
    const overflowActions = [
      isOwner || isUnlisted
        ? null
        : hasReposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      isOwner || isUnlisted
        ? null
        : hasSaved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      OverflowAction.ADD_TO_PLAYLIST,
      isFollowing
        ? OverflowAction.UNFOLLOW_ARTIST
        : OverflowAction.FOLLOW_ARTIST,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.TRACKS,
        id: trackId,
        overflowActions
      })
    )
  }

  const repostButton = (
    <RepostButton
      wrapperStyle={styles.actionButton}
      onPress={onToggleRepost}
      isActive={hasReposted}
      isDisabled={isOwner}
    />
  )

  const favoriteButton = (
    <FavoriteButton
      wrapperStyle={styles.actionButton}
      onPress={onToggleSave}
      isActive={hasSaved}
      isDisabled={isOwner}
    />
  )

  const shareButton = (
    <IconButton
      style={styles.actionButton}
      icon={() => (
        <IconShare
          fill={!isPublished ? neutralLight8 : neutralLight4}
          height={24}
          width={24}
        />
      )}
      onPress={isPublished ? onShare : () => {}}
    />
  )

  const overflowMenu = (
    <IconButton
      style={styles.actionButton}
      icon={() => (
        <IconKebabHorizontal fill={neutralLight4} height={30} width={30} />
      )}
      onPress={onPressOverflow}
    />
  )

  return (
    <View style={styles.root}>
      {showRepost && repostButton}
      {showFavorite && favoriteButton}
      {showShare && shareButton}
      {showOverflow && overflowMenu}
    </View>
  )
}
