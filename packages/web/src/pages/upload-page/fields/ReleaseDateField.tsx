import { SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { IconCalendar, RadioButtonGroup, RadioGroupContext, ModalContent } from '@audius/stems'
import layoutStyles from 'components/layout/layout.module.css'

import cn from 'classnames'
import moment from 'moment'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'
import Info, { IconInfo, } from '@audius/harmony'
import {
  ContextualMenu,
  SelectedValue
} from 'components/data-entry/ContextualMenu'
import { Text } from 'components/typography'

import { useTrackField } from '../hooks'
import { SingleTrackEditValues } from '../types'

import { DatePickerField } from './DatePickerField'
import styles from './ReleaseDateField.module.css'
import { truncate } from 'fs'
import { useField, useFormikContext } from 'formik'
import { select } from 'typed-redux-saga'
import { HelpCallout } from 'components/help-callout/HelpCallout'
import { DropdownField, DropdownFieldProps } from 'components/form-fields'
import { HarmonyTextField } from 'components/form-fields/HarmonyTextField'
import { AVAILABILITY_TYPE } from './AccessAndSaleField'
import { release } from 'os'
import Select from 'antd/lib/select'
import { getScheduledReleaseLabelMessage } from 'utils/dateUtils'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

const messages = {
  title: 'Release Date',
  description:
    'Specify a release date for your music or schedule it to be released in the future. Release date affects sorting on your profile and is visible in track details.',
  callout: (timePeriod: TimePeriodType) => {
    if (timePeriod === TimePeriodType.PAST) {
      return (<>
        Setting a release date in the past will impact the order tracks appear on your profile.
      </>)
    } else {
      return (<>
        Your scheduled track will become live on Audius on the date and time you’ve chosen above in your time zone.
      </>)
    }
  }
}

const RELEASE_DATE = 'release_date'
const RELEASE_DATE_HOUR = 'release_date_hour'
const RELEASE_DATE_MERIDIAN = 'release_date_meridian'
const RELEASE_DATE_TYPE = 'release_date_type'

export type ReleaseDateFormValues = {
  [RELEASE_DATE]: string | undefined,
  [RELEASE_DATE_HOUR]: string | undefined,
  [RELEASE_DATE_MERIDIAN]: string | undefined,
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
  release_date_hour: z.string()
    .refine((value) => /^([0-9]|0[1-9]|1[0-2]):([0-5][0-9])$/.test(value), {
      message: "Invalid time."
    })
});
type ReleaseDateValue = SingleTrackEditValues[typeof RELEASE_DATE]

export const ReleaseDateField = () => {
  const [releaseDateField, , { setValue: setReleaseDate }] = useTrackField<ReleaseDateValue>(RELEASE_DATE)
  const releaseDate = releaseDateField.value
  const [releaseDateTypeField, , { setValue: setReleaseDateType }] = useField(RELEASE_DATE_TYPE)
  const releaseDateType = releaseDateTypeField.value

  const [{ value: releaseDateHour }, , { setValue: setReleaseDateHour }] = useField(RELEASE_DATE)
  const [{ value: releaseDateMeridian }, , { setValue: setReleaseDateMeridian }] = useField(RELEASE_DATE_MERIDIAN)

  const roundUpHour = moment().add(2, 'hours').minutes(0).seconds(0)
  const initialValues = useMemo(
    () => ({ [RELEASE_DATE]: releaseDate ?? undefined, [RELEASE_DATE_HOUR]: (releaseDateHour ?? roundUpHour.format('H:mm')), [RELEASE_DATE_MERIDIAN]: releaseDateMeridian ?? roundUpHour.format('A'), [RELEASE_DATE_TYPE]: releaseDateType ?? false }),
    [releaseDate, releaseDateType, releaseDateHour, releaseDateMeridian]
  )

  const onSubmit = useCallback(
    (values: ReleaseDateFormValues) => {
      console.log('asdf onSubmit values: ', values)
      if (values[RELEASE_DATE_TYPE] === ReleaseDateType.RELEASE_NOW) {
        console.log('asdf no release date nullifying releaseDate')
        setReleaseDate(null)
        return
      }
      const releaseDateValue = values[RELEASE_DATE]
      console.log('asdf onsubmit values: ', values)
      const releaseDateHour = values[RELEASE_DATE_HOUR]?.split(':')[0]
      const releaseDateMeridian = values[RELEASE_DATE_MERIDIAN]

      const truncatedReleaseDate = moment(releaseDateValue).startOf('day');

      let adjustedHours = releaseDateHour;
      if (releaseDateMeridian === 'PM' && releaseDateHour < 12) {
        adjustedHours += 12;
      } else if (releaseDateMeridian === 'AM' && releaseDateHour === 12) {
        adjustedHours = 0;
      }
      console.log('asdf adjustedHours: ', adjustedHours)
      const combinedDateTime = truncatedReleaseDate
        .add(adjustedHours, 'hours')
      console.log('asdf combinedDateTime: ', combinedDateTime.toString())

      setReleaseDate(combinedDateTime.toString() ?? null)
      setReleaseDateType(values[RELEASE_DATE_TYPE])
      setReleaseDateHour(values[RELEASE_DATE_HOUR])
      setReleaseDateMeridian(values[RELEASE_DATE_MERIDIAN])
      // set other fields
    },
    [setReleaseDate]
  )

  const renderValue = useCallback(() => {
    return (
      <SelectedValue
        label={
          getScheduledReleaseLabelMessage(releaseDate, 'Scheduled for ')
        }
        icon={IconCalendar}
      >
        <input
          className={styles.input}
          name={RELEASE_DATE}
          value={"hello"
          }
          aria-readonly
          readOnly
        />
      </SelectedValue>
    )
  }, [releaseDate])


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
              <RadioItems releaseDateTypeField={releaseDateTypeField} releaseDateField={releaseDateField} />
            </div>

          </>
        }
        renderValue={renderValue}
      />
    </>
  )
}


