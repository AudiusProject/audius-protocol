import { useCallback, useContext, useEffect, useState } from 'react'

import { priceAndAudienceMessages } from '@audius/common/messages'
import {
  isContentFollowGated,
  isContentTipGated,
  StreamTrackAvailabilityType
} from '@audius/common/models'
import type { AccessConditions } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import type { Nullable } from '@audius/common/utils'
import { useSelector, useDispatch } from 'react-redux'

import {
  Flex,
  IconButton,
  IconInfo,
  IconSpecialAccess,
  Paper,
  Radio,
  RadioGroup,
  RadioGroupContext
} from '@audius/harmony-native'
import { useSetEntityAvailabilityFields } from 'app/hooks/useSetTrackAvailabilityFields'
import { setVisibility } from 'app/store/drawers/slice'

import { ExpandableRadio } from '../ExpandableRadio'

const { specialAccessRadio: messages } = priceAndAudienceMessages

type SpecialAccessValue = 'followers' | 'supporters'

const { getUserId } = accountSelectors

type SpecialAccessRadioFieldProps = {
  disabled?: boolean
  previousStreamConditions: Nullable<AccessConditions>
}

export const SpecialAccessRadioField = (
  props: SpecialAccessRadioFieldProps
) => {
  const { disabled = false, previousStreamConditions } = props
  const dispatch = useDispatch()

  const { value } = useContext(RadioGroupContext)
  const selected = value === StreamTrackAvailabilityType.SPECIAL_ACCESS

  const setFields = useSetEntityAvailabilityFields()
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

  // Update special access gate when selection changes
  useEffect(() => {
    if (selected && selectedSpecialAccessGate) {
      setFields({
        is_stream_gated: true,
        stream_conditions: selectedSpecialAccessGate,
        preview_start_seconds: null,
        'field_visibility.remixes': false
      })
    }
  }, [selected, selectedSpecialAccessGate, setFields])

  const handleInfoPress = useCallback(() => {
    dispatch(setVisibility({ drawer: 'SupportersInfo', visible: true }))
  }, [dispatch])

  const [specialAccess, setSpecialAccess] = useState<SpecialAccessValue>(
    isContentTipGated(selectedSpecialAccessGate) ? 'supporters' : 'followers'
  )

  const handleAccessChange = useCallback(
    (value: SpecialAccessValue) => {
      if (!currentUserId || !selected) return
      setSpecialAccess(value)
      setSelectedSpecialAccessGate(
        value === 'followers'
          ? { follow_user_id: currentUserId }
          : { tip_user_id: currentUserId }
      )
    },
    [currentUserId, selected]
  )

  return (
    <ExpandableRadio
      value={StreamTrackAvailabilityType.SPECIAL_ACCESS}
      label={messages.title}
      icon={IconSpecialAccess}
      description={messages.description}
      disabled={disabled}
      checkedContent={
        <Paper backgroundColor='surface1' shadow='flat' border='default' p='l'>
          <RadioGroup
            gap='s'
            value={specialAccess}
            onValueChange={handleAccessChange}
          >
            <Radio
              value='followers'
              label={messages.followersOnly}
              disabled={disabled}
            />
            <Flex direction='row' alignItems='center'>
              <Radio
                value='supporters'
                label={messages.supportersOnly}
                disabled={disabled}
              />
              <IconButton
                icon={IconInfo}
                size='s'
                color='subdued'
                onPress={handleInfoPress}
              />
            </Flex>
          </RadioGroup>
        </Paper>
      }
    />
  )
}
