import { useCallback } from 'react'

import { Name } from 'audius-client/src/common/models/Analytics'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { squashNewLines } from 'audius-client/src/common/utils/formatUtil'
import {
  ImageStyle,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'
import HyperLink from 'react-native-hyperlink'
import { useSelector } from 'react-redux'

import IconPause from 'app/assets/images/iconPause.svg'
import IconPlay from 'app/assets/images/iconPlay.svg'
import CoSign from 'app/components/co-sign/CoSign'
import { Size } from 'app/components/co-sign/types'
import { Button, DynamicImage, Tile } from 'app/components/core'
import Text from 'app/components/text'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { getPlaying } from 'app/store/audio/selectors'
import { flexRowCentered } from 'app/styles'
import { make, track } from 'app/utils/analytics'
import { ThemeColors } from 'app/utils/theme'

import { DetailsTileActionButtons } from './DetailsTileActionButtons'
import { DetailsTileStats } from './DetailsTileStats'
import { DetailsTileProps } from './types'

const messages = {
  play: 'play',
  pause: 'pause'
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    topContent: {
      paddingHorizontal: 24,
      paddingTop: 16,
      width: '100%',
      alignItems: 'center'
    },

    typeLabel: {
      marginBottom: 15,
      height: 18,
      color: themeColors.neutralLight4,
      fontSize: 14,
      letterSpacing: 2,
      textAlign: 'center',
      textTransform: 'uppercase'
    },

    coverArtWrapper: {
      borderWidth: 1,
      borderColor: themeColors.neutralLight8,
      borderRadius: 4,
      overflow: 'hidden',
      height: 195,
      width: 195,
      marginBottom: 23
    },

    coverArt: {
      borderRadius: 4,
      overflow: 'hidden'
    },

    title: {
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 8
    },

    artistContainer: {
      ...flexRowCentered(),
      marginBottom: 16
    },

    artist: {
      color: themeColors.secondary,
      fontSize: 18
    },

    badge: {
      marginLeft: 4
    },

    descriptionContainer: {
      width: '100%'
    },

    description: {
      fontSize: 16,
      textAlign: 'left',
      width: '100%',
      marginBottom: 24
    },

    buttonSection: {
      width: '100%',
      marginBottom: 12
    },

    playButtonText: {
      textTransform: 'uppercase'
    },

    infoSection: {
      borderTopWidth: 1,
      borderTopColor: themeColors.neutralLight7,
      flexWrap: 'wrap',
      flexDirection: 'row',
      width: '100%',
      paddingTop: 24,
      paddingBottom: 8
    },

    noStats: {
      borderWidth: 0
    },

    infoFact: {
      ...flexRowCentered(),
      flexBasis: '50%',
      marginBottom: 16
    },

    infoLabel: {
      ...flexRowCentered(),
      color: themeColors.neutralLight5,
      fontSize: 14,
      lineHeight: 14,
      textTransform: 'uppercase',
      marginRight: 8
    },

    infoValue: {
      flexShrink: 1,
      lineHeight: 14,
      color: themeColors.neutral,
      fontSize: 14
    },

    infoIcon: {
      marginTop: -4
    },

    link: {
      color: themeColors.primary
    }
  })

/**
 * The details shown at the top of the Track Screen and Collection Screen
 */
