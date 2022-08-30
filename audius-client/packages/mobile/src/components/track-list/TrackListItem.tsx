import { useCallback, useMemo, useState } from 'react'

import type { ID } from '@audius/common'
import {
  accountSelectors,
  OverflowAction,
  OverflowSource,
  mobileOverflowMenuUIActions
} from '@audius/common'
import type { NativeSyntheticEvent, NativeTouchEvent } from 'react-native'
import { Text, TouchableOpacity, View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconDrag from 'app/assets/images/iconDrag.svg'
import IconHeart from 'app/assets/images/iconHeart.svg'
import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconRemoveTrack from 'app/assets/images/iconRemoveTrack.svg'
import { IconButton } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { font, makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { TablePlayButton } from './TablePlayButton'
import { TrackArtwork } from './TrackArtwork'
import type { TrackMetadata } from './types'
const { open: openOverflowMenu } = mobileOverflowMenuUIActions
const getUserId = accountSelectors.getUserId

export type TrackItemAction = 'save' | 'overflow' | 'remove'

const useStyles = makeStyles(({ palette, spacing }) => ({
  trackContainer: {
    width: '100%',
    height: 72,
    backgroundColor: palette.white
  },
  trackContainerActive: {
    backgroundColor: palette.neutralLight9
  },
  trackContainerDisabled: {
    backgroundColor: palette.neutralLight9
  },
  trackInnerContainer: {
    height: '100%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6)
  },
  nameArtistContainer: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    height: '100%'
  },
  trackTitle: {
    flexDirection: 'row'
  },
  trackTitleText: {
    ...font('demiBold'),
    color: palette.neutral
  },
  artistName: {
    ...font('medium'),
    color: palette.neutralLight2,
    alignItems: 'center'
  },
  iconContainer: {
    marginLeft: spacing(2)
  },
  icon: { height: 16, width: 16 },
  removeIcon: { height: 20, width: 20 },

  playButtonContainer: {
    marginRight: spacing(4)
  },
  dragIcon: {
    marginRight: spacing(6)
  }
}))

const getMessages = ({ isDeleted = false }: { isDeleted?: boolean } = {}) => ({
  deleted: isDeleted ? ' [Deleted By Artist]' : ''
})

export type TrackListItemProps = {
  drag: () => void
  hideArt?: boolean
  index: number
  isActive?: boolean
  isLoading?: boolean
  isPlaying?: boolean
  isReorderable?: boolean
  onRemove?: (index: number) => void
  onSave?: (isSaved: boolean, trackId: ID) => void
  togglePlay?: (uid: string, trackId: ID) => void
  track: TrackMetadata
  trackItemAction?: TrackItemAction
}

export const TrackListItem = ({
  drag,
  hideArt,
  index,
  isActive,
  isReorderable = false,
  isLoading = false,
  isPlaying = false,
  onRemove,
  onSave,
  togglePlay,
  track,
  trackItemAction
}: TrackListItemProps) => {
  const {
    _cover_art_sizes,
    has_current_user_reposted,
    has_current_user_saved,
    is_delete,
    is_unlisted,
    title,
    track_id,
    uid,
    user: { name, is_deactivated, user_id }
  } = track
  const isDeleted = is_delete || !!is_deactivated || is_unlisted

  const messages = getMessages({ isDeleted })
  const styles = useStyles()
  const dispatch = useDispatch()
  const themeColors = useThemeColors()
  const currentUserId = useSelectorWeb(getUserId)
  const [titleWidth, setTitleWidth] = useState(0)

  const deletedTextWidth = useMemo(
    () => (messages.deleted.length ? 124 : 0),
    [messages]
  )

  const onPressTrack = () => {
    if (uid && !isDeleted && togglePlay) {
      togglePlay(uid, track_id)
    }
  }

  const handleOpenOverflowMenu = useCallback(() => {
    const isOwner = currentUserId === user_id

    const overflowActions = [
      !isOwner
        ? has_current_user_reposted
          ? OverflowAction.UNREPOST
          : OverflowAction.REPOST
        : null,
      !isOwner
        ? has_current_user_saved
          ? OverflowAction.UNFAVORITE
          : OverflowAction.FAVORITE
        : null,
      OverflowAction.ADD_TO_PLAYLIST,
      OverflowAction.VIEW_TRACK_PAGE,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatch(
      openOverflowMenu({
        source: OverflowSource.TRACKS,
        id: track_id,
        overflowActions
      })
    )
  }, [
    currentUserId,
    user_id,
    has_current_user_reposted,
    has_current_user_saved,
    dispatch,
    track_id
  ])

  const handlePressSave = (e: NativeSyntheticEvent<NativeTouchEvent>) => {
    e.stopPropagation()
    const isNotAvailable = isDeleted && !has_current_user_saved
    if (!isNotAvailable && onSave) {
      onSave(has_current_user_saved, track_id)
    }
  }

  const handlePressOverflow = (e: NativeSyntheticEvent<NativeTouchEvent>) => {
    e.stopPropagation()
    handleOpenOverflowMenu()
  }

  const handlePressRemove = () => {
    onRemove?.(index)
  }

  return (
    <View
      style={[
        styles.trackContainer,
        isActive && styles.trackContainerActive,
        isDeleted && styles.trackContainerDisabled
      ]}
    >
      <TouchableOpacity
        style={styles.trackInnerContainer}
        onPress={onPressTrack}
        onLongPress={drag}
        disabled={isDeleted}
      >
        {!hideArt ? (
          <TrackArtwork
            trackId={track_id}
            coverArtSizes={_cover_art_sizes}
            isActive={isActive}
            isLoading={isLoading}
            isPlaying={isPlaying}
          />
        ) : isActive && !isDeleted ? (
          <View style={styles.playButtonContainer}>
            <TablePlayButton
              playing
              paused={!isPlaying}
              hideDefault={false}
              onPress={onPressTrack}
            />
          </View>
        ) : null}
        {isReorderable && <IconDrag style={styles.dragIcon} />}
        <View style={styles.nameArtistContainer}>
          <View
            style={styles.trackTitle}
            onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.trackTitleText,
                {
                  maxWidth: titleWidth ? titleWidth - deletedTextWidth : '100%'
                }
              ]}
            >
              {title}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.trackTitleText, { flexBasis: deletedTextWidth }]}
            >
              {messages.deleted}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.artistName}>
            {name}
            <UserBadges user={track.user} badgeSize={12} hideName />
          </Text>
        </View>
        {trackItemAction === 'save' ? (
          <IconButton
            icon={IconHeart}
            styles={{
              root: styles.iconContainer,
              icon: styles.icon
            }}
            fill={
              has_current_user_saved
                ? themeColors.primary
                : themeColors.neutralLight4
            }
            onPress={handlePressSave}
          />
        ) : null}
        {trackItemAction === 'overflow' ? (
          <IconButton
            icon={IconKebabHorizontal}
            styles={{
              root: styles.iconContainer,
              icon: styles.icon
            }}
            onPress={handlePressOverflow}
          />
        ) : null}
        {trackItemAction === 'remove' ? (
          <IconButton
            icon={IconRemoveTrack}
            styles={{
              root: styles.iconContainer,
              icon: styles.removeIcon
            }}
            onPress={handlePressRemove}
          />
        ) : null}
      </TouchableOpacity>
    </View>
  )
}
