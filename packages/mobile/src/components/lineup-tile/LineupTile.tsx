import { useCallback } from 'react'

import { useGatedContentAccess } from '@audius/common/hooks'
import {
  PurchaseableContentType,
  accountSelectors,
  gatedContentActions
} from '@audius/common/store'
import { isLongFormContent } from '@audius/common/utils'
import { View } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'

import type { LineupTileProps } from 'app/components/lineup-tile/types'
import { setVisibility } from 'app/store/drawers/slice'

import { CollectionDogEar } from '../collection/CollectionDogEar'
import { TrackDogEar } from '../track/TrackDogEar'

import { LineupTileActionButtons } from './LineupTileActionButtons'
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
  hideComments,
  id,
  index,
  isTrending,
  isUnlisted,
  source,
  onPress,
  onPressOverflow,
  onPressRepost,
  onPressSave,
  onPressShare,
  onPressTitle,
  onPressPublish,
  onPressEdit,
  playCount,
  commentCount,
  renderImage,
  repostType,
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
  const { user_id } = user
  const currentUserId = useSelector(getUserId)
  const isOwner = user_id === currentUserId
  const isCollection = 'playlist_id' in item
  const isAlbum = 'is_album' in item && item.is_album
  const isTrack = 'track_id' in item
  const contentType = isTrack ? 'track' : isAlbum ? 'album' : 'playlist'
  const contentId = isTrack ? item.track_id : item.playlist_id
  const streamConditions = item.stream_conditions ?? null
  const { hasStreamAccess } = useGatedContentAccess(item)

  const handlePress = useCallback(() => {
    if (contentId && !hasStreamAccess && !hasPreview) {
      dispatch(setLockedContentId({ id: contentId }))
      dispatch(setVisibility({ drawer: 'LockedContent', visible: true }))
    } else {
      onPress?.()
    }
  }, [contentId, hasStreamAccess, hasPreview, dispatch, onPress])

  const isReadonly = variant === 'readonly'
  const scale = isReadonly ? 1 : undefined

  return (
    <LineupTileRoot
      onPress={handlePress}
      style={styles}
      scaleTo={scale}
      {...TileProps}
    >
      {isTrack ? (
        <TrackDogEar trackId={id} hideUnlocked />
      ) : (
        <CollectionDogEar collectionId={id} hideUnlocked />
      )}
      <View>
        <LineupTileTopRight
          duration={duration}
          trackId={id}
          isLongFormContent={isTrack && isLongFormContent(item)}
          isCollection={isCollection}
        />
        <LineupTileMetadata
          coSign={coSign}
          renderImage={renderImage}
          onPressTitle={onPressTitle}
          title={title}
          user={user}
          isPlayingUid={isPlayingUid}
          type={contentType}
        />
        {/* We weren't passing coSign in and the ui is broken so I'm disabling for now */}
        {/* {coSign ? <LineupTileCoSign coSign={coSign} /> : null} */}
        <LineupTileStats
          favoriteType={favoriteType}
          repostType={repostType}
          hidePlays={hidePlays}
          hideComments={hideComments}
          id={id}
          index={index}
          isCollection={isCollection}
          isTrending={isTrending}
          variant={variant}
          isUnlisted={isUnlisted}
          playCount={playCount}
          repostCount={repost_count}
          saveCount={save_count}
          commentCount={commentCount}
          hasStreamAccess={hasStreamAccess}
          streamConditions={streamConditions}
          isOwner={isOwner}
          source={source}
        />
      </View>
      {children}
      {isReadonly ? null : (
        <LineupTileActionButtons
          hasReposted={has_current_user_reposted}
          hasSaved={has_current_user_saved}
          isOwner={isOwner}
          isShareHidden={hideShare}
          isUnlisted={isUnlisted}
          readonly={isReadonly}
          contentId={contentId}
          contentType={
            isTrack
              ? PurchaseableContentType.TRACK
              : PurchaseableContentType.ALBUM
          }
          streamConditions={streamConditions}
          hasStreamAccess={hasStreamAccess}
          source={source}
          onPressOverflow={onPressOverflow}
          onPressRepost={onPressRepost}
          onPressSave={onPressSave}
          onPressShare={onPressShare}
          onPressPublish={onPressPublish}
          onPressEdit={onPressEdit}
        />
      )}
    </LineupTileRoot>
  )
}
