import { useCallback } from 'react'

import { WidthSizes, type Supporting } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { TIPPING_TOP_RANK_THRESHOLD } from '@audius/web/src/utils/constants'
import { css } from '@emotion/native'
import { useTheme } from '@emotion/react'
import type { StyleProp, ViewStyle } from 'react-native'
import { ImageBackground, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useSelector } from 'react-redux'

import { IconTrophy } from '@audius/harmony-native'
import { Text, Tile, ProfilePicture } from 'app/components/core'
import { useCoverPhoto } from 'app/components/image/CoverPhoto'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'
const { getUser } = cacheUsersSelectors

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    marginTop: spacing(2),
    paddingBottom: spacing(1),
    marginHorizontal: spacing(1),
    borderRadius: 8,
    overflow: 'hidden'
  },
  backgroundImage: {
    borderRadius: 8,
    overflow: 'hidden'
  },
  gradient: {
    minWidth: 220,
    height: 88,
    justifyContent: 'space-between',
    padding: spacing(2)
  },
  supportingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    margin: spacing(1)
  },
  rank: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: spacing(0.5),
    paddingHorizontal: spacing(1.125),
    borderWidth: 1,
    borderColor: palette.staticNeutralLight8,
    borderRadius: spacing(4),
    backgroundColor: palette.staticWhite
  },
  rankNumberSymbol: {
    marginStart: spacing(1),
    marginEnd: spacing(0.5)
  },
  rankText: {
    textTransform: 'uppercase',
    marginTop: spacing(-1),
    marginBottom: spacing(-1)
  },
  nameText: {
    color: palette.staticWhite,
    flexShrink: 1
  }
}))

type SupportingTileProps = {
  supporting: Supporting
  style?: StyleProp<ViewStyle>
  scaleTo?: number
}

export const SupportingTile = (props: SupportingTileProps) => {
  const { supporting, style, scaleTo } = props
  const styles = useStyles()
  const navigation = useNavigation()
  const { secondary } = useThemeColors()
  const user = useSelector((state) => {
    return getUser(state, { id: supporting.receiver_id })
  })
  const { user_id, handle, name } = user || {}
  const isTopRank =
    supporting.rank >= 1 && supporting.rank <= TIPPING_TOP_RANK_THRESHOLD
  const { spacing: harmonySpacing } = useTheme()

  const { source: coverPhotoSource } = useCoverPhoto({
    userId: user_id,
    size: WidthSizes.SIZE_640
  })

  const handlePress = useCallback(() => {
    if (handle) {
      navigation.push('Profile', { handle })
    }
  }, [navigation, handle])

  const iconProps = {
    height: spacing(3.75),
    width: spacing(3.75)
  }

  return user ? (
    <Tile style={[styles.root, style]} onPress={handlePress} scaleTo={scaleTo}>
      <ImageBackground style={styles.backgroundImage} source={coverPhotoSource}>
        <LinearGradient
          colors={['#0000001A', '#0000004D']}
          useAngle
          angle={180}
          angleCenter={{ x: 0.5, y: 0.5 }}
          style={styles.gradient}
        >
          {isTopRank ? (
            <View style={styles.rank}>
              <IconTrophy fill={secondary} {...iconProps} />
              <Text
                style={styles.rankNumberSymbol}
                variant='label'
                color='secondary'
                fontSize='small'
              >
                #
              </Text>
              <Text
                style={styles.rankText}
                variant='label'
                color='secondary'
                fontSize='large'
              >
                {supporting.rank}
              </Text>
            </View>
          ) : null}
          <View style={styles.supportingInfo}>
            <ProfilePicture
              style={css({
                width: harmonySpacing.unit8,
                height: harmonySpacing.unit8
              })}
              mr='s'
              borderWidth='thin'
              userId={user.user_id}
            />
            <Text
              style={styles.nameText}
              variant='h3'
              noGutter
              numberOfLines={1}
            >
              {name}
            </Text>
            <UserBadges user={user} hideName />
          </View>
        </LinearGradient>
      </ImageBackground>
    </Tile>
  ) : null
}
