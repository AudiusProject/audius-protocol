import type { ComponentType, ReactNode } from 'react'

import type { ID, User } from '@audius/common/models'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import { Text, View } from 'react-native'
import type { LinearGradientProps } from 'react-native-linear-gradient'

import type { ImageProps } from '@audius/harmony-native'
import type { TileProps } from 'app/components/core'
import { Tile } from 'app/components/core'
import UserBadges from 'app/components/user-badges/UserBadges'
import type { StylesProp } from 'app/styles'
import { flexRowCentered, makeStyles } from 'app/styles'

import { CollectionDownloadStatusIndicator } from '../offline-downloads/CollectionDownloadStatusIndicator'

import { CollectionDogEar } from './CollectionDogEar'

export type CardType = 'user' | 'collection'

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
  cardContent: {
    paddingHorizontal: spacing(2)
  },
  cardImage: {
    borderRadius: 6,
    height: 152,
    width: 152,
    marginTop: spacing(2),
    alignSelf: 'center'
  },
  userImage: {
    borderRadius: 152 / 2,
    backgroundColor: '#ddd'
  },
  textContainer: {
    paddingVertical: spacing(1)
  },
  primaryTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryText: {
    ...typography.h3,
    marginBottom: 0,
    color: palette.neutral,
    textAlign: 'center',
    // needed to keep emojis from increasing text height
    lineHeight: 24,
    height: 24
  },
  secondaryText: {
    ...typography.body2,
    color: palette.neutral,
    marginHorizontal: spacing(1),
    textAlign: 'center'
  },
  secondaryTextContainer: {
    ...flexRowCentered(),
    justifyContent: 'center'
  }
}))

type BaseCardProps = {
  onPress: (id: ID) => void
  noNavigatePress: () => void
  primaryText: string
  renderImage: (options?: ImageProps) => ReactNode
  secondaryText?: string
  TileProps?: Omit<TileProps<ComponentType<LinearGradientProps>>, 'children'>
  style?: StyleProp<ViewStyle>
  styles?: StylesProp<{
    primaryText: TextStyle
    secondaryText: TextStyle
  }>
}

export type ProfileCardProps = BaseCardProps & {
  type: 'user'
  user: User
}
export type CollectionCardProps = BaseCardProps & {
  type: 'collection'
  id: number
}
export type CardProps = ProfileCardProps | CollectionCardProps

export const Card = (props: CardProps) => {
  const {
    onPress,
    primaryText,
    renderImage,
    secondaryText,
    style,
    styles: stylesProp,
    TileProps = {}
  } = props

  const styles = useStyles()

  return (
    <Tile
      onPress={onPress}
      styles={{ root: style, content: styles.cardContent }}
      {...TileProps}
    >
      {props.type === 'collection' ? (
        <CollectionDogEar collectionId={props.id} borderOffset={1} />
      ) : null}
      {renderImage({
        style: [styles.cardImage, props.type === 'user' && styles.userImage]
      })}
      <View style={styles.textContainer}>
        <View style={styles.primaryTextContainer}>
          <Text
            numberOfLines={1}
            style={[styles.primaryText, stylesProp?.primaryText]}
          >
            {primaryText}
          </Text>
          {props.type === 'user' ? (
            <UserBadges user={props.user} badgeSize={12} hideName />
          ) : null}
        </View>
        <View style={styles.secondaryTextContainer}>
          <Text
            numberOfLines={1}
            style={[styles.secondaryText, stylesProp?.secondaryText]}
          >
            {secondaryText}
          </Text>
          {props.type === 'collection' ? (
            <CollectionDownloadStatusIndicator
              size={18}
              collectionId={props.id}
            />
          ) : null}
        </View>
      </View>
    </Tile>
  )
}
