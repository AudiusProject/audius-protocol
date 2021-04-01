import React, { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import {
  Achievement,
  Milestone as MilestoneNotification
} from '../../../store/notifications/types'
import { formatCount } from '../../../utils/format'
import { useTheme } from '../../../utils/theme'
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
  onGoToRoute: (route: string) => void
}

const Milestone = ({ notification, onGoToRoute }: MilestoneProps) => {
  let body: ReactNode
  if (notification.achievement === Achievement.Followers) {
    body = (
      <Text>
        {`You have reached over ${formatCount(notification.value)} ${
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
        <Entity
          entity={entity}
          entityType={entityType}
          onGoToRoute={onGoToRoute}
        />
        <Text>
          {` has reached over ${formatCount(
            notification.value
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
