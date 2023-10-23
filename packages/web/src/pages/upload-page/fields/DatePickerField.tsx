import 'react-dates/initialize'
import 'react-dates/lib/css/_datepicker.css'

import { useRef, useState } from 'react'

import { Popup } from '@audius/stems'
import cn from 'classnames'
import { useField } from 'formik'
import moment from 'moment'
import {
  isInclusivelyBeforeDay,
  DayPickerSingleDateController
} from 'react-dates'

import IconCalendar from 'assets/img/iconCalendar.svg'

import styles from './DatePickerField.module.css'

type DatePickerFieldProps = {
  name: string
  label: string
  style?: string
}

export const DatePickerField = (props: DatePickerFieldProps) => {
  const { name, label, style } = props
  const [field, , helpers] = useField<string | undefined>(name)
  const [isFocused, setIsFocused] = useState(false)
  const anchorRef = useRef<HTMLDivElement | null>(null)

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
      >
        <div className={cn(styles.datePicker, style)}>
          <DayPickerSingleDateController
            // @ts-ignore todo: upgrade moment
            date={moment(field.value)}
            onDateChange={(value) => helpers.setValue(value?.toString())}
            // @ts-ignore mismatched moment versions; shouldn't be relevant here
            isOutsideRange={(day) => !isInclusivelyBeforeDay(day, moment())}
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
