import { ReactNode } from 'react'

import {
  Achievement,
  Milestone as MilestoneNotification
} from 'audius-client/src/common/store/notifications/types'
import { StyleSheet, Text, View } from 'react-native'

import { formatCount } from 'app/utils/format'
import { useTheme } from 'app/utils/theme'

import Entity from './Entity'
import TwitterShare from './TwitterShare'

const styles = StyleSheet.create({
  textWrapper: {
    fontFamily: 'AvenirNextLTPro-Medium',
    fontSize: 16,
    marginBottom: 8
  }
})

type MilestoneProps = {
  notification: MilestoneNotification
}

const Milestone = ({ notification }: MilestoneProps) => {
  let body: ReactNode
  if (notification.achievement === Achievement.Followers) {
    body = (
      <Text>
        {`You have reached over ${formatCount(notification.value ?? 0)} ${
          notification.achievement
        }`}
      </Text>
    )
  } else {
    const entity = notification.entity
    const entityType = notification.entityType
    const achievementText =
      notification.achievement === Achievement.Listens
        ? 'Plays'
        : notification.achievement
    body = (
      <>
        <Text>{`Your ${notification.entityType.toLowerCase()} `}</Text>
        <Entity entity={entity} entityType={entityType} />
        <Text>
          {` has reached over ${formatCount(
            notification.value ?? 0
          )} ${achievementText}`}
        </Text>
      </>
    )
  }

  const textWrapperStyle = useTheme(styles.textWrapper, {
    color: 'neutral'
  })

  return (
    <View>
      <Text style={textWrapperStyle}>{body}</Text>
      <TwitterShare notification={notification} />
    </View>
  )
}

export default Milestone
