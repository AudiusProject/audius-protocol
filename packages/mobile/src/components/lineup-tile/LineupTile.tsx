import { useCallback } from 'react'

import {
  accountSelectors,
  Genre,
  gatedContentActions,
  useGatedContentAccess,
  getDogEarType
} from '@audius/common'
import moment from 'moment'
import { View } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'

import { DogEar } from 'app/components/core'
import type { LineupTileProps } from 'app/components/lineup-tile/types'
import { setVisibility } from 'app/store/drawers/slice'

import { LineupTileActionButtons } from './LineupTileActionButtons'
import { LineupTileCoSign } from './LineupTileCoSign'
import { LineupTileMetadata } from './LineupTileMetadata'
import { LineupTileRoot } from './LineupTileRoot'
import { LineupTileStats } from './LineupTileStats'
import { LineupTileTopRight } from './LineupTileTopRight'

const { getUserId } = accountSelectors
const { setLockedContentId } = gatedContentActions

export const LineupTile = ({
  children,
  coSign,
  duration,
  favoriteType,
  hasPreview,
  hidePlays,
  hideShare,
  id,
  index,
  isTrending,
  isUnlisted,
  onPress,
  onPressOverflow,
  onPressRepost,
  onPressSave,
  onPressShare,
  onPressTitle,
  playCount,
  renderImage,
  repostType,
  showArtistPick,
  showRankIcon,
  title,
  item,
  user,
  isPlayingUid,
  variant,
  styles,
  TileProps
}: LineupTileProps) => {
  const {
    has_current_user_reposted,
    has_current_user_saved,
    repost_count,
    save_count
  } = item
  const dispatch = useDispatch()
  const { artist_pick_track_id, name, user_id } = user
  const currentUserId = useSelector(getUserId)
  const isOwner = user_id === currentUserId
  const isCollection = 'playlist_id' in item
  const isTrack = 'track_id' in item
  const trackId = isTrack ? item.track_id : undefined
  const streamConditions = isTrack ? item.stream_conditions : null
  const isArtistPick = artist_pick_track_id === id
  const { hasStreamAccess } = useGatedContentAccess(isTrack ? item : null)
  const isScheduledRelease = item.release_date
    ? moment(item.release_date).isAfter(moment())
    : false

  const dogEarType = getDogEarType({
    streamConditions,
    isOwner,
    hasStreamAccess,
    isArtistPick: showArtistPick && isArtistPick,
    isUnlisted: isUnlisted && !isScheduledRelease
  })

  const handlePress = useCallback(() => {
    if (trackId && !hasStreamAccess && !hasPreview) {
      dispatch(setLockedContentId({ id: trackId }))
      dispatch(setVisibility({ drawer: 'LockedContent', visible: true }))
    } else {
      onPress?.()
    }
  }, [trackId, hasStreamAccess, hasPreview, dispatch, onPress])

  const isLongFormContent =
    isTrack &&
    (item.genre === Genre.PODCASTS || item.genre === Genre.AUDIOBOOKS)

  const isReadonly = variant === 'readonly'
  const scale = isReadonly ? 1 : undefined

  return (
    <LineupTileRoot
      onPress={handlePress}
      style={styles}
      scaleTo={scale}
      {...TileProps}
    >
      {dogEarType ? <DogEar type={dogEarType} borderOffset={1} /> : null}
      <View>
        <LineupTileTopRight
          duration={duration}
          trackId={id}
          isLongFormContent={isLongFormContent}
        />
        <LineupTileMetadata
          artistName={name}
          coSign={coSign}
          renderImage={renderImage}
          onPressTitle={onPressTitle}
          title={title}
          user={user}
          isPlayingUid={isPlayingUid}
        />
        {coSign ? <LineupTileCoSign coSign={coSign} /> : null}
        <LineupTileStats
          favoriteType={favoriteType}
          repostType={repostType}
          hidePlays={hidePlays}
          id={id}
          index={index}
          isCollection={isCollection}
          isTrending={isTrending}
          variant={variant}
          isUnlisted={isUnlisted}
          playCount={playCount}
          repostCount={repost_count}
          saveCount={save_count}
          showRankIcon={showRankIcon}
          hasStreamAccess={hasStreamAccess}
          streamConditions={streamConditions}
          isOwner={isOwner}
          isArtistPick={isArtistPick}
          showArtistPick={showArtistPick}
          releaseDate={item?.release_date ? item.release_date : undefined}
        />
      </View>
      {children}

      <LineupTileActionButtons
        hasReposted={has_current_user_reposted}
        hasSaved={has_current_user_saved}
        isOwner={isOwner}
        isShareHidden={hideShare}
        isUnlisted={isUnlisted}
        readonly={isReadonly}
        trackId={trackId}
        streamConditions={streamConditions}
        hasStreamAccess={hasStreamAccess}
        onPressOverflow={onPressOverflow}
        onPressRepost={onPressRepost}
        onPressSave={onPressSave}
        onPressShare={onPressShare}
      />
    </LineupTileRoot>
  )
}
