import React, { useCallback, useState, useEffect, useRef } from 'react'

import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'

import { TrackTileProps } from 'app/components/track-tile/types'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexCol, flexRow } from 'app/styles'
import { ThemeColors } from 'app/utils/theme'

import { TrackBannerIcon, TrackBannerIconType } from './TrackBannerIcon'
import { TrackTileBottomButtons } from './TrackTileBottomButtons'
import { TrackTileCoSign } from './TrackTileCoSign'
import { TrackTileMetadata } from './TrackTileMetadata'
import { TrackTileStats } from './TrackTileStats'
import { TrackTileTopRight } from './TrackTileTopRight'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      ...flexRow(),
      minHeight: 152,
      borderColor: themeColors.neutralLight8,
      backgroundColor: themeColors.white,
      borderWidth: 1,
      borderRadius: 8,
      maxWidth: 400,
      marginHorizontal: 'auto',
      marginBottom: 12,
      elevation: 3,
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3
    },
    mainContent: {
      ...flexCol(),
      flex: 1
    }
  })

export const TrackTile = ({
  artistName,
  coSign,
  coverArtSizes,
  duration,
  fieldVisibility,
  goToTrackPage,
  goToArtistPage,
  hasCurrentUserReposted,
  hasCurrentUserSaved,
  id,
  index,
  isArtistPick,
  isOwner,
  isPlaying,
  isTrending,
  isUnlisted,
  listenCount,
  makeGoToFavoritesPage,
  makeGoToRepostsPage,
  onClickOverflow,
  onLoad,
  onShare,
  repostCount,
  saveCount,
  showArtistPick,
  showRankIcon,
  showSkeleton,
  title,
  togglePlay,
  toggleRepost,
  toggleSave,
  user,
  uid
}: TrackTileProps) => {
  const opacity = useRef(new Animated.Value(0)).current
  const fadeIn = { opacity }

  const styles = useThemedStyles(createStyles)
  const hideShare: boolean = fieldVisibility
    ? fieldVisibility.share === false
    : false
  const hidePlays = fieldVisibility
    ? fieldVisibility.play_count === false
    : false

  const onToggleSave = useCallback(() => toggleSave(id), [toggleSave, id])

  const onToggleRepost = useCallback(() => toggleRepost(id), [toggleRepost, id])

  const onClickShare = useCallback(() => onShare(id), [onShare, id])

  const onClickOverflowMenu = useCallback(
    () => onClickOverflow && onClickOverflow(id),
    [onClickOverflow, id]
  )

  const [artworkLoaded, setArtworkLoaded] = useState(false)

  const isLoaded = artworkLoaded && !showSkeleton

  useEffect(() => {
    if (isLoaded) {
      onLoad(index)
      Animated.timing(opacity, {
        toValue: 1,
        easing: Easing.ease,
        useNativeDriver: true
      }).start()
    }
  }, [onLoad, isLoaded, index, opacity])

  return (
    <View style={styles.container}>
      {showArtistPick && isArtistPick && (
        <TrackBannerIcon type={TrackBannerIconType.STAR} />
      )}
      {isUnlisted && <TrackBannerIcon type={TrackBannerIconType.HIDDEN} />}
      <Pressable
        style={styles.mainContent}
        disabled={showSkeleton}
        onPress={() => togglePlay(uid, id)}
      >
        <TrackTileTopRight
          duration={duration}
          fadeIn={fadeIn}
          isArtistPick={isArtistPick}
          isUnlisted={isUnlisted}
          showArtistPick={showArtistPick}
        />
        <TrackTileMetadata
          artistName={artistName}
          coSign={coSign}
          coverArtSizes={coverArtSizes}
          fadeIn={fadeIn}
          goToArtistPage={goToArtistPage}
          goToTrackPage={goToTrackPage}
          id={id}
          isLoaded={isLoaded}
          isPlaying={isPlaying}
          setArtworkLoaded={setArtworkLoaded}
          showSkeleton={showSkeleton}
          title={title}
          user={user}
        />
        {coSign && (
          <Animated.View style={fadeIn}>
            <TrackTileCoSign coSign={coSign} />
          </Animated.View>
        )}
        <TrackTileStats
          fadeIn={fadeIn}
          hidePlays={hidePlays}
          id={id}
          index={index}
          isTrending={isTrending}
          isUnlisted={isUnlisted}
          listenCount={listenCount}
          makeGoToFavoritesPage={makeGoToFavoritesPage}
          makeGoToRepostsPage={makeGoToRepostsPage}
          repostCount={repostCount}
          saveCount={saveCount}
          showRankIcon={showRankIcon}
        />
        <TrackTileBottomButtons
          hasSaved={hasCurrentUserSaved}
          hasReposted={hasCurrentUserReposted}
          toggleRepost={onToggleRepost}
          toggleSave={onToggleSave}
          onShare={onClickShare}
          onPressOverflow={onClickOverflowMenu}
          isOwner={isOwner}
          isUnlisted={isUnlisted}
          isShareHidden={hideShare}
        />
      </Pressable>
    </View>
  )
}
