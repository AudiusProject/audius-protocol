import { useCallback, useEffect, useMemo, useState } from 'react'

import { getLocalTimezone } from '@audius/common'
import { IconInfo, Flex } from '@audius/harmony'
import { IconCalendar, RadioButtonGroup, ModalContent } from '@audius/stems'
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

const messages = {
  title: 'Release Date',
  description:
    'Specify a release date for your music or schedule it to be released in the future. Release date affects sorting on your profile and is visible in track details.',
  pastReleaseHint:
    'Setting a release date in the past will impact the order tracks appear on your profile.',
  futureReleaseHint: (timezone: string) =>
    `Your scheduled track will become live on Audius on the date and time you've chosen above in your time zone (${timezone}).`
}

const RELEASE_DATE = 'release_date'
const RELEASE_DATE_HOUR = 'release_date_hour'
const RELEASE_DATE_MERIDIAN = 'release_date_meridian'
const RELEASE_DATE_TYPE = 'release_date_type'

export type ReleaseDateFormValues = {
  [RELEASE_DATE]: string | undefined
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

const timeValidationSchema = z.object({
  release_date_hour: z
    .string()
    .refine((value) => /^([0-9]|0[1-9]|1[0-2]):([0-5][0-9])$/.test(value), {
      message: 'Invalid time.'
    })
})

type ReleaseDateValue = SingleTrackEditValues[typeof RELEASE_DATE]

export const ReleaseDateField = () => {
  const [trackReleaseDateField, , { setValue: setTrackReleaseDate }] =
    useTrackField<ReleaseDateValue>(RELEASE_DATE)
  const trackReleaseDate = trackReleaseDateField.value

  const initialValues = useMemo(() => {
    return {
      [RELEASE_DATE]: trackReleaseDate ?? undefined,
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
        return
      }
      const releaseDateValue = values[RELEASE_DATE]
      const releaseDateHour = parseInt(values[RELEASE_DATE_HOUR].split(':')[0])
      const releaseDateMeridian = values[RELEASE_DATE_MERIDIAN]

      const truncatedReleaseDate = moment(releaseDateValue).startOf('day')

      let adjustedHours = releaseDateHour
      if (releaseDateMeridian === 'PM' && releaseDateHour < 12) {
        adjustedHours += 12
      } else if (releaseDateMeridian === 'AM' && releaseDateHour === 12) {
        adjustedHours = 0
      }
      const combinedDateTime = truncatedReleaseDate
        .add(adjustedHours, 'hours')
        .add(values[RELEASE_DATE_HOUR].split(':')[1], 'minutes')

      setTrackReleaseDate(combinedDateTime.toString() ?? null)
    },
    [setTrackReleaseDate]
  )

  const renderValue = useCallback(() => {
    return (
      <SelectedValue
        label={formatCalendarTime(trackReleaseDate, 'Scheduled for ')}
        icon={IconCalendar}
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
        icon={<IconCalendar className={styles.titleIcon} />}
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(timeValidationSchema)}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={onSubmit}
        menuFields={
          <Flex direction='column' gap='l'>
            <Text>{messages.description}</Text>
            <RadioItems />
          </Flex>
        }
        renderValue={renderValue}
      />
    </>
  )
}

const RadioItems = (props: any) => {
  const [releaseDateTypeField] = useField(RELEASE_DATE_TYPE)
  const [, , { setValue: setReleaseDateHour }] = useField(RELEASE_DATE_HOUR)

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
    } else if (moment(truncatedReleaseDate).isAfter(today)) {
      setTimePeriod(TimePeriodType.FUTURE)
      setReleaseDateHour('12:00')
      setReleaseDateMeridian(ReleaseDateMeridian.AM)
    } else {
      setTimePeriod(TimePeriodType.PRESENT)
    }
  }, [releaseDateField.value, setReleaseDateHour, setReleaseDateMeridian])
  console.log('asdf timePeriod: ', timePeriod)

  return (
    <>
      <RadioButtonGroup
        {...releaseDateTypeField}
        className={styles.radioGroup}
        defaultValue={releaseDateTypeField.value ?? ReleaseDateType.RELEASE_NOW}
      >
        <ModalRadioItem
          value={ReleaseDateType.RELEASE_NOW}
          label='Release Immediately'
        />
        <ModalRadioItem
          value={ReleaseDateType.SCHEDULED_RELEASE}
          label='Select a release date'
        />
      </RadioButtonGroup>
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
              isScheduledRelease={true}
              name={RELEASE_DATE}
              label={messages.title}
              shouldFocus={
                releaseDateTypeField.value === ReleaseDateType.SCHEDULED_RELEASE
              }
            />
          </div>
          {timePeriod !== TimePeriodType.PAST && (
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
