import { useCallback, useEffect, useMemo, useState } from 'react'

import { FieldVisibility } from '@audius/common/models'
import { getLocalTimezone } from '@audius/common/utils'
import {
  ModalContent,
  IconInfo,
  Flex,
  IconCalendarMonth,
  RadioGroup,
  Text,
  Hint,
  IconVisibilityHidden,
  IconVisibilityPublic
} from '@audius/harmony'
import cn from 'classnames'
import { useField } from 'formik'
import { get } from 'lodash'
import moment from 'moment'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  ContextualMenu,
  SelectedValue
} from 'components/data-entry/ContextualMenu'
import { DropdownField } from 'components/form-fields'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import layoutStyles from 'components/layout/layout.module.css'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { defaultFieldVisibility } from 'pages/track-page/utils'
import { formatCalendarTime } from 'utils/dateUtils'

import { useTrackField } from '../hooks'
import { SingleTrackEditValues } from '../types'

import { DatePickerField } from './DatePickerField'
import styles from './VisibilityField.module.css'
import { HiddenAvailabilityFields } from './stream-availability/HiddenAvailabilityFields'
import { FIELD_VISIBILITY, IS_PRIVATE, IS_UNLISTED } from './types'

const messages = {
  title: 'Visibility',
  description:
    'Set your music’s visibility: Public, Hidden or scheduled for a day in the future.',
  releaseDate: 'Select a date and time for your music to become public.',
  pastReleaseHint:
    'Setting a release date in the past will impact the order tracks appear on your profile.',
  futureReleaseHint: (timezone: string) =>
    `Your scheduled track will become live on Audius on the date and time you've chosen above in your time zone (${timezone}).`,
  fieldVisibility: {
    genre: 'Show Genre',
    mood: 'Show Mood',
    tags: 'Show Tags',
    share: 'Show Share Button',
    play_count: 'Show Play Count',
    remixes: 'Show Remixes'
  },
  hidden: 'Hidden',
  hiddenSubtitleTracks:
    "Hidden tracks won't be visible to your followers. Only you will see them on your profile. Anyone who has the link will be able to listen.",
  hiddenSubtitleAlbums:
    'Hidden albums remain invisible to your followers, visible only to you on your profile. They can be shared and listened to via direct link.',
  hiddenHint: 'Scheduled tracks are hidden by default until release.'
}

export const RELEASE_DATE = 'release_date'
export const RELEASE_DATE_HOUR = 'release_date_hour'
export const RELEASE_DATE_MERIDIAN = 'release_date_meridian'
export const RELEASE_DATE_TYPE = 'release_date_type'
export const IS_SCHEDULED_RELEASE = 'is_scheduled_release'

export type VisibilityFormValues = {
  [RELEASE_DATE]: string
  [RELEASE_DATE_HOUR]: string
  [RELEASE_DATE_MERIDIAN]: string
  [RELEASE_DATE_TYPE]: string
  [FIELD_VISIBILITY]: FieldVisibility
}

export enum VisibilityType {
  PUBLIC = 'PUBLIC',
  HIDDEN = 'HIDDEN',
  SCHEDULED_RELEASE = 'SCHEDULED_RELEASE'
}

export enum TimePeriodType {
  PAST = 'PAST',
  PRESENT = 'PRESENT',
  FUTURE = 'FUTURE'
}

export enum ReleaseDateMeridian {
  AM = 'AM',
  PM = 'PM'
}

type ReleaseDateRadioProps = {
  isInitiallyUnlisted: boolean
  initialReleaseDate: string | null
  isAlbum?: boolean
}

export const timeValidationSchema = z.object({
  release_date_hour: z
    .string()
    .refine((value) => /^([0-9]|0[1-9]|1[0-2]):([0-5][0-9])$/.test(value), {
      message: 'Invalid time.'
    })
})

