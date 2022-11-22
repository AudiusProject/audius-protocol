import { View } from 'react-native'

import IconHidden from 'app/assets/images/iconHidden.svg'
import { Divider, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { FormScreen } from '../components'
import { SwitchField } from '../fields'

const messages = {
  title: 'Track Visibility',
  description:
    "Hidden tracks won't show up on your profile. Anyone who has the link will be able to listen.",
  hideTrack: 'Hide Track',
  showGenre: 'Show Genre',
  showMood: 'Show Mood',
  showTags: 'Show Tags',
  showShareButton: 'Show Share Button',
  showPlayCount: 'Show Play Count'
}

const useStyles = makeStyles(({ spacing }) => ({
  content: {
    padding: spacing(6)
  },
  divider: {
    marginTop: spacing(4),
    marginHorizontal: spacing(-6)
  }
}))

export const TrackVisibilityScreen = () => {
  const styles = useStyles()

  return (
    <FormScreen title={messages.title} icon={IconHidden} variant='white'>
      <View style={styles.content}>
        <Text fontSize='large'>{messages.description}</Text>
        <Divider style={styles.divider} />
        <SwitchField name='is_unlisted' label={messages.hideTrack} />
        <Divider style={styles.divider} />
        <SwitchField name='field_visibility.genre' label={messages.showGenre} />
        <SwitchField name='field_visibility.mood' label={messages.showMood} />
        <SwitchField name='field_visibility.tags' label={messages.showTags} />
        <SwitchField
          name='field_visibility.share'
          label={messages.showShareButton}
        />
        <SwitchField
          name='field_visibility.play_count'
          label={messages.showPlayCount}
        />
      </View>
    </FormScreen>
  )
}
