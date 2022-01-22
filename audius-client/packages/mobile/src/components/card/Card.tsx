import React from 'react'

import {
  useCollectionCoverArt,
  useUserProfilePicture
} from 'audius-client/src/common/hooks/useImageSize'
import {
  CoverArtSizes,
  ProfilePictureSizes,
  SquareSizes
} from 'audius-client/src/common/models/ImageSizes'
import { User } from 'audius-client/src/common/models/User'
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native'
import { Shadow } from 'react-native-shadow-2'

import DynamicImage from 'app/components/dynamic-image'
import UserBadges from 'app/components/user-badges/UserBadges'
import { ThemeColors, useThemedStyles } from 'app/hooks/useThemedStyles'
import { ID } from 'app/store/notifications/types'
import { font } from 'app/styles'

export type CardType = 'user' | 'collection'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: themeColors.white,
      borderRadius: 8,
      overflow: 'hidden',
      width: '100%',
      minWidth: 172,
      maxWidth: 190
    },
    cardContent: {
      display: 'flex',
      paddingHorizontal: 8
    },
    imgContainer: {
      paddingTop: 8,
      paddingHorizontal: 8
    },
    cardImg: {
      position: 'relative',
      backgroundColor: '#ddd',
      borderRadius: 6,
      overflow: 'hidden',
      paddingBottom: '100%',
      width: '100%'
    },
    userImg: {
      borderRadius: 1000
    },
    textContainer: {
      paddingVertical: 4
    },
    primaryText: {
      ...font('bold'),
      color: themeColors.neutral,
      fontSize: 14,
      lineHeight: 18,
      marginBottom: 2,
      maxWidth: 160,
      overflow: 'hidden',
      textAlign: 'center'
    },
    secondaryText: {
      ...font('medium'),
      color: themeColors.neutral,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 2,
      overflow: 'hidden',
      textAlign: 'center',
      width: '100%'
    }
  })

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
  const image = useImage(id, imageSize, SquareSizes.SIZE_150_BY_150)

  return <DynamicImage image={{ uri: image }} />
}

export const Card = ({
  id,
  imageSize,
  onPress,
  primaryText,
  secondaryText,
  style,
  type = 'user',
  user
}: CardProps) => {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={style}>
      <Shadow
        offset={[0, 2]}
        viewStyle={{ alignSelf: 'stretch' }}
        distance={5}
        startColor='rgba(133,129,153,0.11)'
      >
        <View style={styles.cardContainer}>
          <TouchableOpacity onPress={onPress}>
            <View style={styles.cardContent}>
              <View style={styles.imgContainer}>
                <View
                  style={[styles.cardImg, type === 'user' && styles.userImg]}
                >
                  <CardImage imageSize={imageSize} type={type} id={id} />
                </View>
              </View>
              <View style={styles.textContainer}>
                <Text numberOfLines={1} style={styles.primaryText}>
                  {primaryText}
                  {type === 'user' ? (
                    <UserBadges
                      user={{
                        balance: user.balance,
                        associated_wallets_balance:
                          user.associated_wallets_balance,
                        name: user.name,
                        is_verified: user.is_verified
                      }}
                      badgeSize={12}
                      hideName
                    />
                  ) : null}
                </Text>
                <Text numberOfLines={1} style={styles.secondaryText}>
                  {secondaryText}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Shadow>
    </View>
  )
}
