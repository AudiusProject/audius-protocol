import 'react-dates/initialize'
import 'react-dates/lib/css/_datepicker.css'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Flex, IconCalendarMonth, Popup, Text } from '@audius/harmony'
import cn from 'classnames'
import { useField, useFormikContext } from 'formik'
import moment from 'moment'
import {
  isInclusivelyBeforeDay,
  isInclusivelyAfterDay,
  DayPickerSingleDateController
} from 'react-dates'

import styles from './DatePickerField.module.css'

type DatePickerFieldProps = {
  name: string
  label: string
  style?: string
  shouldFocus?: boolean
  isInitiallyUnlisted?: boolean
  futureDatesOnly?: boolean
  maxDate?: Date
  minDate?: Date
}

/**
 * Wrapper component for the DatePicker component that integrates with Formik.
 */
export const DatePickerField = (props: DatePickerFieldProps) => {
  const { submitCount } = useFormikContext()
  const [{ value }, { touched, error }, helpers] = useField<string | undefined>(
    props.name
  )

  const onChange = useCallback(
    (value: string) => {
      helpers.setValue(value)
      helpers.setTouched(true, false)
    },
    [helpers]
  )

  return (
    <DatePicker
      {...props}
      value={value}
      touched={touched}
      error={error}
      submitCount={submitCount}
      onChange={onChange}
    />
  )
}

type DatePickerProps = DatePickerFieldProps & {
  value?: string
  touched?: boolean
  error?: string
  submitCount?: number
  onChange: (value: string) => void
}

export const DatePicker = (props: DatePickerProps) => {
  const {
    name,
    label,
    style,
    shouldFocus,
    isInitiallyUnlisted,
    futureDatesOnly,
    maxDate,
    minDate,
    value,
    touched = false,
    error,
    submitCount = 0,
    onChange
  } = props

  const [isFocused, setIsFocused] = useState(false)
  const anchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => setIsFocused(shouldFocus ?? false), [shouldFocus])

  return (
    <Flex direction='column' gap='s'>
      <Flex
        backgroundColor='surface1'
        border='default'
        borderRadius='s'
        ph='l'
        pv='m'
        w='100%'
        css={(theme) => ({
          '&:hover': {
            borderColor: theme.color.border.strong
          }
        })}
      >
        <div
          ref={anchorRef}
          aria-haspopup
          role='button'
          tabIndex={0}
          className={styles.datePickerField}
          onClick={() => setIsFocused(true)}
        >
          <IconCalendarMonth color='subdued' className={styles.iconCalendar} />
          <div>
            <div className={cn(styles.label, { [styles.noValue]: !value })}>
              {label}
            </div>
            <input
              className={styles.input}
              name={name}
              value={moment(value).format('L')}
              aria-readonly
              readOnly
            />
            <div className={styles.displayValue}>
              {value ? moment(value).calendar().split(' at')[0] : null}
            </div>
          </div>
        </div>
        <Popup
          anchorRef={anchorRef}
          isVisible={isFocused}
          onClose={() => setIsFocused(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <div className={cn(styles.datePicker, style)}>
            <DayPickerSingleDateController
              // @ts-ignore todo: upgrade moment
              date={moment(value)}
              onDateChange={(date) => {
                onChange(date?.startOf('day').toString() ?? moment().toString())
              }}
              isOutsideRange={(day) => {
                if (maxDate && minDate) {
                  return (
                    !isInclusivelyAfterDay(day, moment(minDate)) ||
                    !isInclusivelyBeforeDay(day, moment(maxDate))
                  )
                }
                if (maxDate) {
                  return (
                    !isInclusivelyAfterDay(day, moment()) ||
                    !isInclusivelyBeforeDay(day, moment(maxDate))
                  )
                }
                if (minDate) {
                  return !isInclusivelyAfterDay(day, moment(minDate))
                }
                if (futureDatesOnly) {
                  return !isInclusivelyAfterDay(day, moment())
                } else if (isInitiallyUnlisted) {
                  return !isInclusivelyBeforeDay(day, moment().add(1, 'year'))
                } else {
                  // @ts-ignore mismatched moment versions; shouldn't be relevant here
                  return !isInclusivelyBeforeDay(day, moment())
                }
              }}
              focused={isFocused}
              isFocused={isFocused}
              onFocusChange={({ focused }) => {
                setIsFocused(focused)
              }}
              // @ts-ignore mismatched moment versions; shouldn't be relevant here
              initialVisibleMonth={() => moment()} // PropTypes.func or null,
              hideKeyboardShortcutsPanel
              noBorder
            />
          </div>
        </Popup>
      </Flex>
      {error && (touched || submitCount > 0) ? (
        <Text color='danger'>{error}</Text>
      ) : null}
    </Flex>
  )
}
