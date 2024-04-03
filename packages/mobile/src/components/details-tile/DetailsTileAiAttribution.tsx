import { useEffect } from 'react'

import type { ID } from '@audius/common/models'
import { aiPageActions, aiPageSelectors } from '@audius/common/store'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, Text, IconRobot } from '@audius/harmony-native'
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
    <Flex borderBottom='strong' gap='s' pb='l'>
      <Flex direction='row' alignItems='center' gap='s'>
        <IconRobot fill={neutral} />
        <Text variant='label' textTransform='uppercase'>
          {messages.title}
        </Text>
      </Flex>
      <Text variant='body' size='s'>
        {messages.description}
        <Text variant='body' color='accent' size='s'>
          {user.name}
        </Text>
        <UserBadges user={user} hideName style={styles.badges} badgeSize={12} />
      </Text>
      <TouchableWithoutFeedback onPress={handleViewMorePress}>
        <Text size='s' color='accent' variant='body'>
          {messages.viewMore}
        </Text>
      </TouchableWithoutFeedback>
    </Flex>
  ) : null
}
