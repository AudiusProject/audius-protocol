import { useField } from 'formik'
import { View } from 'react-native'

import type { ContextualSubmenuProps } from 'app/components/core'
import { Pill, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { ContextualSubmenuField } from './ContextualSubmenuField'

const messages = {
  label: 'Track Visibility',
  public: 'Public',
  hidden: 'Hidden',
  showGenre: 'Show Genre',
  showMood: 'Show Mood',
  showTags: 'Show Tags',
  showShareButton: 'Show Share Button',
  showPlayCount: 'Show Play Count'
}

const fieldVisibilityLabelMap = {
  genre: messages.showGenre,
  mood: messages.showMood,
  tags: messages.showTags,
  share: messages.showShareButton,
  play_count: messages.showPlayCount
}

const fieldVisibilityKeys = Object.keys(fieldVisibilityLabelMap)

const useStyles = makeStyles(({ spacing }) => ({
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing(2)
  },
  pill: {
    marginTop: spacing(2),
    marginRight: spacing(2)
  },
  pillText: {
    marginTop: spacing(1),
    textTransform: 'uppercase'
  }
}))

type TrackVisibilityFieldProps = Partial<ContextualSubmenuProps>

export const TrackVisibilityField = (props: TrackVisibilityFieldProps) => {
  const [{ value: isUnlisted }] = useField('is_unlisted')
  const [{ value: fieldVisibility }] = useField('field_visibility')
  const styles = useStyles()

  const renderValue = () => {
    const trackVisibilityLabel = isUnlisted ? messages.hidden : messages.public
    const fieldVisibilityLabels = fieldVisibilityKeys
      .filter((visibilityKey) => fieldVisibility[visibilityKey])
      .map((visibilityKey) => fieldVisibilityLabelMap[visibilityKey])

    const labels = [trackVisibilityLabel, ...fieldVisibilityLabels]
    return (
      <View style={styles.pills}>
        {labels.map((label) => (
          <Pill key={label} style={styles.pill}>
            <Text fontSize='small' weight='demiBold' style={styles.pillText}>
              {label}
            </Text>
          </Pill>
        ))}
      </View>
    )
  }

  return (
    <ContextualSubmenuField
      label={messages.label}
      name='field_visibility'
      submenuScreenName='TrackVisibility'
      renderValue={renderValue}
      {...props}
    />
  )
}
