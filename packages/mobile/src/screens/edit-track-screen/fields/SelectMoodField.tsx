import { useCallback } from 'react'

import { View, Image } from 'react-native'

import type { ContextualMenuProps } from 'app/components/core'
import { SelectedValue, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { moodMap } from 'app/utils/moods'

import { ContextualMenuField } from './ContextualMenuField'

const messages = {
  mood: 'Mood'
}

type SelectMoodFieldProps = Partial<ContextualMenuProps>

const useStyles = makeStyles(({ spacing }) => ({
  value: {
    alignItems: 'flex-start',
    marginTop: spacing(4)
  },
  emoji: {
    height: spacing(4),
    width: spacing(4),
    marginRight: spacing(2)
  },
  text: {
    textTransform: 'uppercase'
  }
}))

export const SelectMoodField = (props: SelectMoodFieldProps) => {
  const styles = useStyles()

  const renderValue = useCallback(
    (value: string) => {
      return (
        <View style={styles.value}>
          <SelectedValue>
            <Image source={moodMap[value]} style={styles.emoji} />
            <Text fontSize='small' weight='demiBold' style={styles.text}>
              {value}
            </Text>
          </SelectedValue>
        </View>
      )
    },
    [styles]
  )

  return (
    <ContextualMenuField
      name='mood'
      menuScreenName='SelectMood'
      label={messages.mood}
      renderValue={renderValue}
      {...props}
    />
  )
}
