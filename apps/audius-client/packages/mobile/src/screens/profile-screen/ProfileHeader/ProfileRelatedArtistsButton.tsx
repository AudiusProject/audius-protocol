import { useCallback } from 'react'

import { FeatureFlags, relatedArtistsUISelectors } from '@audius/common'
import { useSelector } from 'react-redux'

import IconUserGroup from 'app/assets/images/iconUserGroup.svg'
import { Text, Tile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { useSelectProfile } from '../selectors'

const { selectRelatedArtistsById } = relatedArtistsUISelectors

const messages = {
  relatedartists: 'Related Artists'
}

const useStyles = makeStyles(({ spacing }) => ({
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

export const ProfileRelatedArtistsButton = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const profile = useSelectProfile(['user_id'])
  const { user_id } = profile
  const navigation = useNavigation()
  const relatedArtists = useSelector((state) =>
    selectRelatedArtistsById(state, user_id)
  )
  const isRelatedArtistsFeatureEnabled = useFeatureFlag(
    FeatureFlags.RELATED_ARTISTS_ON_PROFILE_ENABLED
  )

  const handlePress = useCallback(() => {
    navigation.push('RelatedArtists', { userId: user_id })
  }, [navigation, user_id])

  if (
    !isRelatedArtistsFeatureEnabled ||
    !relatedArtists?.relatedArtistIds ||
    relatedArtists.isTopArtistsRecommendation ||
    relatedArtists.relatedArtistIds.length <= 0
  )
    return null

  return (
    <Tile
      styles={{ root: styles.root, tile: styles.tile, content: styles.content }}
      onPress={handlePress}
    >
      <IconUserGroup
        height={20}
        width={20}
        fill={neutral}
        style={styles.icon}
      />
      <Text variant='h3' noGutter>
        {messages.relatedartists}
      </Text>
    </Tile>
  )
}
