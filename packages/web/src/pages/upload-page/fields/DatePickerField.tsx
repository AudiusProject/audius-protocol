import 'react-dates/initialize'
import 'react-dates/lib/css/_datepicker.css'

import { useEffect, useRef, useState } from 'react'

import { Popup } from '@audius/stems'
import { Origin } from '@audius/stems/dist/components/Popup/types'
import cn from 'classnames'
import { useField } from 'formik'
import moment from 'moment'
import {
  isInclusivelyBeforeDay,
  DayPickerSingleDateController
} from 'react-dates'

import { IconCalendarMonth as IconCalendar } from '@audius/harmony'

import styles from './DatePickerField.module.css'

type DatePickerFieldProps = {
  name: string
  label: string
  style?: string
  shouldFocus?: boolean
  isInitiallyUnlisted?: boolean
}

export const DatePickerField = (props: DatePickerFieldProps) => {
  const { name, label, style, shouldFocus, isInitiallyUnlisted } = props
  const [field, , helpers] = useField<string | undefined>(name)
  const [isFocused, setIsFocused] = useState(false)
  const anchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => setIsFocused(shouldFocus ?? false), [shouldFocus])

  const anchorOrigin: Origin = { vertical: 'top', horizontal: 'center' }

  return (
    <>
      <div
        ref={anchorRef}
        aria-haspopup
        role='button'
        tabIndex={0}
        className={styles.datePickerField}
        onClick={() => setIsFocused(true)}
      >
        <IconCalendar className={styles.iconCalendar} />
        <div>
          <div className={styles.label}>{label}</div>
          <input
            className={styles.input}
            name={name}
            value={moment(field.value).format('L')}
            aria-readonly
            readOnly
          />
          <div className={styles.displayValue}>
            {moment(field.value).calendar().split(' at')[0]}
          </div>
        </div>
      </div>
      <Popup
        anchorRef={anchorRef}
        isVisible={isFocused}
        onClose={() => setIsFocused(false)}
        anchorOrigin={anchorOrigin}
      >
        <div className={cn(styles.datePicker, style)}>
          <DayPickerSingleDateController
            // @ts-ignore todo: upgrade moment
            date={moment(field.value)}
            onDateChange={(value) => {
              helpers.setValue(value?.toString())
            }}
            isOutsideRange={(day) => {
              if (isInitiallyUnlisted) {
                return !isInclusivelyBeforeDay(day, moment().add(1, 'year'))
              } else {
                // @ts-ignore mismatched moment versions; shouldn't be relevant here
                return !isInclusivelyBeforeDay(day, moment())
              }
            }}
            focused={isFocused}
            isFocused={isFocused}
            onFocusChange={({ focused }) => setIsFocused(focused)}
            // @ts-ignore mismatched moment versions; shouldn't be relevant here
            initialVisibleMonth={() => moment()} // PropTypes.func or null,
            hideKeyboardShortcutsPanel
            noBorder
          />
        </div>
      </Popup>
    </>
  )
}
