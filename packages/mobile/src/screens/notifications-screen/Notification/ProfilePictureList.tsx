import { formatCount } from '@audius/common'
import type { User } from '@audius/common/models'
import type { StyleProp, ViewStyle } from 'react-native'
import { View, Text } from 'react-native'

import { makeStyles } from 'app/styles'

import { ProfilePicture } from './ProfilePicture'
import { PROFILE_PICTURE_BORDER_WIDTH } from './constants'

const USER_LENGTH_LIMIT = 9
const BASE_ZINDEX = 1

/**
 * Not all profile picture lists have the same profile picture size.
 * Some components pass in the dimensions (width and height) while others
 * use the default of spacing(10) - 2 (which is equal to 38).
 * We use the dimensions to determine how to position the
 * extra profile picture +N text.
 */
const defaultImageDimensions = { width: 38, height: 38 }

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    flexDirection: 'row'
  },
  image: {
    marginRight: spacing(-2)
  },
  imageExtraRoot: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imageExtraDim: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: PROFILE_PICTURE_BORDER_WIDTH,
    right: PROFILE_PICTURE_BORDER_WIDTH,
    bottom: PROFILE_PICTURE_BORDER_WIDTH,
    left: PROFILE_PICTURE_BORDER_WIDTH
  },
  imageCount: {
    textAlign: 'center',
    color: palette.staticWhite,
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.bold,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1
  },
  imageCountSmall: {
    fontSize: typography.fontSize.xxs
  }
}))

type ProfilePictureListProps = {
  users: User[]
  totalUserCount?: number
  limit?: number
  showOverflowCount?: boolean
  style?: StyleProp<ViewStyle>
  navigationType?: 'push' | 'navigate'
  interactive?: boolean
  imageStyles?: {
    width?: number
    height?: number
  }
}

export const ProfilePictureList = (props: ProfilePictureListProps) => {
  const {
    users,
    totalUserCount = users.length,
    limit = USER_LENGTH_LIMIT,
    showOverflowCount = true,
    style,
    navigationType,
    interactive,
    imageStyles
  } = props
  const imageWidth = imageStyles?.width ?? defaultImageDimensions.width
  const imageHeight = imageStyles?.height ?? defaultImageDimensions.height

  const useSmallText = imageWidth < defaultImageDimensions.width

  // We want the View containing the "+" count to be the size of the
  // inside content of the ProfilePicture it is sitting above.
  // So we will set its width and height to be the image's minus the
  // border width, accounting for both edges.
  const dimWidth = imageWidth - PROFILE_PICTURE_BORDER_WIDTH * 2
  const dimHeight = imageHeight - PROFILE_PICTURE_BORDER_WIDTH * 2

  const styles = useStyles()
  const showUserListDrawer = showOverflowCount && totalUserCount > limit
  /**
   * We add a +1 because the remaining users count includes
   * the tile that has the +N itself.
   */
  const remainingUsersCount = totalUserCount - limit + 1
  /**
   * If the total user count is greater than the limit, then
   * we slice at limit -1 to exclude the tile with the +N, since
   * that tile will be handled separately.
   * Otherwise, we slice at the limit, which would include all
   * users.
   */
  const sliceLimit = showUserListDrawer ? limit - 1 : limit

  return (
    <View style={[styles.root, style]}>
      {users
        .filter((u) => !u.is_deactivated)
        .slice(0, sliceLimit)
        .map((user, idx) => (
          <ProfilePicture
            profile={user}
            key={user.user_id}
            style={[
              styles.image,
              imageStyles,
              !showUserListDrawer && {
                zIndex: BASE_ZINDEX + users.length - idx
              }
            ]}
            navigationType={navigationType}
            interactive={interactive}
          />
        ))}
      {showUserListDrawer ? (
        <View style={styles.imageExtraRoot}>
          <ProfilePicture
            profile={users[limit - 1]}
            style={[styles.image, imageStyles]}
            navigationType={navigationType}
            interactive={interactive}
          />
          <View
            style={[
              styles.imageExtraDim,
              {
                width: dimWidth,
                height: dimHeight,
                // borderRadius of 50% or greater gives us a circle
                borderRadius: Math.ceil(dimWidth / 2)
              }
            ]}
          >
            <Text
              style={[
                styles.imageCount,
                useSmallText && styles.imageCountSmall
              ]}
            >
              {`+${formatCount(remainingUsersCount)}`}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}
