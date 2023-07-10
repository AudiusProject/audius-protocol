import { useCallback, useMemo } from 'react'

import { IconCalendar } from '@audius/stems'
import cn from 'classnames'
import { Formik, useField } from 'formik'
import { get, set } from 'lodash'
import moment from 'moment'

import { EditFormValues } from '../components/EditPageNew'
import { DatePickerField } from '../fields/DatePickerField'
import { ModalField } from '../fields/ModalField'

import styles from './ReleaseDateModalForm.module.css'
const messages = {
  title: 'Release Date',
  description:
    'Specify a release date (in the past) for your music. Release date will affect the order of content on your profile and is visible to users.'
}

const RELEASE_DATE = 'releaseDate'

export type ReleaseDateFormValues = {
  [RELEASE_DATE]: moment.Moment
}

/**
 * This is a subform that expects to exist within a parent TrackEdit form.
 * The useField calls reference the outer form's fields which much match the name constants.
 */
export const ReleaseDateModalForm = () => {
  // Field from the outer form
  const [{ value }, , { setValue }] =
    useField<EditFormValues[typeof RELEASE_DATE]>(RELEASE_DATE)

  const initialValues = useMemo(() => {
    const initialValues = {}
    set(initialValues, RELEASE_DATE, value)
    return initialValues as ReleaseDateFormValues
  }, [value])

  const onSubmit = useCallback(
    (values: ReleaseDateFormValues) => {
      setValue(get(values, RELEASE_DATE))
    },
    [setValue]
  )

  const preview = (
    <div className={styles.preview}>
      <div className={styles.header}>
        <label className={styles.title}>{messages.title}</label>
      </div>
      <div className={styles.description}>{messages.description}</div>
      <div className={styles.valueDisplay}>
        <IconCalendar className={styles.calendarIcon} />
        <input
          className={styles.input}
          name={RELEASE_DATE}
          value={moment(value).format('L')}
          aria-readonly
          readOnly
        />{' '}
        <div>{moment(value).calendar().split(' at')[0]}</div>
      </div>
    </div>
  )

  return (
    <Formik<ReleaseDateFormValues>
      initialValues={initialValues}
      onSubmit={onSubmit}
      enableReinitialize
    >
      <ModalField
        title={messages.title}
        icon={<IconCalendar className={styles.titleIcon} />}
        preview={preview}
      >
        <h3 className={cn(styles.title, styles.modalHeading)}>
          {messages.title}
        </h3>
        <p className={styles.description}>{messages.description}</p>
        <div className={styles.datePicker}>
          <DatePickerField name={RELEASE_DATE} label={messages.title} />
        </div>
      </ModalField>
    </Formik>
  )
}
