import { useCallback, useEffect, useState } from 'react'

import { visibilityMessages as messages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import dayjs from 'dayjs'
import { useFormikContext } from 'formik'

import {
  IconVisibilityHidden,
  IconVisibilityPublic
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { FormScreen } from 'app/screens/form-screen'

import { ExpandableRadio } from '../../components/ExpandableRadio'
import { ExpandableRadioGroup } from '../../components/ExpandableRadioGroup'
import type { FormValues } from '../../types'

import { ScheduledReleaseDateField } from './ScheduledReleaseDateField'

type VisibilityType = 'scheduled' | 'public' | 'hidden'

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
        {!isAlreadyPublic ? (
          <ExpandableRadio
            value='scheduled'
            label={messages.scheduledRelease}
            description={messages.scheduledReleaseDescription}
            checkedContent={
              <ScheduledReleaseDateField
                releaseDate={releaseDate}
                onChange={setReleaseDate}
                dateError={dateError}
                dateTimeError={dateTimeError}
              />
            }
          />
        ) : null}
      </ExpandableRadioGroup>
    </FormScreen>
  )
}
