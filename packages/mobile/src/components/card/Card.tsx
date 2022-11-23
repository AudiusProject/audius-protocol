import type { ReactNode } from 'react'

import type { User } from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'
import { Text, View } from 'react-native'

import { Tile } from 'app/components/core'
import UserBadges from 'app/components/user-badges/UserBadges'
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
  onPress: () => void
  primaryText: string
  renderImage: () => ReactNode
  secondaryText?: string
  style?: StyleProp<ViewStyle>
  type?: CardType
  user: User
}

export const Card = (props: CardProps) => {
  const {
    onPress,
    primaryText,
    renderImage,
    secondaryText,
    style,
    type = 'user',
    user
  } = props

  const styles = useStyles()

  return (
    <Tile
      onPress={onPress}
      styles={{ root: style, content: styles.cardContent }}
    >
      <View style={styles.imgContainer}>
        <View style={[styles.cardImg, type === 'user' && styles.userImg]}>
          {renderImage()}
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
