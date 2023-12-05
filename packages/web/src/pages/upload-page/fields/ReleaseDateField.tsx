import {
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { truncate } from 'fs'
import { release } from 'os'

import Info, { IconInfo } from '@audius/harmony'
import {
  IconCalendar,
  RadioButtonGroup,
  RadioGroupContext,
  ModalContent
} from '@audius/stems'
import Select from 'antd/lib/select'
import cn from 'classnames'
import { useField, useFormikContext } from 'formik'
import moment from 'moment'
import { select } from 'typed-redux-saga'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  ContextualMenu,
  SelectedValue
} from 'components/data-entry/ContextualMenu'
import { DropdownField, DropdownFieldProps } from 'components/form-fields'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { HelpCallout } from 'components/help-callout/HelpCallout'
import layoutStyles from 'components/layout/layout.module.css'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import { Text } from 'components/typography'

import { useTrackField } from '../hooks'
import { SingleTrackEditValues } from '../types'

import { AVAILABILITY_TYPE } from './AccessAndSaleField'
import { DatePickerField } from './DatePickerField'
import styles from './ReleaseDateField.module.css'

const messages = {
  title: 'Release Date',
  description:
    'Specify a release date for your music or schedule it to be released in the future. Release date affects sorting on your profile and is visible in track details.',
  callout: (timePeriod: TimePeriodType) => {
    if (timePeriod === TimePeriodType.PAST) {
      return (
        <>
          Setting a release date in the past will impact the order tracks appear
          on your profile.
        </>
      )
    } else {
      return (
        <>
          Your scheduled track will become live on Audius on the date and time
          you’ve chosen above in your time zone.
        </>
      )
    }
  }
}

const RELEASE_DATE = 'release_date'
const RELEASE_DATE_HOUR = 'release_date_hour'
const RELEASE_DATE_MERIDIAN = 'release_date_meridian'
const RELEASE_DATE_TYPE = 'release_date_type'

