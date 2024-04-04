import { useEffect } from 'react'

import type { ID } from '@audius/common/models'
import { aiPageActions, aiPageSelectors } from '@audius/common/store'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import {
  IconArrowRight,
  IconRobot,
  PlainButton,
  Text,
  Flex,
  TextLink
} from '@audius/harmony-native'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

const { fetchAiUser, reset } = aiPageActions
const { getAiUser } = aiPageSelectors

const messages = {
  title: 'Generated with AI',
  description: 'This song was made by an AI that has been trained to imitate ',
  viewMore: 'View More'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    gap: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight7,
    paddingBottom: spacing(4),
    marginBottom: spacing(4)
  },
  badges: {
    paddingTop: spacing(4)
  }
}))

export const DetailsTileAiAttribution = ({ userId }: { userId: ID }) => {
  const styles = useStyles()
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
      <Flex inline direction='row' alignItems='center' gap='s'>
        <IconRobot color='default' />
        {/* IconRobot is bottom-heavy, adding marginTop makes text look more aligned */}
        <Text variant='label' style={{ marginTop: 2 }}>
          {messages.title}
        </Text>
      </Flex>
      <Text variant='body' size='s'>
        {messages.description}
        <TextLink
          variant='visible'
          to={{ screen: 'Profile', params: { id: user.user_id } }}
        >
          {user.name}
        </TextLink>
        <UserBadges user={user} hideName style={styles.badges} badgeSize={12} />
      </Text>
      <PlainButton
        style={{ alignSelf: 'flex-start' }}
        variant='subdued'
        iconRight={IconArrowRight}
        onPress={handleViewMorePress}
      >
        {messages.viewMore}
      </PlainButton>
    </View>
  ) : null
}
