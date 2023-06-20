import 'react-dates/initialize'
import 'react-dates/lib/css/_datepicker.css'

import { useState } from 'react'

import cn from 'classnames'
import { useField } from 'formik'
import moment from 'moment'
import { SingleDatePicker, isInclusivelyBeforeDay } from 'react-dates'

import { ReactComponent as IconCalendar } from 'assets/img/iconCalendar.svg'

import styles from './DatePickerField.module.css'

type DatePickerFieldProps = {
  name: string
  label: string
  style?: string
}

export const DatePickerField = (props: DatePickerFieldProps) => {
  const { name, label, style } = props
  const [field, , helpers] = useField(name)
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={styles.datePickerField} onClick={() => setIsFocused(true)}>
      <IconCalendar className={styles.iconCalendar} />
      <div>
        <div className={styles.label}>{label}</div>
        <div className={cn(styles.datePicker, style)}>
          <SingleDatePicker
            id={field.name}
            placeholder={moment().format('MM/DD/YYYY')}
            // @ts-ignore mismatched moment versions; shouldn't be relevant here
            isOutsideRange={(day) => !isInclusivelyBeforeDay(day, moment())}
            date={field.value}
            onDateChange={helpers.setValue}
            focused={isFocused}
            onFocusChange={({ focused }) => setIsFocused(focused)}
            numberOfMonths={1}
            hideKeyboardShortcutsPanel
            small
            noBorder
          />
        </div>
      </div>
    </div>
  )
}
