import type { ComponentType } from 'react'
import { memo, useCallback, useMemo, useState } from 'react'

import type { Collection, ID, Track, UID, User } from '@audius/common'
import {
  cacheCollectionsSelectors,
  usePremiumContentAccess,
  FeatureFlags,
  playbackPositionSelectors,
  Genre,
  removeNullable,
  OverflowAction,
  OverflowSource,
  mobileOverflowMenuUIActions,
  accountSelectors,
  cacheUsersSelectors,
  cacheTracksSelectors,
  playerSelectors
} from '@audius/common'
import type {
  NativeSyntheticEvent,
  NativeTouchEvent,
  TouchableOpacityProps
} from 'react-native'
import { Text, TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { trpc } from 'utils/trpcClientWeb'

import IconDrag from 'app/assets/images/iconDrag.svg'
import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import IconLock from 'app/assets/images/iconLock.svg'
import IconRemoveTrack from 'app/assets/images/iconRemoveTrack.svg'
import { IconButton } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { flexRowCentered, font, makeStyles } from 'app/styles'
import { useColor, useThemeColors } from 'app/utils/theme'

import { TrackDownloadStatusIndicator } from '../offline-downloads/TrackDownloadStatusIndicator'

import { TablePlayButton } from './TablePlayButton'
import { TrackArtwork } from './TrackArtwork'
const { open: openOverflowMenu } = mobileOverflowMenuUIActions

const { getUserId } = accountSelectors
const { getUserFromTrack } = cacheUsersSelectors
const { getTrack } = cacheTracksSelectors
const { getCollection } = cacheCollectionsSelectors
const { getPlaying, getUid } = playerSelectors
const { getTrackPosition } = playbackPositionSelectors

export type TrackItemAction = 'overflow' | 'remove'

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
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
    paddingHorizontal: spacing(4)
  },
  nameArtistContainer: {
    flexShrink: 1,
    flexBasis: '100%',
    height: '100%',
    justifyContent: 'center'
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  trackTitle: {
    flexDirection: 'row',
    flexShrink: 1,
    alignItems: 'center',
    textAlignVertical: 'top'
  },
  trackTitleText: {
    ...font('demiBold'),
    lineHeight: 16,
    paddingTop: 2,
    color: palette.neutral
  },
  downloadIndicator: {
    marginLeft: spacing(1)
  },
  artistName: {
    ...font('medium'),
    color: palette.neutralLight2,
    alignItems: 'center'
  },
  iconContainer: {
    marginLeft: spacing(2)
  },
  icon: { height: 24, width: 24 },
  removeIcon: { height: 24, width: 24 },

  playButtonContainer: {
    marginRight: spacing(4)
  },
  dragIcon: {
    marginRight: spacing(4)
  },
  divider: {
    borderBottomColor: palette.neutralLight7,
    borderBottomWidth: 1,
    marginVertical: 0,
    marginHorizontal: spacing(6)
  },
  noMarginDivider: {
    borderBottomColor: palette.neutralLight8,
    marginHorizontal: 0
  },
  hideDivider: {
    opacity: 0
  },
  locked: {
    ...flexRowCentered(),
    paddingVertical: spacing(0.5),
    paddingHorizontal: spacing(2),
    backgroundColor: palette.accentBlue,
    borderRadius: 80
  },
  lockedIcon: {
    fill: palette.white
  },
  lockedText: {
    marginLeft: spacing(0.5),
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.xxs,
    color: palette.white
  },
  halfTransparent: {
    opacity: 0.5
  }
}))

const getMessages = ({ isDeleted = false }: { isDeleted?: boolean } = {}) => ({
  deleted: isDeleted ? ' [Deleted By Artist]' : '',
  locked: 'Locked'
})

export type TrackListItemProps = {
  onDrag?: () => void
  hideArt?: boolean
  id?: ID
  contextPlaylistId?: ID
  index: number
  isReorderable?: boolean
  noDividerMargin?: boolean
  onRemove?: (index: number) => void
  prevUid?: UID
  showDivider?: boolean
  showTopDivider?: boolean
  togglePlay?: (uid: string, trackId: ID) => void
  trackItemAction?: TrackItemAction
  uid?: UID
}