type ReleaseDateValue = SingleTrackEditValues[typeof RELEASE_DATE]
type IsScheduledReleaseValue =
  SingleTrackEditValues[typeof IS_SCHEDULED_RELEASE]
type IsUnlistedValue = SingleTrackEditValues[typeof IS_UNLISTED]

type VisibilityFieldProps = {
  isAlbum: boolean
}

export const VisibilityField = (props: VisibilityFieldProps) => {
  const { isAlbum = false } = props
  const [{ value: trackReleaseDate }, , { setValue: setTrackReleaseDate }] =
    useTrackField<ReleaseDateValue>(RELEASE_DATE)
  const [, , { setValue: setIsScheduledRelease }] =
    useTrackField<IsScheduledReleaseValue>(IS_SCHEDULED_RELEASE)
  const isHiddenFieldName = isAlbum ? IS_PRIVATE : IS_UNLISTED
  const [{ value: isUnlisted }, , { setValue: setIsUnlisted }] =
    useTrackField<IsUnlistedValue>(isHiddenFieldName)
  const [{ value: fieldVisibility }, , { setValue: setFieldVisibilityValue }] =
    useTrackField<SingleTrackEditValues[typeof FIELD_VISIBILITY]>(
      FIELD_VISIBILITY
    )

  const initialValues = useMemo(() => {
    return {
      [RELEASE_DATE]: trackReleaseDate ?? moment().toString(),
      [RELEASE_DATE_HOUR]: trackReleaseDate
        ? moment(trackReleaseDate).format('h:mm')
        : moment().format('h:mm'),
      [RELEASE_DATE_MERIDIAN]: trackReleaseDate
        ? moment(trackReleaseDate).format('A')
        : moment().format('A'),
      [RELEASE_DATE_TYPE]:
        isUnlisted && !trackReleaseDate
          ? VisibilityType.HIDDEN
          : trackReleaseDate
          ? VisibilityType.SCHEDULED_RELEASE
          : VisibilityType.PUBLIC,
      [FIELD_VISIBILITY]: fieldVisibility ?? defaultFieldVisibility
    }
  }, [fieldVisibility, isUnlisted, trackReleaseDate])

  const onSubmit = useCallback(
    (values: VisibilityFormValues) => {
      const fieldVisibility = get(values, FIELD_VISIBILITY)
      setFieldVisibilityValue({
        ...fieldVisibility,
        remixes: fieldVisibility?.remixes ?? defaultFieldVisibility.remixes
      })

      switch (values[RELEASE_DATE_TYPE]) {
        case VisibilityType.PUBLIC: {
          setTrackReleaseDate(null)
          setIsScheduledRelease(false)
          setIsUnlisted(false)
          setFieldVisibilityValue(defaultFieldVisibility)
          return
        }
        case VisibilityType.HIDDEN: {
          setTrackReleaseDate(null)
          setIsScheduledRelease(false)
          setIsUnlisted(true)
          return
        }
        case VisibilityType.SCHEDULED_RELEASE: {
          const mergedReleaseDate = mergeDateTimeValues(
            values[RELEASE_DATE],
            values[RELEASE_DATE_HOUR],
            values[RELEASE_DATE_MERIDIAN]
          )
          if (mergedReleaseDate.isAfter(moment())) {
            // set is scheduled release
            setIsScheduledRelease(true)
            setIsUnlisted(true)
          } else {
            setIsScheduledRelease(false)
          }
          setTrackReleaseDate(mergedReleaseDate.toString())
          break
        }
      }
    },
    [
      setFieldVisibilityValue,
      setTrackReleaseDate,
      setIsScheduledRelease,
      setIsUnlisted
    ]
  )

  const renderValue = useCallback(() => {
    // Public
    if (!isUnlisted && !trackReleaseDate) {
      return <SelectedValue label='Public' icon={IconVisibilityPublic} />
    }
    // Hidden
    if (isUnlisted && !trackReleaseDate) {
      const fieldVisibilityKeys = Object.keys(
        messages.fieldVisibility
      ) as Array<keyof FieldVisibility>
      const fieldVisibilityLabels =
        fieldVisibility && !isAlbum
          ? fieldVisibilityKeys
              .filter((visibilityKey) => fieldVisibility[visibilityKey])
              .map((visibilityKey) => messages.fieldVisibility[visibilityKey])
          : []
      const selectedValues = [
        { label: messages.hidden, icon: IconVisibilityHidden },
        ...fieldVisibilityLabels
      ]
      return (
        <Flex direction='row' gap='s'>
          {selectedValues.map((value) => {
            const valueProps =
              typeof value === 'string' ? { label: value } : value
            return <SelectedValue key={valueProps.label} {...valueProps} />
          })}
        </Flex>
      )
    }
    // Scheduled
    return (
      <SelectedValue
        label={formatCalendarTime(trackReleaseDate, 'Scheduled for ')}
        icon={IconCalendarMonth}
      >
        <input
          className={styles.input}
          name={RELEASE_DATE}
          aria-readonly
          readOnly
        />
      </SelectedValue>
    )
  }, [fieldVisibility, isAlbum, isUnlisted, trackReleaseDate])

  return (
    <>
      <ContextualMenu
        label={messages.title}
        description={messages.description}
        icon={<IconVisibilityPublic className={styles.titleIcon} />}
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(timeValidationSchema)}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={onSubmit}
        // upload case is initially unlisted
        menuFields={
          <Flex direction='column' gap='l'>
            <Text variant='body'>{messages.description}</Text>
            <ReleaseDateRadioItems
              isInitiallyUnlisted={true}
              initialReleaseDate={trackReleaseDate}
              isAlbum={isAlbum}
            />
          </Flex>
        }
        renderValue={renderValue}
      />
    </>
  )
}

