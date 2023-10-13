import type { ReactNode } from 'react'

import { View } from 'react-native'

import { Text } from 'app/components/core'

import { useStyles } from './styles'
const messages = {
  task: 'Task'
}

export const ChallengeDescription = ({
  taskIcon,
  task = messages.task,
  description
}: {
  taskIcon?: ReactNode
  task?: ReactNode
  description: ReactNode
}) => {
  const styles = useStyles()
  return (
    <View style={styles.task}>
      <View style={styles.taskHeader}>
        {taskIcon}
        <Text style={styles.subheader} weight='heavy'>
          {task}
        </Text>
      </View>
      <Text weight='bold' style={styles.taskText}>
        {description}
      </Text>
    </View>
  )
}
