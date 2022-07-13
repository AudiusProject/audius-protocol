import { ID } from 'audius-client/src/common/models/Identifiers'
import {
  CoverArtSizes,
  ProfilePictureSizes,
  SquareSizes
} from 'audius-client/src/common/models/ImageSizes'
import { User } from 'audius-client/src/common/models/User'
import { StyleProp, Text, View, ViewStyle } from 'react-native'

import { DynamicImage, Tile } from 'app/components/core'
import UserBadges from 'app/components/user-badges/UserBadges'
import { useCollectionCoverArt } from 'app/hooks/useCollectionCoverArt'
import { useUserProfilePicture } from 'app/hooks/useUserProfilePicture'
import { makeStyles } from 'app/styles'

export type CardType = 'user' | 'collection'

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
  cardContent: {
    paddingHorizontal: spacing(2)
  },
  imgContainer: {
    paddingTop: spacing(2),
    paddingHorizontal: spacing(1)
  },
  cardImg: {
    backgroundColor: '#ddd',
    borderRadius: 6,
    overflow: 'hidden',
    paddingBottom: '100%'
  },
  userImg: {
    borderRadius: 1000
  },
  textContainer: {
    paddingVertical: spacing(1)
  },
  primaryText: {
    ...typography.h3,
    color: palette.neutral,
    textAlign: 'center',
    // needed to keep emojis from increasing text height
    height: 18
  },
  secondaryText: {
    ...typography.body2,
    color: palette.neutral,
    textAlign: 'center'
  }
}))

export type CardProps = {
  id: ID
  imageSize: ProfilePictureSizes | CoverArtSizes | null
  onPress: () => void
  primaryText: string
  secondaryText?: string
  style?: StyleProp<ViewStyle>
  type?: CardType
  user: User
}

type CardImageProps = {
  id: ID
  imageSize: ProfilePictureSizes | CoverArtSizes | null
  type: CardType
}

const CardImage = ({ id, type, imageSize }: CardImageProps) => {
  const useImage =
    type === 'user' ? useUserProfilePicture : useCollectionCoverArt
  const image = useImage({
    id,
    sizes: imageSize,
    size: SquareSizes.SIZE_150_BY_150
  })

  return <DynamicImage uri={image} />
}

export const Card = (props: CardProps) => {
  const {
    id,
    imageSize,
    onPress,
    primaryText,
    secondaryText,
    style,
    type = 'user',
    user
  } = props

  const styles = useStyles()

  return (
    <Tile
      onPress={onPress}
      styles={{ root: style, content: styles.cardContent }}>
      <View style={styles.imgContainer}>
        <View style={[styles.cardImg, type === 'user' && styles.userImg]}>
          <CardImage imageSize={imageSize} type={type} id={id} />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text numberOfLines={1} style={styles.primaryText}>
          {primaryText}
          {type === 'user' ? (
            <UserBadges user={user} badgeSize={12} hideName />
          ) : null}
        </Text>
        <Text numberOfLines={1} style={styles.secondaryText}>
          {secondaryText}
        </Text>
      </View>
    </Tile>
  )
}