export const mergeDateTimeValues = (
  day: string,
  time: string,
  meridian: string
) => {
  const truncatedReleaseDate = moment(day).startOf('day')
  const hour = parseInt(time.split(':')[0])
  let adjustedHours = hour

  if (meridian === 'PM' && hour < 12) {
    adjustedHours += 12
  } else if (meridian === 'AM' && hour === 12) {
    adjustedHours = 0
  }
  const combinedDateTime = truncatedReleaseDate
    .add(adjustedHours, 'hours')
    .add(time.split(':')[1], 'minutes')

  return combinedDateTime
}

export const ReleaseDateRadioItems = (props: ReleaseDateRadioProps) => {
  const { isAlbum, isInitiallyUnlisted } = props
  const [releaseDateTypeField] = useField(RELEASE_DATE_TYPE)

  // const {
  //   disableHidden
  // } = useAccessAndRemixSettings({
  //   isUpload: !!isUpload,
  //   isRemix,
  //   isAlbum,
  //   initialStreamConditions: initialStreamConditions ?? null,
  //   isInitiallyUnlisted: !!isInitiallyUnlisted,
  //   isScheduledRelease: !!isScheduledRelease,
  //   isPublishDisabled
  // })

  return (
    <>
      <RadioGroup
        {...releaseDateTypeField}
        defaultValue={releaseDateTypeField.value ?? VisibilityType.PUBLIC}
      >
        <ModalRadioItem
          value={VisibilityType.PUBLIC}
          label='Public'
          disabled={!isInitiallyUnlisted}
        />
        {!isAlbum ? (
          <ModalRadioItem
            icon={<IconVisibilityHidden />}
            label='Hidden'
            value={VisibilityType.HIDDEN}
            description={
              isAlbum
                ? messages.hiddenSubtitleAlbums
                : messages.hiddenSubtitleTracks
            }
            // TODO: determine when to disable hidden
            // disabled={disableHidden}
            checkedContent={isAlbum ? null : <HiddenAvailabilityFields />}
          />
        ) : null}
        <ModalRadioItem
          value={VisibilityType.SCHEDULED_RELEASE}
          label='Scheduled Release'
          description={messages.releaseDate}
        />
      </RadioGroup>
      <SelectReleaseDate {...props} />
    </>
  )
}
export const SelectReleaseDate = (props: ReleaseDateRadioProps) => {
  const { isInitiallyUnlisted, initialReleaseDate } = props

  const [releaseDateTypeField] = useField(RELEASE_DATE_TYPE)
  const [, , { setValue: setReleaseDateHour }] = useField(RELEASE_DATE_HOUR)
  const [, , { setValue: setTrackReleaseDate }] =
    useTrackField<ReleaseDateValue>(RELEASE_DATE)
  const [, , { setValue: setReleaseDateMeridian }] = useField(
    RELEASE_DATE_MERIDIAN
  )

  const [releaseDateField, ,] = useField(RELEASE_DATE)

  const [timePeriod, setTimePeriod] = useState(TimePeriodType.PRESENT)
  useEffect(() => {
    if (releaseDateField.value === undefined) {
      return
    }
    const truncatedReleaseDate = moment(releaseDateField.value)
    const today = moment().startOf('day')

    if (moment(truncatedReleaseDate).isBefore(today)) {
      setTimePeriod(TimePeriodType.PAST)
    } else if (
      moment(truncatedReleaseDate).isAfter(today) &&
      initialReleaseDate !== releaseDateField.value
    ) {
      setTimePeriod(TimePeriodType.FUTURE)
      setReleaseDateHour('12:00')
      setReleaseDateMeridian('AM')
    } else {
      setTimePeriod(TimePeriodType.PRESENT)
    }
  }, [
    initialReleaseDate,
    releaseDateField.value,
    setReleaseDateHour,
    setReleaseDateMeridian,
    setTrackReleaseDate
  ])

  return (
    <>
      {releaseDateTypeField?.value === VisibilityType.SCHEDULED_RELEASE && (
        <div
          className={cn(
            styles.dropdownRow,
            layoutStyles.row,
            layoutStyles.gap2,
            styles.releaseDateTimePicker
          )}
        >
          <div className={styles.datePicker}>
            <DatePickerField
              isInitiallyUnlisted={isInitiallyUnlisted}
              name={RELEASE_DATE}
              label={messages.title}
            />
          </div>
          {timePeriod !== TimePeriodType.PAST && isInitiallyUnlisted && (
            <>
              <HarmonyTextField
                name={RELEASE_DATE_HOUR}
                label={'Time'}
                placeholder={'12:00'}
                hideLabel={false}
                inputRootClassName={styles.hourInput}
                transformValueOnBlur={(value) => {
                  if (value.includes(':')) {
                    return value
                  }
                  // add :00 if it's missing
                  const number = parseInt(value, 10)
                  if (!isNaN(number) && number >= 1 && number <= 12) {
                    return `${number}:00`
                  }
                  return value
                }}
              />
              <SelectMeridianField />
            </>
          )}
        </div>
      )}
      {releaseDateTypeField.value === VisibilityType.SCHEDULED_RELEASE ? (
        <ModalContent className={styles.releaseDateHint}>
          <Hint icon={IconInfo}>
            {timePeriod === TimePeriodType.PAST
              ? messages.pastReleaseHint
              : messages.futureReleaseHint(getLocalTimezone())}
          </Hint>
        </ModalContent>
      ) : null}
    </>
  )
}

export const SelectMeridianField = () => {
  return (
    <DropdownField
      placeholder={ReleaseDateMeridian.AM}
      mount='parent'
      menu={{ items: [ReleaseDateMeridian.AM, ReleaseDateMeridian.PM] }}
      size='large'
      name={RELEASE_DATE_MERIDIAN}
      dropdownInputStyle={styles.meridianDropdownInput}
    />
  )
}