const RadioItems = (props: any) => {

  const { releaseDateTypeField } = props
  console.log('asdf releaseDateTypeField: ', releaseDateTypeField)
  const [releaseDateField, ,] = useField(RELEASE_DATE)

  const [timePeriod, setTimePeriod] = useState(TimePeriodType.PAST)

  console.log('asdf RadioItems releaseDate: ', releaseDateField.value)

  useEffect(() => {
    const truncatedReleaseDate = moment(releaseDateField.value).startOf('day');

    const today = moment().startOf('day');
    console.log('asdf radioitem date changed: ', releaseDateField, today)

    if (moment(truncatedReleaseDate).isBefore(today)) {
      console.log('asdf radioitems setTimePeriod to past')
      setTimePeriod(TimePeriodType.PAST)
    } else if (moment(truncatedReleaseDate).isAfter(today)) {
      setTimePeriod(TimePeriodType.FUTURE)
    } else {
      setTimePeriod(TimePeriodType.PRESENT)
    }
    console.log('asdf radioitems timePeriod: ', timePeriod)

  }, [releaseDateField])

  return (
    <>
      <RadioButtonGroup
        {...releaseDateTypeField}
        className={styles.radioGroup}
        defaultValue={releaseDateTypeField.value ?? ReleaseDateType.RELEASE_NOW}
      >
        <ModalRadioItem
          value={ReleaseDateType.RELEASE_NOW}
          label="Release Immediately" />
        <ModalRadioItem
          value={ReleaseDateType.SCHEDULED_RELEASE}
          label="Select a release date"
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
                <DatePickerField name={RELEASE_DATE} label={messages.title} shouldFocus={releaseDateTypeField.value === ReleaseDateType.SCHEDULED_RELEASE} />
              </div>
              {(timePeriod !== TimePeriodType.PAST) && (
                <>
                  <HarmonyTextField
                    name={RELEASE_DATE_HOUR}
                    label={'Time'}
                    placeholder={'12:00'}
                    hideLabel={false}
                    inputRootClassName={styles.hourInput}
                    transformBlurValue={(value) => {
                      console.log('asdf transforming')
                      // add :00 if it's missing
                      const number = parseInt(value, 10)
                      if (!isNaN(number) && number >= 1 && number <= 12) {
                        return `${number}:00`
                      }
                      return value;
                    }}
                  />
                  <SelectMeridianField />
                </>
              )}

            </div>
      )}
      <ModalContent className={styles.releaseDateHint}>
        <HelpCallout icon={<IconInfo />} content={messages.callout(timePeriod)} />
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
