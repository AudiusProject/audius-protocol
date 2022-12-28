import type { ReactNode } from 'react'

import type { User } from '@audius/common'
import type { StyleProp, ViewStyle } from 'react-native'
import { Text, View } from 'react-native'

import { Tile } from 'app/components/core'
import UserBadges from 'app/components/user-badges/UserBadges'
import { flexRowCentered, makeStyles } from 'app/styles'

import { DownloadStatusIndicator } from '../offline-downloads'

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
    marginHorizontal: spacing(1),
    textAlign: 'center'
  },
  secondaryTextContainer: {
    ...flexRowCentered(),
    justifyContent: 'center'
  }
}))

type BaseCardProps = {
  id?: string
  onPress: () => void
  primaryText: string
  renderImage: () => ReactNode
  secondaryText?: string
  style?: StyleProp<ViewStyle>
}

type ProfileCardProps = {
  type: 'user'
  user: User
}

type CollectionCardProps = {
  type: 'collection'
}

export type CardProps = BaseCardProps & (ProfileCardProps | CollectionCardProps)

export const Card = (props: CardProps) => {
  const { id, onPress, primaryText, renderImage, secondaryText, style } = props

  const styles = useStyles()

  return (
    <Tile
      onPress={onPress}
      styles={{ root: style, content: styles.cardContent }}
    >
      <View style={styles.imgContainer}>
        <View style={[styles.cardImg, props.type === 'user' && styles.userImg]}>
          {renderImage()}
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text numberOfLines={1} style={styles.primaryText}>
          {primaryText}
          {props.type === 'user' ? (
            <UserBadges user={props.user} badgeSize={12} hideName />
          ) : null}
        </Text>
        <View style={styles.secondaryTextContainer}>
          <Text numberOfLines={1} style={styles.secondaryText}>
            {secondaryText}
          </Text>
          {props.type === 'collection' ? (
            <DownloadStatusIndicator size={18} collectionId={id} />
          ) : null}
        </View>
      </View>
    </Tile>
  )
}
