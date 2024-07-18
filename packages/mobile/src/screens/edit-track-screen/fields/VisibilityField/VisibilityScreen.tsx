import { useCallback, useEffect, useState } from 'react'

import { visibilityMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import { getLocalTimezone } from '@audius/common/utils'
import dayjs from 'dayjs'
import { useFormikContext } from 'formik'
import { formatCalendarTime } from 'utils/dateUtils'

import {
  Flex,
  Hint,
  IconCalendarMonth,
  IconVisibilityHidden,
  IconVisibilityPublic
} from '@audius/harmony-native'
import { DateTimeInput } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { FormScreen } from 'app/screens/form-screen'

import { ExpandableRadio } from '../../components/ExpandableRadio'
import { ExpandableRadioGroup } from '../../components/ExpandableRadioGroup'
import type { FormValues } from '../../types'

type VisibilityType = 'scheduled' | 'public' | 'hidden'

const messages = {
  ...visibilityMessages,
  scheduled: (date: string) => `Scheduled for ${formatCalendarTime(date)}`
}

export const VisibilityScreen = () => {
  const { isEnabled: isEditableAccessEnabled } = useFeatureFlag(
    FeatureFlags.EDITABLE_ACCESS_ENABLED
  )
  const { values, initialValues, setValues } = useFormikContext<FormValues>()
  const { is_unlisted, is_scheduled_release, release_date, isUpload } = values
  const isAlreadyPublic = !isUpload && !initialValues.is_unlisted

  const initialVisibilityType =
    is_scheduled_release && release_date
      ? 'scheduled'
      : is_unlisted
      ? 'hidden'
      : 'public'

  const [visibilityType, setVisibilityType] = useState<VisibilityType>(
    initialVisibilityType
  )
  const [releaseDate, setReleaseDate] = useState(release_date)
  const [dateError, setDateError] = useState('')
  const [dateTimeError, setDateTimeError] = useState('')
  const navigation = useNavigation()

  useEffect(() => {
    if (releaseDate) {
      setDateError('')
      setDateTimeError('')
    }
  }, [releaseDate])

  const handleSubmit = useCallback(() => {
    switch (visibilityType) {
      case 'public':
        setValues({
          ...values,
          is_unlisted: false,
          is_scheduled_release: false,
          release_date: null
        })
        break
      case 'hidden':
        setValues({
          ...values,
          is_unlisted: true,
          is_scheduled_release: false
        })
        break
      case 'scheduled':
        if (!releaseDate) {
          setDateError('Release date required')
          return
        } else if (dayjs(releaseDate).isBefore(dayjs())) {
          setDateTimeError('Release date must be in the future')
          return
        } else {
          setValues({
            ...values,
            is_unlisted: true,
            is_scheduled_release: true,
            release_date: releaseDate
          })
        }
        break
    }
    navigation.goBack()
  }, [visibilityType, releaseDate, navigation, values, setValues])

  return (
    <FormScreen
      title={messages.title}
      icon={IconVisibilityPublic}
      onSubmit={handleSubmit}
      variant='white'
      stopNavigation
    >
      <ExpandableRadioGroup
        value={visibilityType}
        onValueChange={setVisibilityType}
      >
        <ExpandableRadio
          value='public'
          label={messages.public}
          description={messages.publicDescription}
        />
        <ExpandableRadio
          value='hidden'
          label={messages.hidden}
          icon={IconVisibilityHidden}
          description={messages.hiddenDescription}
          disabled={!isEditableAccessEnabled && isAlreadyPublic}
        />
        <ExpandableRadio
          value='scheduled'
          label={messages.scheduledRelease}
          description={messages.scheduledReleaseDescription}
          disabled={!isEditableAccessEnabled && isAlreadyPublic}
          checkedContent={
            <Flex direction='column' gap='l'>
              <Flex gap='l'>
                <Flex gap='l'>
                  <DateTimeInput
                    mode='date'
                    date={releaseDate ?? undefined}
                    onChange={setReleaseDate}
                    inputProps={{
                      label: messages.dateLabel,
                      startIcon: IconCalendarMonth,
                      error: !!(dateError || dateTimeError),
                      helperText: dateError
                    }}
                    dateTimeProps={{
                      minimumDate: dayjs().toDate()
                    }}
                  />
                  <DateTimeInput
                    mode='time'
                    date={releaseDate ?? undefined}
                    onChange={setReleaseDate}
                    inputProps={{
                      label: messages.timeLabel,
                      error: !!dateTimeError,
                      helperText: dateTimeError
                    }}
                  />
                </Flex>
              </Flex>
              {releaseDate ? (
                <Hint>{messages.futureReleaseHint(getLocalTimezone())}</Hint>
              ) : null}
            </Flex>
          }
        />
      </ExpandableRadioGroup>
    </FormScreen>
  )
}
