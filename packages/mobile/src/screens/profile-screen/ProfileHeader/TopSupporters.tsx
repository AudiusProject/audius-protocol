import { useCallback } from 'react'

import { useSupporters } from '@audius/common/api'
import { MAX_PROFILE_TOP_SUPPORTERS } from '@audius/common/utils'
import { Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import { Flex, IconCaretRight, IconTrophy } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { ProfilePictureList } from 'app/screens/notifications-screen/Notification'
import { ProfilePictureListSkeleton } from 'app/screens/notifications-screen/Notification/NotificationProfilePictureListSkeleton'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { useSelectProfile } from '../selectors'

const messages = {
  topSupporters: 'Top Supporters',
  buttonTitle: 'View'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  touchableRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profilePictureList: {
    marginRight: spacing(6)
  },
  profilePicture: {
    width: 28,
    height: 28
  },
  alignRowCenter: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    marginRight: spacing(2)
  },
  viewTopSupportersText: {
    marginRight: spacing(4),
    color: palette.neutral,
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.bold
  },
  viewTopSupportersButtonText: {
    color: palette.secondary,
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.bold
  }
}))

export const TopSupporters = () => {
  const styles = useStyles()
  const { secondary, neutral } = useThemeColors()
  const navigation = useNavigation()
  const { user_id, supporter_count } = useSelectProfile([
    'user_id',
    'supporter_count'
  ])

  const { data: supporters = [], isSuccess } = useSupporters({
    userId: user_id,
    pageSize: MAX_PROFILE_TOP_SUPPORTERS
  })

  const handlePress = useCallback(() => {
    navigation.push('TopSupporters', { userId: user_id, source: 'profile' })
  }, [navigation, user_id])

  return supporter_count ? (
    <Flex pv='s' alignItems='center' pointerEvents='box-none'>
      <TouchableOpacity style={styles.touchableRoot} onPress={handlePress}>
        {isSuccess && supporters.length > 0 ? (
          <ProfilePictureList
            users={supporters}
            totalUserCount={supporter_count}
            limit={MAX_PROFILE_TOP_SUPPORTERS}
            style={styles.profilePictureList}
            navigationType='push'
            interactive={false}
            imageStyles={styles.profilePicture}
          />
        ) : (
          <ProfilePictureListSkeleton
            count={supporter_count}
            limit={MAX_PROFILE_TOP_SUPPORTERS}
          />
        )}
        <View style={styles.alignRowCenter}>
          <IconTrophy style={styles.icon} fill={neutral} />
          <Text style={styles.viewTopSupportersText}>
            {messages.topSupporters}
          </Text>
          <Text style={styles.viewTopSupportersButtonText}>
            {messages.buttonTitle}
          </Text>
          <IconCaretRight fill={secondary} width={14} height={14} />
        </View>
      </TouchableOpacity>
    </Flex>
  ) : null
}
