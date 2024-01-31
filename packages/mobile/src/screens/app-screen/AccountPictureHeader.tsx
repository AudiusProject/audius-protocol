import { useAccountHasClaimableRewards } from '@audius/common/hooks'
import { StringKeys, FeatureFlags } from '@audius/common/services'
import { accountSelectors, chatSelectors } from '@audius/common/store'
import { useDrawerProgress } from '@react-navigation/drawer'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'

import { ProfilePicture } from 'app/components/user'
import { useRemoteVar, useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'

const { getUserId } = accountSelectors
const { getHasUnreadMessages } = chatSelectors

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    height: spacing(8) + 2,
    width: spacing(8) + 2,
    borderWidth: 1
  },
  notificationBubbleRoot: {
    height: spacing(4),
    width: spacing(4),
    borderColor: palette.white,
    borderWidth: 2,
    borderRadius: 10,
    position: 'absolute',
    top: 0,
    right: 0
  },
  notificationBubble: {
    flex: 1,
    backgroundColor: palette.secondary,
    overflow: 'hidden',
    borderRadius: 10
  }
}))

type AccountPictureHeaderProps = {
  onPress: () => void
}

export const AccountPictureHeader = (props: AccountPictureHeaderProps) => {
  const { onPress } = props
  const drawerProgress = useDrawerProgress() as Animated.SharedValue<number>
  const styles = useStyles()
  const accountId = useSelector(getUserId)!
  const challengeRewardIds = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  const hasClaimableRewards = useAccountHasClaimableRewards(challengeRewardIds)
  const { isEnabled: isChatEnabled } = useFeatureFlag(FeatureFlags.CHAT_ENABLED)
  const hasUnreadMessages = useSelector(getHasUnreadMessages)
  const showNotificationBubble =
    hasClaimableRewards || (hasUnreadMessages && isChatEnabled)

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drawerProgress.value, [0, 1], [1, 0])
  }))

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity onPress={onPress}>
        <ProfilePicture
          userId={accountId}
          style={styles.root}
          priority='high'
        />
        {showNotificationBubble ? (
          <View style={styles.notificationBubbleRoot}>
            <View style={styles.notificationBubble} />
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  )
}
