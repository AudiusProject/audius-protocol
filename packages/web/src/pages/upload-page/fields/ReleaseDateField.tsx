import { useCallback, useEffect, useMemo, useState } from 'react'

import { getLocalTimezone } from '@audius/common/utils'
import {
  ModalContent,
  IconInfo,
  Flex,
  IconCalendarMonth,
  RadioGroup
} from '@audius/harmony'
import cn from 'classnames'
import { useField } from 'formik'
import moment from 'moment'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  ContextualMenu,
  SelectedValue
} from 'components/data-entry/ContextualMenu'
import { DropdownField } from 'components/form-fields'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { HelpCallout } from 'components/help-callout/HelpCallout'
import layoutStyles from 'components/layout/layout.module.css'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { Text } from 'components/typography'
import { formatCalendarTime } from 'utils/dateUtils'

import { useTrackField } from '../hooks'
import { SingleTrackEditValues } from '../types'

import { DatePickerField } from './DatePickerField'
import styles from './ReleaseDateField.module.css'
import { IS_UNLISTED } from './types'

const messages = {
  title: 'Release Date',
  description:
    'Specify a release date for your music or schedule it to be released in the future. Release date affects sorting on your profile and is visible in track details.',
  pastReleaseHint:
    'Setting a release date in the past will impact the order tracks appear on your profile.',
  futureReleaseHint: (timezone: string) =>
    `Your scheduled track will become live on Audius on the date and time you've chosen above in your time zone (${timezone}).`
}

export const RELEASE_DATE = 'release_date'
export const RELEASE_DATE_HOUR = 'release_date_hour'
export const RELEASE_DATE_MERIDIAN = 'release_date_meridian'
export const RELEASE_DATE_TYPE = 'release_date_type'
export const IS_SCHEDULED_RELEASE = 'is_scheduled_release'

export type ReleaseDateFormValues = {
  [RELEASE_DATE]: string
  [RELEASE_DATE_HOUR]: string
  [RELEASE_DATE_MERIDIAN]: string
  [RELEASE_DATE_TYPE]: string
}

export enum ReleaseDateType {
  RELEASE_NOW = 'RELEASE_NOW',
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

export const ReleaseDateField = () => {
  const [trackReleaseDateField, , { setValue: setTrackReleaseDate }] =
    useTrackField<ReleaseDateValue>(RELEASE_DATE)
  const [, , { setValue: setIsScheduledRelease }] =
    useTrackField<IsScheduledReleaseValue>(IS_SCHEDULED_RELEASE)
  const [, , { setValue: setIsUnlisted }] =
    useTrackField<IsScheduledReleaseValue>(IS_UNLISTED)

  const trackReleaseDate = trackReleaseDateField.value

  const initialValues = useMemo(() => {
    return {
      [RELEASE_DATE]: trackReleaseDate ?? moment().toString(),
      [RELEASE_DATE_HOUR]: trackReleaseDate
        ? moment(trackReleaseDate).format('h:mm')
        : moment().format('h:mm'),
      [RELEASE_DATE_MERIDIAN]: trackReleaseDate
        ? moment(trackReleaseDate).format('A')
        : moment().format('A'),
      [RELEASE_DATE_TYPE]: trackReleaseDate
        ? ReleaseDateType.SCHEDULED_RELEASE
        : ReleaseDateType.RELEASE_NOW
    }
  }, [trackReleaseDate])
  const onSubmit = useCallback(
    (values: ReleaseDateFormValues) => {
      if (values[RELEASE_DATE_TYPE] === ReleaseDateType.RELEASE_NOW) {
        setTrackReleaseDate(null)
        setIsScheduledRelease(false)
        setIsUnlisted(false)
        return
      }
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
    },
    [setTrackReleaseDate, setIsScheduledRelease, setIsUnlisted]
  )

  const renderValue = useCallback(() => {
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
  }, [trackReleaseDate])

  return (
    <>
      <ContextualMenu
        label={messages.title}
        description={messages.description}
        icon={<IconCalendarMonth className={styles.titleIcon} />}
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(timeValidationSchema)}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={onSubmit}
        // upload case is initially unlisted
        menuFields={
          <Flex direction='column' gap='l'>
            <Text>{messages.description}</Text>
            <ReleaseDateRadioItems
              isInitiallyUnlisted={true}
              initialReleaseDate={trackReleaseDate}
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
  const [releaseDateTypeField] = useField(RELEASE_DATE_TYPE)

  return (
    <>
      <RadioGroup
        {...releaseDateTypeField}
        defaultValue={releaseDateTypeField.value ?? ReleaseDateType.RELEASE_NOW}
      >
        <ModalRadioItem
          value={ReleaseDateType.RELEASE_NOW}
          label='Release Immediately'
          disabled={!props.isInitiallyUnlisted}
        />
        <ModalRadioItem
          value={ReleaseDateType.SCHEDULED_RELEASE}
          label='Select a Release Date'
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
      {releaseDateTypeField?.value === ReleaseDateType.SCHEDULED_RELEASE && (
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
      {releaseDateTypeField.value === ReleaseDateType.SCHEDULED_RELEASE ? (
        <ModalContent className={styles.releaseDateHint}>
          <HelpCallout
            icon={<IconInfo />}
            content={
              timePeriod === TimePeriodType.PAST
                ? messages.pastReleaseHint
                : messages.futureReleaseHint(getLocalTimezone())
            }
          />
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