// Using `memo` because FlatList renders these items
// And we want to avoid a full render when the props haven't changed
export const TrackListItem = memo((props: TrackListItemProps) => {
  const { id, uid, contextPlaylistId } = props

  const track = useSelector((state) => getTrack(state, { id, uid }))
  const contextPlaylist = useSelector((state) =>
    getCollection(state, { id: contextPlaylistId })
  )
  const user = useSelector((state) => getUserFromTrack(state, { id, uid }))

  if (!track || !user) {
    console.warn('Track or user missing for TrackListItem, preventing render')
    return null
  }

  return (
    <TrackListItemComponent
      {...props}
      track={track}
      user={user}
      contextPlaylist={contextPlaylist}
    />
  )
})

type TrackListItemComponentProps = TrackListItemProps & {
  track: Track
  user: User
  contextPlaylist: Collection | null
}

const TrackListItemComponent = (props: TrackListItemComponentProps) => {
  const {
    contextPlaylistId,
    contextPlaylist,
    onDrag,
    hideArt,
    index,
    isReorderable = false,
    noDividerMargin,
    onRemove,
    prevUid,
    showDivider,
    showTopDivider,
    togglePlay,
    track,
    trackItemAction,
    uid,
    user
  } = props

  const {
    has_current_user_saved,
    has_current_user_reposted,
    is_delete,
    is_unlisted,
    title,
    track_id,
    owner_id,
    is_premium: isPremium
  } = track
  const { isEnabled: isEditAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.EDIT_ALBUMS
  )

  const { is_deactivated, name } = user

  const isDeleted = is_delete || !!is_deactivated
  const isUnlisted = is_unlisted

  const { isUserAccessTBD, doesUserHaveAccess } = usePremiumContentAccess(track)
  const isLocked = !isUserAccessTBD && !doesUserHaveAccess

  const isActive = useSelector((state) => {
    const playingUid = getUid(state)
    return uid !== undefined && uid === playingUid
  })

  const isPrevItemActive = useSelector((state) => {
    const playingUid = getUid(state)
    return prevUid !== undefined && prevUid === playingUid
  })

  const isPlaying = useSelector((state) => {
    return isActive && getPlaying(state)
  })

  const messages = getMessages({ isDeleted })
  const styles = useStyles()
  const dispatch = useDispatch()
  const themeColors = useThemeColors()
  const white = useColor('white')
  const [titleWidth, setTitleWidth] = useState(0)

  const deletedTextWidth = useMemo(
    () => (messages.deleted.length ? 124 : 0),
    [messages]
  )
  const titleMaxWidth = useMemo(
    () =>
      titleWidth && deletedTextWidth ? titleWidth - deletedTextWidth : '100%',
    [deletedTextWidth, titleWidth]
  )

  const onPressTrack = () => {
    if (uid && !isLocked && !isDeleted && togglePlay) {
      togglePlay(uid, track_id)
    }
  }

  const { isEnabled: isNewPodcastControlsEnabled } = useFeatureFlag(
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
    FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
  )

  const currentUserId = useSelector(getUserId)
  const isTrackOwner = currentUserId && currentUserId === owner_id
  const isContextPlaylistOwner =
    currentUserId && contextPlaylist?.playlist_owner_id === currentUserId

  const isLongFormContent =
    track.genre === Genre.PODCASTS || track.genre === Genre.AUDIOBOOKS
  const playbackPositionInfo = useSelector((state) =>
    getTrackPosition(state, { trackId: track_id, userId: currentUserId })
  )

  const { data: albumInfo } = trpc.tracks.getAlbumBacklink.useQuery(
    { trackId: track_id },
    { enabled: !!track_id }
  )

  const handleOpenOverflowMenu = useCallback(() => {
    const overflowActions = [
      OverflowAction.SHARE,
      !isTrackOwner
        ? has_current_user_saved
          ? OverflowAction.UNFAVORITE
          : OverflowAction.FAVORITE
        : null,
      !isTrackOwner
        ? has_current_user_reposted
          ? OverflowAction.UNREPOST
          : OverflowAction.REPOST
        : null,
      isEditAlbumsEnabled && isTrackOwner ? OverflowAction.ADD_TO_ALBUM : null,
      !isPremium ? OverflowAction.ADD_TO_PLAYLIST : null,
      isNewPodcastControlsEnabled && isLongFormContent
        ? OverflowAction.VIEW_EPISODE_PAGE
        : OverflowAction.VIEW_TRACK_PAGE,
      isEditAlbumsEnabled && albumInfo ? OverflowAction.VIEW_ALBUM_PAGE : null,
      isNewPodcastControlsEnabled && isLongFormContent
        ? playbackPositionInfo?.status === 'COMPLETED'
          ? OverflowAction.MARK_AS_UNPLAYED
          : OverflowAction.MARK_AS_PLAYED
        : null,
      isTrackOwner ? OverflowAction.EDIT_TRACK : null,
      !isTrackOwner ? OverflowAction.VIEW_ARTIST_PAGE : null,
      isContextPlaylistOwner ? OverflowAction.REMOVE_FROM_PLAYLIST : null
    ].filter(removeNullable)

    dispatch(
      openOverflowMenu({
        source: OverflowSource.TRACKS,
        id: track_id,
        contextPlaylistId,
        overflowActions
      })
    )
  }, [
    isTrackOwner,
    has_current_user_saved,
    has_current_user_reposted,
    isEditAlbumsEnabled,
    isPremium,
    isNewPodcastControlsEnabled,
    isLongFormContent,
    albumInfo,
    playbackPositionInfo?.status,
    isContextPlaylistOwner,
    dispatch,
    track_id,
    contextPlaylistId
  ])

  const handlePressOverflow = (e: NativeSyntheticEvent<NativeTouchEvent>) => {
    e.stopPropagation()
    handleOpenOverflowMenu()
  }

  const handlePressRemove = () => {
    onRemove?.(index)
  }

  // The dividers above and belove the active track should be hidden
  const hideDivider = isActive || isPrevItemActive

  const ListItemView = (
    isReorderable ? View : TouchableOpacity
  ) as ComponentType<TouchableOpacityProps>

  return (
    <View>
      {showDivider && (showTopDivider || index > 0) ? (
        <View
          style={[
            styles.divider,
            hideDivider && styles.hideDivider,
            noDividerMargin && styles.noMarginDivider
          ]}
        />
      ) : null}
      <View
        style={[
          styles.trackContainer,
          isActive && styles.trackContainerActive,
          isDeleted && styles.trackContainerDisabled
        ]}
      >
        <ListItemView
          style={styles.trackInnerContainer}
          onPress={isReorderable ? undefined : onPressTrack}
          disabled={isDeleted || isLocked}
        >
          {!hideArt ? (
            <TrackArtwork
              track={track as Track}
              isActive={isActive}
              isPlaying={isPlaying}
              isUnlisted={isUnlisted}
            />
          ) : isActive && !isDeleted && !isLocked ? (
            <View style={styles.playButtonContainer}>
              <TablePlayButton
                playing
                paused={!isPlaying}
                hideDefault={false}
                onPress={onPressTrack}
              />
            </View>
          ) : null}
          {isReorderable ? (
            <IconButton
              icon={IconDrag}
              fill={themeColors.neutralLight4}
              style={styles.dragIcon}
              onLongPress={onDrag}
              delayLongPress={100}
            />
          ) : null}
          <View
            style={[
              styles.nameArtistContainer,
              !isDeleted && isLocked ? styles.halfTransparent : null
            ]}
          >
            <View
              style={styles.topLine}
              onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}
            >
              <View style={styles.trackTitle}>
                <Text
                  numberOfLines={1}
                  style={[styles.trackTitleText, { maxWidth: titleMaxWidth }]}
                >
                  {title}
                </Text>
                <Text numberOfLines={1} style={[styles.trackTitleText]}>
                  {messages.deleted}
                </Text>
              </View>

              {!isDeleted && (
                <View style={styles.downloadIndicator}>
                  <TrackDownloadStatusIndicator trackId={track_id} size={16} />
                </View>
              )}
            </View>
            <Text numberOfLines={1} style={styles.artistName}>
              {name}
              <UserBadges user={user} badgeSize={12} hideName />
            </Text>
          </View>
          {!isDeleted && isLocked ? (
            <View style={styles.locked}>
              <IconLock fill={white} width={10} height={10} />
              <Text style={styles.lockedText}>{messages.locked}</Text>
            </View>
          ) : null}
          {trackItemAction === 'overflow' ? (
            <IconButton
              icon={IconKebabHorizontal}
              fill={themeColors.neutralLight4}
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
        </ListItemView>
      </View>
    </View>
  )
}
