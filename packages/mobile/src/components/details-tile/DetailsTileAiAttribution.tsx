import { useEffect } from 'react'

import type { ID } from '@audius/common/models'
import { aiPageActions, aiPageSelectors } from '@audius/common/store'
import { View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'

import IconRobot from 'app/assets/images/iconRobot.svg'
import { Text } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const { fetchAiUser, reset } = aiPageActions
const { getAiUser } = aiPageSelectors

const messages = {
  title: 'Generated with AI',
  description: 'This song was made by an AI that has been trained to imitate ',
  viewMore: 'View More'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    gap: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight7,
    paddingBottom: spacing(4),
    marginBottom: spacing(4)
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2)
  },
  titleText: {
    textTransform: 'uppercase',
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.bold,
    lineHeight: typography.fontSize.small * 1.3
  },
  description: {
    fontSize: typography.fontSize.small,
    lineHeight: typography.fontSize.small * 1.3
  },
  userBadgeTitle: {
    fontSize: typography.fontSize.small,
    lineHeight: typography.fontSize.small * 1.3,
    fontFamily: typography.fontByWeight.medium,
    color: palette.secondary
  },
  badges: {
    paddingTop: spacing(4)
  },
  viewMore: {
    fontSize: typography.fontSize.small,
    lineHeight: typography.fontSize.small * 1.2,
    color: palette.secondary
  }
}))

export const DetailsTileAiAttribution = ({ userId }: { userId: ID }) => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const navigation = useNavigation()

  const dispatch = useDispatch()
  const user = useSelector(getAiUser)

  useEffect(() => {
    dispatch(fetchAiUser({ userId }))
    return function cleanup() {
      dispatch(reset())
    }
  }, [dispatch, userId])

  const handleViewMorePress = () => {
    navigation.navigate('AiGeneratedTracks', { userId })
  }

  return user ? (
    <View style={styles.root}>
      <View style={styles.title}>
        <IconRobot fill={neutral} />
        <Text style={styles.titleText}>{messages.title}</Text>
      </View>
      <Text style={styles.description}>
        {messages.description}
        <Text style={styles.userBadgeTitle}>{user.name}</Text>
        <UserBadges user={user} hideName style={styles.badges} badgeSize={12} />
      </Text>
      <TouchableWithoutFeedback onPress={handleViewMorePress}>
        <Text style={styles.viewMore}>{messages.viewMore}</Text>
      </TouchableWithoutFeedback>
    </View>
  ) : null
}
