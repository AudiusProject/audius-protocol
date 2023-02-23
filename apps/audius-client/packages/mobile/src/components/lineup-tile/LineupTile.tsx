import { useCallback } from 'react'

import {
  accountSelectors,
  premiumContentActions,
  usePremiumContentAccess
} from '@audius/common'
import { View } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'

import type { LineupTileProps } from 'app/components/lineup-tile/types'
import { useIsPremiumContentEnabled } from 'app/hooks/useIsPremiumContentEnabled'
import { PremiumTrackCornerTag } from 'app/screens/track-screen/PremiumTrackCornerTag'
import { setVisibility } from 'app/store/drawers/slice'

import { LineupTileActionButtons } from './LineupTileActionButtons'
import {
  LineupTileBannerIcon,
  LineupTileBannerIconType
} from './LineupTileBannerIcon'
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
  uid,
  user,
  isPlayingUid,
  TileProps
}: LineupTileProps) => {
  const isPremiumContentEnabled = useIsPremiumContentEnabled()
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

  const handlePress = useCallback(() => {
    if (isPremiumContentEnabled && trackId && !doesUserHaveAccess) {
      dispatch(setLockedContentId({ id: trackId }))
      dispatch(setVisibility({ drawer: 'LockedContent', visible: true }))
    } else {
      onPress?.()
    }
  }, [isPremiumContentEnabled, trackId, doesUserHaveAccess, dispatch, onPress])

  return (
    <LineupTileRoot onPress={handlePress} {...TileProps}>
      {isPremiumContentEnabled && premiumConditions && (
        <PremiumTrackCornerTag
          doesUserHaveAccess={doesUserHaveAccess}
          isOwner={isOwner}
          premiumConditions={premiumConditions}
        />
      )}
      {(!isPremiumContentEnabled || !premiumConditions) &&
      showArtistPick &&
      isArtistPick ? (
        <LineupTileBannerIcon type={LineupTileBannerIconType.STAR} />
      ) : null}
      {isUnlisted ? (
        <LineupTileBannerIcon type={LineupTileBannerIconType.HIDDEN} />
      ) : null}
      <View>
        <LineupTileTopRight
          duration={duration}
          isUnlisted={isUnlisted}
          premiumConditions={premiumConditions}
          isArtistPick={isArtistPick}
          showArtistPick={showArtistPick}
        />
        <LineupTileMetadata
          artistName={name}
          coSign={coSign}
          renderImage={renderImage}
          onPressTitle={onPressTitle}
          uid={uid}
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
          isUnlisted={isUnlisted}
          playCount={playCount}
          repostCount={repost_count}
          saveCount={save_count}
          showRankIcon={showRankIcon}
        />
      </View>
      {children}
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
    </LineupTileRoot>
  )
}
