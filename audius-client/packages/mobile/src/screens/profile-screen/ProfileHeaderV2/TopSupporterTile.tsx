import { useCallback } from 'react'

import { WidthSizes } from 'audius-client/src/common/models/ImageSizes'
import { User } from 'audius-client/src/common/models/User'
import { profilePage } from 'audius-client/src/utils/route'
import { ImageBackground, StyleProp, View, ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconTip from 'app/assets/images/iconTip.svg'
import IconTrophy from 'app/assets/images/iconTrophy.svg'
import { Text, Tile } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useUserCoverPhoto } from 'app/hooks/useUserCoverPhoto'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  supporter: 'Supporter'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(3),
    paddingBottom: spacing(1),
    width: 220,
    marginRight: spacing(2)
  },
  supporterInfo: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden'
  },
  supporterInfoRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(2)
  },
  profilePicture: {
    height: spacing(8),
    width: spacing(8),
    marginRight: spacing(1),
    borderWidth: 1
  },
  rankRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4)
  },
  rankText: {
    textTransform: 'uppercase'
  }
}))

type TopSupporterTileProps = {
  supporter: User
  rank: number
  style?: StyleProp<ViewStyle>
}

export const TopSupporterTile = (props: TopSupporterTileProps) => {
  const { supporter, rank, style } = props
  const { user_id, handle, name, _cover_photo_sizes } = supporter
  const styles = useStyles()
  const { secondary, neutralLight4 } = useThemeColors()
  const isTopSupporter = rank === 1
  const navigation = useNavigation()

  const coverPhoto = useUserCoverPhoto({
    id: user_id,
    sizes: _cover_photo_sizes,
    size: WidthSizes.SIZE_640
  })

  const handlePress = useCallback(() => {
    navigation.push({
      native: { screen: 'Profile', params: { handle } },
      web: { route: profilePage(handle) }
    })
  }, [navigation, handle])

  const iconProps = {
    height: spacing(3),
    width: spacing(3),
    marginRight: 6
  }

  const supporterIcon = isTopSupporter ? (
    <IconTrophy fill={secondary} {...iconProps} />
  ) : (
    <IconTip fill={neutralLight4} {...iconProps} />
  )

  return (
    <Tile style={[styles.root, style]} onPress={handlePress}>
      <ImageBackground
        style={styles.supporterInfo}
        source={{ uri: coverPhoto }}
      >
        <LinearGradient
          colors={['#0000004D', '#0000001A']}
          useAngle
          angle={45}
          angleCenter={{ x: 0.5, y: 0.5 }}
          style={styles.supporterInfoRoot}
        >
          <ProfilePicture style={styles.profilePicture} profile={supporter} />
          <Text variant='h3' noGutter color='white' numberOfLines={1}>
            {name}
          </Text>
          <UserBadges user={supporter} hideName />
        </LinearGradient>
      </ImageBackground>
      <View style={styles.rankRoot}>
        {supporterIcon}
        <Text
          style={styles.rankText}
          variant='label'
          color={isTopSupporter ? 'secondary' : 'neutral'}
        >
          {isTopSupporter ? `#${rank}` : null} {messages.supporter}
        </Text>
      </View>
    </Tile>
  )
}
