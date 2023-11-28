import { SetStateAction, useCallback, useContext, useMemo, useState } from 'react'

import { IconCalendar, RadioButtonGroup, RadioGroupContext } from '@audius/stems'
import cn from 'classnames'
import moment from 'moment'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'

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
const messages = {
  title: 'Release Date',
  description:
    'Specify a release date for your music or scheduled it to be released in the future.'
}

const RELEASE_DATE = 'release_date'

export type ReleaseDateFormValues = {
  [RELEASE_DATE]: string | undefined
}

export enum ReleaseDateType {
  RELEASE_NOW = 'RELEASE_NOW',
  HAS_RELEASE_DATE = 'HAS_RELEASE_DATE'
}


type ReleaseDateValue = SingleTrackEditValues[typeof RELEASE_DATE]

export const ReleaseDateField = () => {
  const [{ value }, , { setValue }] =
    useTrackField<ReleaseDateValue>(RELEASE_DATE)

  const initialValues = useMemo(
    () => ({ [RELEASE_DATE]: value ?? undefined }),
    [value]
  )

  const onSubmit = useCallback(
    (values: ReleaseDateFormValues) => {
      setValue(values[RELEASE_DATE] ?? null)
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
  const [field, ,] = useField('release-date-type')
  console.log('asdf radiotiems field: ', field)

  return (
    <RadioButtonGroup
      className={styles.radioGroup}
      {...field}
    >

      <ModalRadioItem
        value={ReleaseDateType.RELEASE_NOW}
        label="Release Immediately" />
      <ModalRadioItem
        value={ReleaseDateType.HAS_RELEASE_DATE}
        label="Select a release date"
        checkedContent={
          <div className={styles.datePicker}>
            <DatePickerField name={RELEASE_DATE} label={messages.title} shouldFocus={field.value === ReleaseDateType.HAS_RELEASE_DATE} />
          </div>
        }
      />
    </RadioButtonGroup>
  )
}
