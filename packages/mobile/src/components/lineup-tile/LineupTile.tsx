import { useCallback } from 'react'

import {
  accountSelectors,
  Genre,
  premiumContentActions,
  usePremiumContentAccess
} from '@audius/common'
import { View } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'

import { DogEar, DogEarType } from 'app/components/core'
import type { LineupTileProps } from 'app/components/lineup-tile/types'
import { useIsGatedContentEnabled } from 'app/hooks/useIsGatedContentEnabled'
import { setVisibility } from 'app/store/drawers/slice'

import { LineupTileActionButtons } from './LineupTileActionButtons'
import { LineupTileCoSign } from './LineupTileCoSign'
import { LineupTileMetadata } from './LineupTileMetadata'
import { LineupTileRoot } from './LineupTileRoot'
import { LineupTileStats } from './LineupTileStats'
import { LineupTileTopRight } from './LineupTileTopRight'

const { getUserId } = accountSelectors
const { setLockedContentId } = premiumContentActions

export const LineupTile = ({
  children,
  coSign,
  duration,
  favoriteType,
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
  const isGatedContentEnabled = useIsGatedContentEnabled()
  const {
    has_current_user_reposted,
    has_current_user_saved,
    repost_count,
    save_count
  } = item
  const { artist_pick_track_id, name, user_id } = user
  const currentUserId = useSelector(getUserId)
  const isOwner = user_id === currentUserId
  const isCollection = 'playlist_id' in item
  const isTrack = 'track_id' in item
  const trackId = isTrack ? item.track_id : undefined
  const premiumConditions = isTrack ? item.premium_conditions : null
  const isArtistPick = artist_pick_track_id === id
  const { doesUserHaveAccess } = usePremiumContentAccess(isTrack ? item : null)
  const dispatch = useDispatch()

  const showPremiumDogEar =
    isGatedContentEnabled &&
    premiumConditions &&
    (isOwner || !doesUserHaveAccess) &&
    !(showArtistPick && isArtistPick)

  const dogEarType = showPremiumDogEar
    ? isOwner
      ? premiumConditions.nft_collection
        ? DogEarType.COLLECTIBLE_GATED
        : DogEarType.SPECIAL_ACCESS
      : DogEarType.LOCKED
    : null

  const handlePress = useCallback(() => {
    if (isGatedContentEnabled && trackId && !doesUserHaveAccess) {
      dispatch(setLockedContentId({ id: trackId }))
      dispatch(setVisibility({ drawer: 'LockedContent', visible: true }))
    } else {
      onPress?.()
    }
  }, [isGatedContentEnabled, trackId, doesUserHaveAccess, dispatch, onPress])

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
      {showPremiumDogEar && dogEarType ? (
        <DogEar type={dogEarType} style={{ shadowRadius: 1 }} />
      ) : null}
      {showArtistPick && isArtistPick ? (
        <DogEar type={DogEarType.STAR} />
      ) : null}
      {isUnlisted ? <DogEar type={DogEarType.HIDDEN} /> : null}
      <View>
        <LineupTileTopRight
          duration={duration}
          trackId={id}
          isUnlisted={isUnlisted}
          isOwner={isOwner}
          doesUserHaveAccess={doesUserHaveAccess}
          premiumConditions={premiumConditions}
          isArtistPick={isArtistPick}
          isLongFormContent={isLongFormContent}
          showArtistPick={showArtistPick}
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
        />
      </View>
      {children}
      {!isReadonly ? (
        <LineupTileActionButtons
          hasReposted={has_current_user_reposted}
          hasSaved={has_current_user_saved}
          isOwner={isOwner}
          isShareHidden={hideShare}
          isUnlisted={isUnlisted}
          trackId={trackId}
          doesUserHaveAccess={doesUserHaveAccess}
          onPressOverflow={onPressOverflow}
          onPressRepost={onPressRepost}
          onPressSave={onPressSave}
          onPressShare={onPressShare}
        />
      ) : null}
    </LineupTileRoot>
  )
}
