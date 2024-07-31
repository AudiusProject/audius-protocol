import { useCallback } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { visibilityMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import {
  IconCalendarMonth,
  IconVisibilityHidden,
  IconVisibilityPublic,
  RadioGroup
} from '@audius/harmony'
import dayjs from 'dayjs'
import { useField } from 'formik'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  ContextualMenu,
  SelectedValue
} from 'components/data-entry/ContextualMenu'
import { useTrackField } from 'components/edit-track/hooks'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { formatCalendarTime } from 'utils/dateUtils'

import { IS_PRIVATE, IS_SCHEDULED_RELEASE, IS_UNLISTED } from '../types'

import { ScheduledReleaseDateField } from './ScheduledReleaseDateField'
import { mergeReleaseDateValues } from './mergeReleaseDateValues'

const messages = {
  ...visibilityMessages,
  scheduled: (date: string) => `Scheduled for ${formatCalendarTime(date)}`
}

type VisibilityType = 'scheduled' | 'public' | 'hidden'

type VisibilityFieldProps = {
  entityType: 'track' | 'album' | 'playlist'
  isUpload: boolean
}

const visibilitySchema = z
  .object({
    visibilityType: z.enum(['hidden', 'public', 'scheduled']),
    releaseDate: z.string().optional(),
    releaseDateTime: z.string().optional(),
    releaseDateMeridian: z.string().optional()
  })
  .refine(
    (data) => {
      const { visibilityType, releaseDate } = data
      return visibilityType === 'scheduled' ? !!releaseDate : true
    },
    { message: 'Release date required', path: ['releaseDate'] }
  )
  .refine(
    (data) => {
      const {
        visibilityType,
        releaseDate,
        releaseDateTime,
        releaseDateMeridian
      } = data
      if (visibilityType === 'scheduled') {
        const time = mergeReleaseDateValues(
          releaseDate!,
          releaseDateTime!,
          releaseDateMeridian!
        ).toString()
        return dayjs(time).isAfter(dayjs())
      }
      return true
    },
    { message: 'Select a time in the future', path: ['releaseDate'] }
  )

export const VisibilityField = (props: VisibilityFieldProps) => {
  const { entityType, isUpload } = props
  const useEntityField = entityType === 'track' ? useTrackField : useField
  const [
    { value: isHidden },
    { initialValue: initiallyHidden },
    { setValue: setIsUnlisted }
  ] = useEntityField<boolean>(entityType === 'track' ? IS_UNLISTED : IS_PRIVATE)

  const [{ value: isScheduledRelease }, , { setValue: setIsScheduledRelease }] =
    useEntityField<boolean>(IS_SCHEDULED_RELEASE)

  const [{ value: releaseDate }, , { setValue: setReleaseDate }] =
    useEntityField<string>('release_date')

  const visibilityType =
    isScheduledRelease && isHidden
      ? 'scheduled'
      : isHidden
      ? 'hidden'
      : 'public'

  const renderValue = useCallback(() => {
    switch (visibilityType) {
      case 'scheduled':
        return (
          <SelectedValue
            label={messages.scheduled(releaseDate)}
            icon={IconCalendarMonth}
          />
        )
      case 'hidden':
        return (
          <SelectedValue label={messages.hidden} icon={IconVisibilityHidden} />
        )
      case 'public':
        return (
          <SelectedValue label={messages.public} icon={IconVisibilityPublic} />
        )
    }
  }, [visibilityType, releaseDate])

  const scheduledReleaseValues =
    visibilityType === 'scheduled' && releaseDate
      ? {
          releaseDate,
          releaseDateTime: dayjs(releaseDate).format('h:mm'),
          releaseDateMeridian: dayjs(releaseDate).format('A')
        }
      : {}

  const initialValues = {
    visibilityType,
    releaseDateTime: '12:00',
    releaseDateMeridian: 'AM',
    ...scheduledReleaseValues
  }

  return (
    <ContextualMenu
      label={messages.title}
      icon={<IconVisibilityPublic />}
      description={messages.description}
      renderValue={renderValue}
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(visibilitySchema)}
      onSubmit={(values) => {
        const {
          visibilityType,
          releaseDate,
          releaseDateTime,
          releaseDateMeridian
        } = values
        switch (visibilityType) {
          case 'scheduled': {
            setIsScheduledRelease(true)
            setReleaseDate(
              mergeReleaseDateValues(
                releaseDate!,
                releaseDateTime!,
                releaseDateMeridian!
              ).toString()
            )
            setIsUnlisted(true)
            break
          }
          case 'hidden': {
            setIsUnlisted(true)
            setIsScheduledRelease(false)
            setReleaseDate('')
            break
          }
          case 'public': {
            setIsUnlisted(false)
            setIsScheduledRelease(false)
            setReleaseDate('')
            break
          }
        }
      }}
      menuFields={
        <VisibilityMenuFields
          entityType={entityType}
          initiallyPublic={!initiallyHidden && !isUpload}
        />
      }
    />
  )
}

type VisibilityMenuFieldsProps = {
  entityType: 'track' | 'album' | 'playlist'
  initiallyPublic?: boolean
}

const VisibilityMenuFields = (props: VisibilityMenuFieldsProps) => {
  const { isEnabled: isEditableAccessEnabled } = useFeatureFlag(
    FeatureFlags.EDITABLE_ACCESS_ENABLED
  )
  const { isEnabled: isPaidScheduledEnabled } = useFeatureFlag(
    FeatureFlags.PAID_SCHEDULED
  )
  const { initiallyPublic, entityType } = props
  const [field] = useField<VisibilityType>('visibilityType')

  return (
    <RadioGroup {...field}>
      <ModalRadioItem
        value='public'
        label={messages.public}
        description={messages.publicDescription}
      />
      <ModalRadioItem
        value='hidden'
        label={messages.hidden}
        description={messages.hiddenDescription}
        disabled={!isEditableAccessEnabled && initiallyPublic}
        tooltipText={
          !isEditableAccessEnabled && initiallyPublic
            ? messages.hiddenHint(entityType)
            : undefined
        }
      />
      {!initiallyPublic &&
      (entityType === 'track' ||
        (isPaidScheduledEnabled && entityType === 'album')) ? (
        <ModalRadioItem
          value='scheduled'
          label={messages.scheduledRelease}
          description={messages.scheduledReleaseDescription}
          checkedContent={<ScheduledReleaseDateField />}
        />
      ) : null}
    </RadioGroup>
  )
}
