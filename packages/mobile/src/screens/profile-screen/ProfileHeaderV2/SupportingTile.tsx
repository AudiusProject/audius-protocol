import { useCallback } from 'react'

import { WidthSizes } from 'audius-client/src/common/models/ImageSizes'
import { Supporting } from 'audius-client/src/common/models/Tipping'
import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { TIPPING_TOP_RANK_THRESHOLD } from 'audius-client/src/utils/constants'
import { profilePage } from 'audius-client/src/utils/route'
import { ImageBackground, StyleProp, View, ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconTip from 'app/assets/images/iconTip.svg'
import IconTrophy from 'app/assets/images/iconTrophy.svg'
import { Text, Tile } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useUserCoverPhoto } from 'app/hooks/useUserCoverPhoto'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  supporter: 'Supporter'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    marginTop: spacing(2),
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
    borderWidth: 1,
    borderColor: palette.staticWhite
  },
  rankRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4)
  },
  rankText: {
    textTransform: 'uppercase'
  },
  nameText: {
    color: palette.staticWhite
  }
}))

type SupportingTileProps = {
  supporting: Supporting
  style?: StyleProp<ViewStyle>
}

export const SupportingTile = (props: SupportingTileProps) => {
  const { supporting, style } = props
  const styles = useStyles()
  const navigation = useNavigation()
  const { secondary, neutralLight4 } = useThemeColors()
  const user = useSelectorWeb(state => {
    return getUser(state, { id: supporting.receiver_id })
  })
  const { user_id, handle, name, _cover_photo_sizes } = user || {}
  const isTopRank =
    supporting.rank >= 1 && supporting.rank <= TIPPING_TOP_RANK_THRESHOLD

  const coverPhoto = useUserCoverPhoto({
    id: user_id,
    sizes: _cover_photo_sizes ?? null,
    size: WidthSizes.SIZE_640
  })

  const handlePress = useCallback(() => {
    if (handle) {
      navigation.push({
        native: { screen: 'Profile', params: { handle } },
        web: { route: profilePage(handle) }
      })
    }
  }, [navigation, handle])

  const iconProps = {
    height: spacing(3),
    width: spacing(3),
    marginRight: 6
  }

  const supporterIcon = isTopRank ? (
    <IconTrophy fill={secondary} {...iconProps} />
  ) : (
    <IconTip fill={neutralLight4} {...iconProps} />
  )

  return user ? (
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
          <ProfilePicture style={styles.profilePicture} profile={user} />
          <Text variant='h3' noGutter numberOfLines={1} style={styles.nameText}>
            {name}
          </Text>
          <UserBadges user={user} hideName />
        </LinearGradient>
      </ImageBackground>
      <View style={styles.rankRoot}>
        {supporterIcon}
        <Text
          style={styles.rankText}
          variant='label'
          color={isTopRank ? 'secondary' : 'neutral'}
        >
          {isTopRank ? `#${supporting.rank} ` : null}
          {messages.supporter}
        </Text>
      </View>
    </Tile>
  ) : null
}