export type ReleaseDateFormValues = {
  [RELEASE_DATE]: string | undefined
  [RELEASE_DATE_HOUR]: string | undefined
  [RELEASE_DATE_MERIDIAN]: string | undefined
  [RELEASE_DATE_TYPE]: string | undefined
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

const getScheduledReleaseLabelMessage = (releaseDate, prefixMessage = '') => {
  const formatReleaseMessage = (releaseDate, base) => {
    const isFutureRelease = moment(releaseDate ?? undefined).isAfter(
      moment.now()
    )
    let message = isFutureRelease ? '[' + prefixMessage + '] ' : ''
    message += base
    message += isFutureRelease ? ' @ LT' : ''
    return message
  }

  return moment(releaseDate ?? undefined).calendar(null, {
    sameDay: formatReleaseMessage(releaseDate, '[Today]'),
    nextDay: formatReleaseMessage(releaseDate, '[Tomorrow]'),
    nextWeek: formatReleaseMessage(releaseDate, 'dddd'),
    lastDay: '[Yesterday]',
    lastWeek: '[Last] dddd',
    sameElse: formatReleaseMessage(releaseDate, 'MM/DD/YYYY')
  })
}

type ReleaseDateValue = SingleTrackEditValues[typeof RELEASE_DATE]

export const ReleaseDateField = () => {
  console.log('asdf re-render')
  const [trackReleaseDateField, , { setValue: setTrackReleaseDate }] =
    useTrackField<ReleaseDateValue>(RELEASE_DATE)
  const trackReleaseDate = trackReleaseDateField.value
  const [releaseDateField, , { setValue: setReleaseDateField }] =
    useField(RELEASE_DATE)
  const releaseDate = releaseDateField.value


  const [releaseDateTypeField, , { setValue: setReleaseDateType }] =
    useField(RELEASE_DATE_TYPE)
  const releaseDateType = releaseDateTypeField.value

  const [{ value: releaseDateHour }, , { setValue: setReleaseDateHour }] =
    useField(RELEASE_DATE_HOUR)

  const [
    { value: releaseDateMeridian },
    ,
    { setValue: setReleaseDateMeridian }
  ] = useField(RELEASE_DATE_MERIDIAN)

  const roundUpHour = moment().add(1, 'hours').minutes(0).seconds(0)
  const initialValues = useMemo(
    () => {
      let releaseDateHour

      console.log('asdf initing :', trackReleaseDate, releaseDate, releaseDateType, releaseDateHour, releaseDateMeridian)
      if (trackReleaseDate) {
        releaseDateHour = moment(trackReleaseDate).format('h:mm')
      } else if (!releaseDate) {
        releaseDateHour = roundUpHour.format('h:mm')
      } else {
        releaseDateHour = '12:00'
      }


      return {
        [RELEASE_DATE]: trackReleaseDate ?? undefined,
        [RELEASE_DATE_HOUR]: releaseDateHour,
        [RELEASE_DATE_MERIDIAN]: trackReleaseDate ? moment(trackReleaseDate).format('A') : roundUpHour.format('A'),
        [RELEASE_DATE_TYPE]: releaseDateType ?? false
      }
    },
    [trackReleaseDate, releaseDate, releaseDateType, releaseDateHour, releaseDateMeridian]
  )
  console.log('asdf initialValues: ', initialValues)
  const onSubmit = useCallback(
    (values: ReleaseDateFormValues) => {
      if (values[RELEASE_DATE_TYPE] === ReleaseDateType.RELEASE_NOW) {
        setTrackReleaseDate(null)
        return
      }
      const releaseDateValue = values[RELEASE_DATE]
      const releaseDateHour = parseInt(values[RELEASE_DATE_HOUR]?.split(':')[0])
      const releaseDateMeridian = values[RELEASE_DATE_MERIDIAN]

      const truncatedReleaseDate = moment(releaseDateValue).startOf('day')

      let adjustedHours = releaseDateHour
      if (releaseDateMeridian === 'PM' && releaseDateHour < 12) {
        adjustedHours += 12
      } else if (releaseDateMeridian === 'AM' && releaseDateHour === 12) {
        adjustedHours = 0
      }
      const combinedDateTime = truncatedReleaseDate.add(adjustedHours, 'hours')

      setTrackReleaseDate(combinedDateTime.toString() ?? null)
      setReleaseDateType(values[RELEASE_DATE_TYPE])
      setReleaseDateHour(values[RELEASE_DATE_HOUR])
      setReleaseDateMeridian(values[RELEASE_DATE_MERIDIAN])
      // set other fields
    },
    [setTrackReleaseDate]
  )

  const renderValue = useCallback(() => {
    return (
      <SelectedValue
        label={getScheduledReleaseLabelMessage(trackReleaseDate, 'Scheduled for ')}
        icon={IconCalendar}
      >
        <input
          className={styles.input}
          name={RELEASE_DATE}
          value={'hello'}
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
          <>
            <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
              <Text>{messages.description}</Text>
              <RadioItems
                releaseDateTypeField={releaseDateTypeField}
                releaseDateField={trackReleaseDateField}
                setReleaseDateHour={setReleaseDateHour}
                setReleaseDateMeridian={setReleaseDateMeridian}
              />
            </div>
          </>
        }
        renderValue={renderValue}
      />
    </>
  )
}

const RadioItems = (props: any) => {
  const { releaseDateTypeField, setReleaseDateHour, setReleaseDateMeridian } =
    props
  const [releaseDateField, ,] = useField(RELEASE_DATE)

  const [timePeriod, setTimePeriod] = useState(TimePeriodType.PRESENT)

  useEffect(() => {
    if (releaseDateField.value === undefined) {
      return
    }
    const truncatedReleaseDate = moment(releaseDateField.value).startOf('day')
    console.log('asdf reseting: ', truncatedReleaseDate, timePeriod)

    const today = moment().startOf('day')

    if (moment(truncatedReleaseDate).isBefore(today)) {
      setTimePeriod(TimePeriodType.PAST)
    } else if (moment(truncatedReleaseDate).isAfter(today)) {
      console.log('asdf setting future')
      setTimePeriod(TimePeriodType.FUTURE)
      setReleaseDateHour('12:00')
      setReleaseDateMeridian(ReleaseDateMeridian.AM)
    } else {
      setTimePeriod(TimePeriodType.PRESENT)
    }
  }, [releaseDateField.value, setReleaseDateHour, setReleaseDateMeridian])

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
                transformBlurValue={(value) => {
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
      <ModalContent className={styles.releaseDateHint}>
        <HelpCallout
          icon={<IconInfo />}
          content={messages.callout(timePeriod)}
        />
      </ModalContent>
    </>
  )
}
const menu = {
  items: [ReleaseDateMeridian.AM, ReleaseDateMeridian.PM].map((meridian) => {
    const el = <p>{meridian}</p>
    return { el, text: meridian, value: meridian }
  })
}

export const SelectMeridianField = () => {
  return (
    <DropdownField
      aria-label={'label'}
      placeholder={ReleaseDateMeridian.AM}
      mount='parent'
      menu={{ items: [ReleaseDateMeridian.AM, ReleaseDateMeridian.PM] }}
      size='large'
      name={RELEASE_DATE_MERIDIAN}
      dropdownInputStyle={styles.meridianDropdownInput}
    />
  )
}
