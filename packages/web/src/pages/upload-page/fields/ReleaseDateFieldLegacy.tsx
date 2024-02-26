import { useCallback, useMemo } from 'react'

import { IconCalendarMonth, Text } from '@audius/harmony'
import cn from 'classnames'
import moment from 'moment'

import {
  ContextualMenu,
  SelectedValue
} from 'components/data-entry/ContextualMenu'

import { useTrackField } from '../hooks'
import { SingleTrackEditValues } from '../types'

import { DatePickerField } from './DatePickerField'
import styles from './ReleaseDateFieldLegacy.module.css'
const messages = {
  title: 'Release Date',
  description:
    'Specify a release date (in the past) for your music. Release date will affect the order of content on your profile and is visible to users.'
}

const RELEASE_DATE = 'release_date'

export type ReleaseDateFormValues = {
  [RELEASE_DATE]: string | undefined
}

type ReleaseDateValue = SingleTrackEditValues[typeof RELEASE_DATE]

export const ReleaseDateFieldLegacy = () => {
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
        icon={IconCalendarMonth}
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
      icon={<IconCalendarMonth className={styles.titleIcon} />}
      initialValues={initialValues}
      onSubmit={onSubmit}
      menuFields={
        <>
          <Text
            className={cn(styles.title, styles.modalHeading)}
            variant='title'
            size='l'
          >
            {messages.title}
          </Text>
          <Text>{messages.description}</Text>
          <div className={styles.datePicker}>
            <DatePickerField name={RELEASE_DATE} label={messages.title} />
          </div>
        </>
      }
      renderValue={renderValue}
    />
  )
}
