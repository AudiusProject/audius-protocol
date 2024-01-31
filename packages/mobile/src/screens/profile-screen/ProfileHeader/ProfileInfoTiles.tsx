import type { ComponentType } from 'react'
import { useCallback } from 'react'

import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  relatedArtistsUISelectors
} from '@audius/common/store'
import type { ViewStyle } from 'react-native'
import { View, ScrollView } from 'react-native'
import { useSelector } from 'react-redux'

import IconFollowing from 'app/assets/images/iconFollowing.svg'
import IconRobot from 'app/assets/images/iconRobot.svg'
import IconUserGroup from 'app/assets/images/iconUserGroup.svg'
import { Text, Tile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
import type { SvgProps } from 'app/types/svg'
import { useThemePalette } from 'app/utils/theme'

import { useSelectProfile } from '../selectors'

const { getUserId } = accountSelectors
const { selectRelatedArtistsById } = relatedArtistsUISelectors

const useInfoTileStyles = makeStyles(({ spacing }) => ({
  root: { flexGrow: 1 },
  tile: { height: 50 },
  content: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    marginRight: spacing(2)
  }
}))

const messages = {
  aiGeneratedTracks: 'AI Generated Tracks',
  mutuals: 'Mutuals',
  relatedArtists: 'Related Artists'
}

type ProfileInfoTileProps = {
  style?: ViewStyle
  screen: string
  icon: ComponentType<SvgProps>
  text: string
}

const ProfileInfoTile = (props: ProfileInfoTileProps) => {
  const { style, screen, icon: Icon, text } = props
  const styles = useInfoTileStyles()
  const { neutral } = useThemePalette()
  const navigation = useNavigation()
  const { user_id } = useSelectProfile(['user_id'])

  const handlePress = useCallback(() => {
    navigation.navigate(screen, { userId: user_id })
  }, [navigation, screen, user_id])

  return (
    <Tile
      styles={{
        root: [styles.root, style],
        tile: styles.tile,
        content: styles.content
      }}
      onPress={handlePress}
    >
      <Icon height={20} width={20} fill={neutral} style={styles.icon} />
      <Text variant='h3' noGutter>
        {text}
      </Text>
    </Tile>
  )
}

type TileProps = {
  style?: ViewStyle
}

const AiGeneratedTracksTile = (props: TileProps) => {
  return (
    <ProfileInfoTile
      screen='AiGeneratedTracks'
      icon={IconRobot}
      text={messages.aiGeneratedTracks}
      {...props}
    />
  )
}

const MutualsTile = (props: TileProps) => {
  return (
    <ProfileInfoTile
      screen='Mutuals'
      icon={IconFollowing}
      text={messages.mutuals}
      {...props}
    />
  )
}

const RelatedArtistsTile = (props: TileProps) => {
  return (
    <ProfileInfoTile
      screen='RelatedArtists'
      icon={IconUserGroup}
      text={messages.relatedArtists}
      {...props}
    />
  )
}

const useStyles = makeStyles(({ spacing }) => ({
  rootScrollView: {
    marginHorizontal: spacing(-3)
  },
  rootScrollViewContent: {
    gap: spacing(2),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3)
  },
  rootView: {
    flexDirection: 'row',
    marginVertical: spacing(2),
    gap: spacing(2)
  },
  scrollableTile: {
    width: 200
  }
}))

export const ProfileInfoTiles = () => {
  const styles = useStyles()
  const { user_id, current_user_followee_follow_count, allow_ai_attribution } =
    useSelectProfile([
      'supporting_count',
      'user_id',
      'current_user_followee_follow_count',
      'allow_ai_attribution'
    ])

  const { isEnabled: isAiGeneratedTracksEnabled } = useFeatureFlag(
    FeatureFlags.AI_ATTRIBUTION
  )

  const accountId = useSelector(getUserId)

  const hasAiAttribution = allow_ai_attribution && isAiGeneratedTracksEnabled

  const hasMutuals =
    user_id !== accountId && current_user_followee_follow_count > 0

  const hasRelatedArtists = useSelector((state) => {
    const relatedArtists = selectRelatedArtistsById(state, user_id)
    if (!relatedArtists) return false
    const { relatedArtistIds, isTopArtistsRecommendation } = relatedArtists
    if (isTopArtistsRecommendation) return false
    return relatedArtistIds.length > 0
  })

  const hasAllThreeTiles = hasAiAttribution && hasMutuals && hasRelatedArtists

  if (hasAllThreeTiles) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rootScrollView}
        contentContainerStyle={styles.rootScrollViewContent}
      >
        <AiGeneratedTracksTile style={styles.scrollableTile} />
        <MutualsTile style={styles.scrollableTile} />
        <RelatedArtistsTile style={styles.scrollableTile} />
      </ScrollView>
    )
  }

  return (
    <View style={styles.rootView}>
      {hasAiAttribution ? <AiGeneratedTracksTile /> : null}
      {hasMutuals ? <MutualsTile /> : null}
      {hasRelatedArtists ? <RelatedArtistsTile /> : null}
    </View>
  )
}
