import { useField } from 'formik'
import { View, Image } from 'react-native'

import { IconMood } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { moodMap } from 'app/utils/moods'

import { ListSelectionScreen } from './ListSelectionScreen'

const messages = {
  screenTitle: 'Select Mood',
  searchText: 'Search Moods'
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

export const SelectMoodScreen = () => {
  const styles = useStyles()
  const [{ value }, , { setValue }] = useField('mood')

  return (
    <ListSelectionScreen
      data={moods}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Image source={moodMap[item.label]} style={styles.emoji} />
          <Text fontSize='large' weight='demiBold'>
            {item.label}
          </Text>
        </View>
      )}
      screenTitle={messages.screenTitle}
      icon={IconMood}
      searchText={messages.searchText}
      value={value}
      onChange={setValue}
    />
  )
}
