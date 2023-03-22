import { useCallback, useEffect, useState } from 'react'

import type { PremiumConditions, Nullable } from '@audius/common'
import { accountSelectors } from '@audius/common'
import { useField } from 'formik'
import { Dimensions, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'

import IconSpecialAccess from 'app/assets/images/iconSpecialAccess.svg'
import { RadioButton, Text } from 'app/components/core'
import { useSetTrackAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

import type { TrackAvailabilitySelectionProps } from './types'

const messages = {
  specialAccess: 'Special Access',
  specialAccessSubtitle:
    'Special Access tracks are only available to users who meet certain criteria, such as following the artist.',
  followersOnly: 'Available to Followers Only',
  supportersOnly: 'Available to Supporters Only'
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
  },
  selection: {
    marginTop: spacing(2),
    padding: spacing(4),
    backgroundColor: palette.neutralLight10,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: spacing(2)
  },
  radio: {
    marginRight: spacing(2)
  },
  followersOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(2.5)
  },
  supportersOnly: {
    flexDirection: 'row',
    alignItems: 'center'
  }
}))

const { getUserId } = accountSelectors

export const SpecialAccessAvailability = ({
  selected,
  disabled = false,
  disabledContent = false,
  previousPremiumConditions
}: TrackAvailabilitySelectionProps) => {
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

  const { set: setTrackAvailabilityFields } = useSetTrackAvailabilityFields()
  const [{ value: premiumConditions }] =
    useField<Nullable<PremiumConditions>>('premium_conditions')
  const currentUserId = useSelector(getUserId)
  const defaultSpecialAccess = currentUserId
    ? { follow_user_id: currentUserId }
    : null
  const [selectedSpecialAccessGate, setSelectedSpecialAccessGate] = useState(
    !('nft_collection' in (previousPremiumConditions ?? {}))
      ? previousPremiumConditions ?? defaultSpecialAccess
      : defaultSpecialAccess
  )

  const isContentDisabled = disabled || disabledContent

  // Update special access gate when selection changes
  useEffect(() => {
    if (selected && selectedSpecialAccessGate) {
      setTrackAvailabilityFields(
        {
          is_premium: true,
          premium_conditions: selectedSpecialAccessGate,
          'field_visibility.remixes': false
        },
        true
      )
    }
  }, [selected, selectedSpecialAccessGate, setTrackAvailabilityFields])

  const handlePressFollowers = useCallback(() => {
    if (currentUserId) {
      setSelectedSpecialAccessGate({ follow_user_id: currentUserId })
    }
  }, [currentUserId])

  const handlePressSupporters = useCallback(() => {
    if (currentUserId) {
      setSelectedSpecialAccessGate({ tip_user_id: currentUserId })
    }
  }, [currentUserId])

  return (
    <View style={styles.root}>
      <View style={styles.titleContainer}>
        <IconSpecialAccess style={styles.titleIcon} fill={titleIconColor} />
        <Text weight='bold' style={titleStyles}>
          {messages.specialAccess}
        </Text>
      </View>
      <View style={styles.subtitleContainer}>
        <Text fontSize='medium' weight='medium' style={styles.subtitle}>
          {messages.specialAccessSubtitle}
        </Text>
      </View>
      {selected && (
        <View style={styles.selection}>
          <TouchableOpacity
            onPress={handlePressFollowers}
            disabled={isContentDisabled || !!premiumConditions?.follow_user_id}
          >
            <View style={styles.followersOnly}>
              <RadioButton
                checked={!!premiumConditions?.follow_user_id}
                disabled={isContentDisabled}
                style={styles.radio}
              />
              <Text style={isContentDisabled ? styles.disabledTitle : null}>
                {messages.followersOnly}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePressSupporters}
            disabled={isContentDisabled || !!premiumConditions?.tip_user_id}
          >
            <View style={styles.supportersOnly}>
              <RadioButton
                checked={!!premiumConditions?.tip_user_id}
                disabled={isContentDisabled}
                style={styles.radio}
              />
              <Text style={isContentDisabled ? styles.disabledTitle : null}>
                {messages.supportersOnly}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
