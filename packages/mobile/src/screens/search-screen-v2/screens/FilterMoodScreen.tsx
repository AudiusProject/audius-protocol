import { useCallback, useState } from 'react'

import type { Mood } from '@audius/sdk'
import { View, Image } from 'react-native'

import { IconMood, Text } from '@audius/harmony-native'
import { ListSelectionScreen } from 'app/screens/list-selection-screen'
import { makeStyles } from 'app/styles'
import { moodMap } from 'app/utils/moods'

import { useSearchFilter } from '../searchState'

const messages = {
  screenTitle: 'Mood',
  searchText: 'Select Mood'
}

const moods = Object.keys(moodMap).map((mood) => ({
  value: mood,
  label: mood
}))

moods.sort((mood1, mood2) => mood1.label.localeCompare(mood2.label))

const useStyles = makeStyles(({ spacing }) => ({
  item: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  emoji: {
    height: spacing(4),
    width: spacing(4),
    marginRight: spacing(2)
  }
}))

export const FilterMoodScreen = () => {
  const styles = useStyles()
  const [, setMood, clearMood] = useSearchFilter('mood')
  const [value, setValue] = useState('')

  const handleSubmit = useCallback(() => {
    if (value) {
      setMood(value as Mood)
    } else {
      clearMood()
    }
  }, [clearMood, setMood, value])

  const handleClear = useCallback(() => {
    setValue('')
  }, [])

  return (
    <ListSelectionScreen
      data={moods}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Image source={moodMap[item.label]} style={styles.emoji} />
          <Text>{item.label}</Text>
        </View>
      )}
      screenTitle={messages.screenTitle}
      icon={IconMood}
      searchText={messages.searchText}
      value={value}
      onChange={setValue}
      onClear={handleClear}
      onSubmit={handleSubmit}
      clearable={Boolean(value)}
    />
  )
}
