import { useCallback } from 'react'

import { ID } from 'audius-client/src/common/models/Identifiers'
import { CoverArtSizes } from 'audius-client/src/common/models/ImageSizes'
import { User } from 'audius-client/src/common/models/User'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import {
  OverflowAction,
  OverflowSource
} from 'audius-client/src/common/store/ui/mobile-overflow-menu/types'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import {
  NativeSyntheticEvent,
  NativeTouchEvent,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

import IconHeart from 'app/assets/images/iconHeart.svg'
import IconKebabHorizontal from 'app/assets/images/iconKebabHorizontal.svg'
import { IconButton } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { font, makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { TablePlayButton } from './TablePlayButton'
import { TrackArtwork } from './TrackArtwork'

export type TrackItemAction = 'save' | 'overflow'

const useStyles = makeStyles(({ palette, spacing }) => ({
  trackContainer: {
    width: '100%',
    height: 72,
    backgroundColor: palette.white
  },
  trackContainerActive: {
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
  playButtonContainer: {
    marginRight: spacing(4)
  }
}))

const getMessages = ({ isDeleted = false }: { isDeleted?: boolean } = {}) => ({
  deleted: isDeleted ? ' [Deleted By Artist]' : ''
})

export type TrackListItemProps = {
  index: number
  isLoading: boolean
  isSaved?: boolean
  isReposted?: boolean
  isActive?: boolean
  isPlaying?: boolean
  isRemoveActive?: boolean
  isDeleted: boolean
  coverArtSizes?: CoverArtSizes
  artistName: string
  artistHandle: string
  trackTitle: string
  trackId: ID
  user: User
  uid?: string
  isReorderable?: boolean
  isDragging?: boolean
  onSave?: (isSaved: boolean, trackId: ID) => void
  onRemove?: (trackId: ID) => void
  togglePlay?: (uid: string, trackId: ID) => void
  trackItemAction?: TrackItemAction
}

export const TrackListItem = ({
  isLoading,
  index,
  isSaved = false,
  isReposted = false,
  isActive = false,
  isPlaying = false,
  isRemoveActive = false,
  artistName,
  trackTitle,
  trackId,
  user,
  uid,
  coverArtSizes,
  isDeleted,
  onSave,
  onRemove,
  togglePlay,
  trackItemAction,
  isReorderable = false,
  isDragging = false
}: TrackListItemProps) => {
  const messages = getMessages({ isDeleted })
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const themeColors = useThemeColors()
  const currentUserId = useSelectorWeb(getUserId)

  const onClickTrack = () => {
    if (uid && !isDeleted && togglePlay) togglePlay(uid, trackId)
  }

  const handleOpenOverflowMenu = useCallback(() => {
    const isOwner = currentUserId === user.user_id

    const overflowActions = [
      !isOwner
        ? isReposted
          ? OverflowAction.UNREPOST
          : OverflowAction.REPOST
        : null,
      !isOwner
        ? isSaved
          ? OverflowAction.UNFAVORITE
          : OverflowAction.FAVORITE
        : null,
      OverflowAction.ADD_TO_PLAYLIST,
      OverflowAction.VIEW_TRACK_PAGE,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.TRACKS,
        id: trackId,
        overflowActions
      })
    )
  }, [currentUserId, user.user_id, isReposted, isSaved, dispatchWeb, trackId])

  const handleSaveTrack = (e: NativeSyntheticEvent<NativeTouchEvent>) => {
    e.stopPropagation()
    const isNotAvailable = isDeleted && !isSaved
    if (!isNotAvailable && onSave) onSave(isSaved, trackId)
  }

  const handleClickOverflow = (e: NativeSyntheticEvent<NativeTouchEvent>) => {
    e.stopPropagation()
    handleOpenOverflowMenu()
  }

  const tileIconStyles = {
    root: { marginLeft: 8 },
    icon: { height: 16, width: 16 }
  }

  return (
    <View
      style={[
        styles.trackContainer,
        isActive ? styles.trackContainerActive : {}
      ]}
    >
      <TouchableOpacity
        style={styles.trackInnerContainer}
        onPress={onClickTrack}
      >
        {coverArtSizes ? (
          <TrackArtwork
            trackId={trackId}
            coverArtSizes={coverArtSizes}
            isActive={isActive}
            isLoading={isLoading}
            isPlaying={isPlaying}
          />
        ) : isActive && !isDeleted ? (
          <View style={styles.playButtonContainer}>
            <TablePlayButton playing paused={!isPlaying} hideDefault={false} />
          </View>
        ) : null}
        <View style={styles.nameArtistContainer}>
          <Text numberOfLines={1} style={styles.trackTitle}>
            {trackTitle}
            {messages.deleted}
          </Text>
          <Text numberOfLines={1} style={styles.artistName}>
            {artistName}
            <UserBadges user={user} badgeSize={12} hideName />
          </Text>
        </View>
        {trackItemAction === 'save' ? (
          <IconButton
            icon={IconHeart}
            styles={tileIconStyles}
            fill={isSaved ? themeColors.primary : themeColors.neutralLight4}
            onPress={handleSaveTrack}
          />
        ) : null}
        {trackItemAction === 'overflow' ? (
          <IconButton
            icon={IconKebabHorizontal}
            styles={tileIconStyles}
            onPress={handleClickOverflow}
          />
        ) : null}
      </TouchableOpacity>
    </View>
  )
}
