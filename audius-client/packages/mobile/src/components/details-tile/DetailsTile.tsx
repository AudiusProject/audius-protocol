import { useCallback } from 'react'

import { Name } from 'audius-client/src/common/models/Analytics'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { squashNewLines } from 'audius-client/src/common/utils/formatUtil'
import { ImageStyle, Linking, TouchableOpacity, View } from 'react-native'
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
import { getPlaying } from 'app/store/audio/selectors'
import { flexRowCentered, makeStyles } from 'app/styles'
import { make, track } from 'app/utils/analytics'

import { DetailsTileActionButtons } from './DetailsTileActionButtons'
import { DetailsTileStats } from './DetailsTileStats'
import { DetailsTileProps } from './types'

const messages = {
  play: 'play',
  pause: 'pause'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  topContent: {
    paddingHorizontal: spacing(6),
    paddingTop: spacing(4),
    width: '100%',
    alignItems: 'center'
  },

  typeLabel: {
    marginBottom: spacing(4),
    height: 18,
    color: palette.neutralLight4,
    fontSize: 14,
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase'
  },

  coverArtWrapper: {
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: 4,
    overflow: 'hidden',
    height: 195,
    width: 195,
    marginBottom: spacing(6)
  },

  coverArt: {
    borderRadius: 4,
    overflow: 'hidden'
  },

  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing(4)
  },

  artistContainer: {
    ...flexRowCentered(),
    marginBottom: spacing(4)
  },

  artist: {
    color: palette.secondary,
    fontSize: 18
  },

  badge: {
    marginLeft: spacing(1)
  },

  descriptionContainer: {
    width: '100%'
  },

  description: {
    fontSize: 16,
    textAlign: 'left',
    width: '100%',
    marginBottom: spacing(6)
  },

  buttonSection: {
    width: '100%',
    marginBottom: spacing(3)
  },

  playButtonText: {
    textTransform: 'uppercase'
  },

  infoSection: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    width: '100%',
    paddingTop: spacing(4),
    paddingBottom: spacing(2)
  },

  noStats: {
    borderWidth: 0
  },

  infoFact: {
    ...flexRowCentered(),
    flexBasis: '50%',
    marginBottom: spacing(4)
  },

  infoLabel: {
    ...flexRowCentered(),
    color: palette.neutralLight5,
    fontSize: 14,
    lineHeight: 14,
    textTransform: 'uppercase',
    marginRight: spacing(2)
  },

  infoValue: {
    flexShrink: 1,
    lineHeight: 14,
    color: palette.neutral,
    fontSize: 14
  },

  infoIcon: {
    marginTop: -spacing(1)
  },

  link: {
    color: palette.primary
  }
}))

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
  const styles = useStyles()
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
    <CoSign size={Size.LARGE}>
      <DynamicImage
        source={imageUrl ? { uri: imageUrl } : undefined}
        styles={{ image: styles.coverArt as ImageStyle }}
      />
    </CoSign>
  ) : (
    <DynamicImage
      source={imageUrl ? { uri: imageUrl } : undefined}
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
              <Text
                style={styles.description}
                suppressHighlighting
                weight='medium'
              >
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
