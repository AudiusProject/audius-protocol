import { useEffect } from 'react'

import { Dimensions, View } from 'react-native'

import IconVisibilityPublic from 'app/assets/images/iconVisibilityPublic.svg'
import { Text } from 'app/components/core'
import { useSetTrackAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

import type { TrackAvailabilitySelectionProps } from '../../components/types'

const messages = {
  public: 'Public (Default)',
  publicSubtitle:
    'Public tracks are visible to all users and appear throughout Audius.'
}

const screenWidth = Dimensions.get('screen').width

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    width: screenWidth - spacing(22)
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    marginTop: 0
  },
  selectedTitle: {
    color: palette.secondary
  },
  disabledTitle: {
    color: palette.neutralLight4
  },
  titleIcon: {
    marginTop: 0,
    marginRight: spacing(2.5)
  },
  subtitleContainer: {
    marginTop: spacing(2)
  },
  subtitle: {
    color: palette.neutral
  }
}))

export const PublicAvailabilityRadioField = (
  props: TrackAvailabilitySelectionProps
) => {
  const { selected, disabled = false } = props
  const styles = useStyles()
  const secondary = useColor('secondary')
  const neutral = useColor('neutral')
  const neutralLight4 = useColor('neutralLight4')

  const titleStyles: object[] = [styles.title]
  if (selected) {
    titleStyles.push(styles.selectedTitle)
  } else if (disabled) {
    titleStyles.push(styles.disabledTitle)
  }

  const titleIconColor = selected
    ? secondary
    : disabled
    ? neutralLight4
    : neutral

  const { reset: resetTrackAvailabilityFields } =
    useSetTrackAvailabilityFields()
  useEffect(() => {
    if (selected) {
      resetTrackAvailabilityFields()
    }
  }, [selected, resetTrackAvailabilityFields])

  return (
    <View style={styles.root}>
      <View style={styles.titleContainer}>
        <IconVisibilityPublic style={styles.titleIcon} fill={titleIconColor} />
        <Text weight='bold' style={titleStyles}>
          {messages.public}
        </Text>
      </View>
      <View style={styles.subtitleContainer}>
        <Text fontSize='medium' weight='medium' style={styles.subtitle}>
          {messages.publicSubtitle}
        </Text>
      </View>
    </View>
  )
}
