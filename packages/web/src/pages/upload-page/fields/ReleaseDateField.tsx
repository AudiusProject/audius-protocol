import { SetStateAction, useCallback, useContext, useMemo, useState } from 'react'

import { IconCalendar, RadioButtonGroup, RadioGroupContext, ModalContent } from '@audius/stems'
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
const messages = {
  title: 'Release Date',
  description:
    'Specify a release date for your music or scheduled it to be released in the future.',
  callout: (timePeriod: TimePeriodType) => {
    if (timePeriod === TimePeriodType.PAST) {
      return (<>
        Setting a release date in the past will impact the order tracks appear on your profile.
      </>)
    } else {
      return (<>
        Your scheduled track will become live on Audius on the date and time you’ve chosen above in your time zone (CST).
      </>)
    }
  }
}

const RELEASE_DATE = 'release_date'
const RELEASE_DATE_HOUR = 'release_date_hour'
const RELEASE_DATE_MERIDIAN = 'release_date_meridian'
const IS_RELEASE_NOW = 'is_release_now'

export type ReleaseDateFormValues = {
  [RELEASE_DATE]: string | undefined,
  [RELEASE_DATE_HOUR]: string | undefined,
  [RELEASE_DATE_MERIDIAN]: string | undefined
}

export enum ReleaseDateType {
  RELEASE_NOW = 'RELEASE_NOW',
  HAS_RELEASE_DATE = 'HAS_RELEASE_DATE'
}

export enum TimePeriodType {
  PAST = 'PAST',
  PRESENT = 'PRESENT',
  FUTURE = 'FUTURE'
}


type ReleaseDateValue = SingleTrackEditValues[typeof RELEASE_DATE]

export const ReleaseDateField = () => {
  const [{ value }, , { setValue }] =
    useTrackField<ReleaseDateValue>(RELEASE_DATE)

  const initialValues = useMemo(
    () => ({ [RELEASE_DATE]: value ?? undefined, [RELEASE_DATE_HOUR]: '12', [RELEASE_DATE_MERIDIAN]: 'PM' }),
    [value]
  )

  const onSubmit = useCallback(
    (values: ReleaseDateFormValues) => {
      const releaseDateValue = values[RELEASE_DATE]
      console.log('asdf onsubmit values: ', values)
      const releaseDateHour = +values[RELEASE_DATE_HOUR]
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

      setValue(combinedDateTime ?? null)
    },
    [setValue]
  )


  const renderValue = useCallback(() => {
    return (
      <SelectedValue
        label={
          moment(value ?? undefined)
            .calendar()
            .split(' at')[0]
        }
        icon={IconCalendar}
      >
        <input
          className={styles.input}
          name={RELEASE_DATE}
          value={moment(value ?? undefined).format('L')}
          aria-readonly
          readOnly
        />
      </SelectedValue>
    )
  }, [value])


  return (
    <ContextualMenu
      label={messages.title}
      description={messages.description}
      icon={<IconCalendar className={styles.titleIcon} />}
      initialValues={initialValues}
      onSubmit={onSubmit}
      menuFields={
        <>
          <Text
            className={cn(styles.title, styles.modalHeading)}
            variant='title'
            size='large'
          >
            {messages.title}
          </Text>
          <Text>{messages.description} Release date affects sorting on your profile and is visible in track details.</Text>
          <RadioItems />

        </>
      }
      renderValue={renderValue}
    />
  )
}



const RadioItems = () => {
  const [isReleaseNowField, ,] = useField(IS_RELEASE_NOW)
  const [{ value: releaseDateField }, ,] = useField(RELEASE_DATE)

  const truncatedReleaseDate = moment(releaseDateField).startOf('day');

  const today = moment().startOf('day');
  let timePeriod: TimePeriodType

  if (moment(truncatedReleaseDate).isBefore(today)) {
    timePeriod = TimePeriodType.PAST
  } else if (moment(truncatedReleaseDate).isAfter(today)) {
    timePeriod = TimePeriodType.FUTURE
  } else {
    timePeriod = TimePeriodType.PRESENT
  }


  return (
    <RadioButtonGroup
      className={styles.radioGroup}
      defaultValue={ReleaseDateType.RELEASE_NOW}
    >

      <ModalRadioItem
        value={ReleaseDateType.RELEASE_NOW}
        label="Release Immediately" />
      <ModalRadioItem
        value={ReleaseDateType.HAS_RELEASE_DATE}
        label="Select a release date"
        checkedContent={
          <>
            <div className={styles.datePicker}>
              <DatePickerField name={RELEASE_DATE} label={messages.title} shouldFocus={isReleaseNowField.value === ReleaseDateType.HAS_RELEASE_DATE} />
            </div>

            {timePeriod !== TimePeriodType.PAST && (
              <>
                <HarmonyTextField
                  name={RELEASE_DATE_HOUR}
                  label={'Time'}
                  placeholder={'12:00'}
                  hideLabel={false}
                />
                <SelectMeridianField name={RELEASE_DATE_MERIDIAN} />
              </>
            )

            }
            <ModalContent className={styles.content}>
              <HelpCallout icon={<IconInfo />} content={messages.callout(timePeriod)} />
            </ModalContent>
          </>
        }
      />

    </RadioButtonGroup>
  )
}

type SelectMeridianFieldProps = Partial<DropdownFieldProps> & {
  name: string
}

export const SelectMeridianField = (props: SelectMeridianFieldProps) => {
  return (
    <DropdownField
      aria-label={'label'}
      placeholder={'AM'}
      mount='parent'
      menu={{ items: ['AM', 'PM'] }}
      size='large'
      defaultValue='AM'
      {...props}
    />
  )
}
