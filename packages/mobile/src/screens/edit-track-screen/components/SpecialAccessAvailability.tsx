import { useCallback, useEffect, useState } from 'react'

import { isContentFollowGated, isContentTipGated } from '@audius/common/models'
import type { AccessConditions } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { useField } from 'formik'
import { Dimensions, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useSelector, useDispatch } from 'react-redux'

import IconInfo from 'app/assets/images/iconInfo.svg'
import IconSpecialAccess from 'app/assets/images/iconSpecialAccess.svg'
import { RadioButton, Text } from 'app/components/core'
import { useSetTrackAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'
import { setVisibility } from 'app/store/drawers/slice'
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
    fontSize: 18,
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
    marginTop: spacing(4),
    marginLeft: -1 * spacing(10)
  },
  subtitle: {
    color: palette.neutral
  },
  selectionContainer: {
    marginLeft: spacing(-10),
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
  },
  infoIcon: {
    marginLeft: spacing(2),
    width: spacing(4),
    height: spacing(4)
  }
}))

const { getUserId } = accountSelectors

export const SpecialAccessAvailability = ({
  selected,
  disabled = false,
  disabledContent = false,
  previousStreamConditions
}: TrackAvailabilitySelectionProps) => {
  const styles = useStyles()
  const secondary = useColor('secondary')
  const neutral = useColor('neutral')
  const neutralLight4 = useColor('neutralLight4')
  const dispatch = useDispatch()

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
  const [{ value: streamConditions }] =
    useField<Nullable<AccessConditions>>('stream_conditions')
  const currentUserId = useSelector(getUserId)
  const defaultSpecialAccess = currentUserId
    ? { follow_user_id: currentUserId }
    : null
  const [selectedSpecialAccessGate, setSelectedSpecialAccessGate] = useState(
    isContentFollowGated(previousStreamConditions) ||
      isContentTipGated(previousStreamConditions)
      ? previousStreamConditions ?? defaultSpecialAccess
      : defaultSpecialAccess
  )

  const isContentDisabled = disabled || disabledContent

  // Update special access gate when selection changes
  useEffect(() => {
    if (selected && selectedSpecialAccessGate) {
      setTrackAvailabilityFields(
        {
          is_stream_gated: true,
          stream_conditions: selectedSpecialAccessGate,
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

  const handleInfoPress = useCallback(() => {
    dispatch(setVisibility({ drawer: 'SupportersInfo', visible: true }))
  }, [dispatch])

  return (
    <View style={styles.root}>
      <View style={styles.titleContainer}>
        <IconSpecialAccess style={styles.titleIcon} fill={titleIconColor} />
        <Text weight='bold' style={titleStyles}>
          {messages.specialAccess}
        </Text>
      </View>
      {selected && (
        <>
          <View style={styles.subtitleContainer}>
            <Text fontSize='medium' weight='medium' style={styles.subtitle}>
              {messages.specialAccessSubtitle}
            </Text>
          </View>
          <View style={styles.selectionContainer}>
            <TouchableOpacity
              onPress={handlePressFollowers}
              disabled={
                isContentDisabled || isContentFollowGated(streamConditions)
              }
            >
              <View style={styles.followersOnly}>
                <RadioButton
                  checked={isContentFollowGated(streamConditions)}
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
              disabled={
                isContentDisabled || isContentTipGated(streamConditions)
              }
            >
              <View style={styles.supportersOnly}>
                <RadioButton
                  checked={isContentTipGated(streamConditions)}
                  disabled={isContentDisabled}
                  style={styles.radio}
                />
                <Text style={isContentDisabled ? styles.disabledTitle : null}>
                  {messages.supportersOnly}
                </Text>
                <TouchableOpacity onPress={handleInfoPress}>
                  <IconInfo style={styles.infoIcon} fill={neutralLight4} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}
