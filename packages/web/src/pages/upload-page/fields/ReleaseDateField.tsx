import { useCallback, useMemo } from 'react'

import { IconCalendar } from '@audius/stems'
import cn from 'classnames'
import moment from 'moment'

import {
  ContextualMenu,
  SelectedValue
} from 'components/data-entry/ContextualMenu'
import { Text } from 'components/typography'

import { useTrackField } from '../hooks'
import { SingleTrackEditValues } from '../types'

import { DatePickerField } from './DatePickerField'
import styles from './ReleaseDateField.module.css'
const messages = {
  title: 'Release Date',
  description:
    'Specify a release date (in the past) for your music. Release date will affect the order of content on your profile and is visible to users.'
}

const RELEASE_DATE = 'releaseDate'

export type ReleaseDateFormValues = {
  [RELEASE_DATE]: moment.Moment
}

type ReleaseDateValue = SingleTrackEditValues[typeof RELEASE_DATE]

export const ReleaseDateField = () => {
  const [{ value }, , { setValue }] =
    useTrackField<ReleaseDateValue>(RELEASE_DATE)

  const initialValues = useMemo(() => ({ [RELEASE_DATE]: value }), [value])

  const onSubmit = useCallback(
    (values: ReleaseDateFormValues) => {
      const date = new Date(values[RELEASE_DATE].toString())
      // @ts-ignore - There are slight differences in the sdk and common track metadata types
      setValue(date)
    },
    [setValue]
  )

  const renderValue = useCallback(() => {
    return (
      <SelectedValue
        label={moment(value).calendar().split(' at')[0]}
        icon={IconCalendar}
      >
        <input
          className={styles.input}
          name={RELEASE_DATE}
          value={moment(value).format('L')}
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