export const DetailsTile = ({
  coSign,
  description,
  descriptionLinkPressSource,
  details,
  hasReposted,
  hasSaved,
  hideFavorite,
  hideFavoriteCount,
  hideListenCount,
  hideOverflow,
  hideRepost,
  hideRepostCount,
  hideShare,
  imageUrl,
  onPressFavorites,
  onPressOverflow,
  onPressPlay,
  onPressRepost,
  onPressReposts,
  onPressSave,
  onPressShare,
  playCount,
  renderBottomContent,
  renderHeader,
  renderImage,
  repostCount,
  saveCount,
  headerText,
  title,
  user
}: DetailsTileProps) => {
  const styles = useThemedStyles(createStyles)
  const navigation = useNavigation()

  const isPlaying = useSelector(getPlaying)
  const currentUserId = useSelectorWeb(getUserId)

  const isOwner = user?.user_id === currentUserId

  const handlePressArtistName = useCallback(() => {
    if (!user) {
      return
    }
    navigation.push({
      native: { screen: 'Profile', params: { handle: user.handle } },
      web: { route: `/${user.handle}` }
    })
  }, [navigation, user])

  const handleExternalLinkClick = useCallback(
    url => {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url)
          track(
            make({
              eventName: Name.LINK_CLICKING,
              url,
              source: descriptionLinkPressSource
            })
          )
        }
      })
    },
    [descriptionLinkPressSource]
  )

  const detailLabels = details.filter(
    ({ isHidden, value }) => !isHidden && !!value
  )

  const renderDetailLabels = () => {
    return detailLabels.map(infoFact => {
      return (
        <View key={infoFact.label} style={styles.infoFact}>
          <Text style={styles.infoLabel} weight='bold'>
            {infoFact.label}
          </Text>
          <Text style={styles.infoValue} weight='demiBold'>
            {infoFact.value}
          </Text>
          <View style={styles.infoIcon}>{infoFact.icon}</View>
        </View>
      )
    })
  }

  const imageElement = coSign ? (
    <CoSign size={Size.LARGE} style={styles.coverArt}>
      <DynamicImage
        source={{ uri: imageUrl }}
        styles={{ image: styles.coverArt as ImageStyle }}
      />
    </CoSign>
  ) : (
    <DynamicImage
      source={{ uri: imageUrl }}
      styles={{ image: styles.coverArt as ImageStyle }}
    />
  )

  return (
    <Tile>
      <View style={styles.topContent}>
        {renderHeader ? (
          renderHeader()
        ) : (
          <Text style={styles.typeLabel} weight='demiBold'>
            {headerText}
          </Text>
        )}
        <View style={styles.coverArtWrapper}>
          {renderImage ? renderImage() : imageElement}
        </View>
        <Text style={styles.title} weight='bold'>
          {title}
        </Text>
        {user ? (
          <TouchableOpacity onPress={handlePressArtistName}>
            <View style={styles.artistContainer}>
              <Text style={styles.artist}>{user.name}</Text>
              <UserBadges
                style={styles.badge}
                badgeSize={16}
                user={user}
                hideName
              />
            </View>
          </TouchableOpacity>
        ) : null}
        <View style={styles.buttonSection}>
          <Button
            styles={{ text: styles.playButtonText }}
            title={isPlaying ? messages.pause : messages.play}
            size='large'
            iconPosition='left'
            icon={isPlaying ? IconPause : IconPlay}
            onPress={onPressPlay}
            fullWidth
          />
          <DetailsTileActionButtons
            hasReposted={!!hasReposted}
            hasSaved={!!hasSaved}
            hideFavorite={hideFavorite}
            hideOverflow={hideOverflow}
            hideRepost={hideRepost}
            hideShare={hideShare}
            isOwner={isOwner}
            onPressOverflow={onPressOverflow}
            onPressRepost={onPressRepost}
            onPressSave={onPressSave}
            onPressShare={onPressShare}
          />
        </View>
        <DetailsTileStats
          favoriteCount={saveCount}
          hideFavoriteCount={hideFavoriteCount}
          hideListenCount={hideListenCount}
          hideRepostCount={hideRepostCount}
          onPressFavorites={onPressFavorites}
          onPressReposts={onPressReposts}
          playCount={playCount}
          repostCount={repostCount}
        />
        <View style={styles.descriptionContainer}>
          {description ? (
            <HyperLink
              onPress={handleExternalLinkClick}
              linkStyle={styles.link}
            >
              <Text style={styles.description} suppressHighlighting>
                {squashNewLines(description)}
              </Text>
            </HyperLink>
          ) : null}
        </View>
        <View
          style={[
            styles.infoSection,
            hideFavoriteCount &&
              hideListenCount &&
              hideRepostCount &&
              styles.noStats
          ]}
        >
          {renderDetailLabels()}
        </View>
      </View>
      {renderBottomContent?.()}
    </Tile>
  )
}
