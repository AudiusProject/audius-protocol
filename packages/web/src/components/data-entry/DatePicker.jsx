import 'react-dates/initialize'
import 'react-dates/lib/css/_datepicker.css'
import { useState, useEffect } from 'react'

import { IconCalendarMonth } from '@audius/harmony'
import cn from 'classnames'
import moment from 'moment'
import PropTypes from 'prop-types'
import { SingleDatePicker, isInclusivelyBeforeDay } from 'react-dates'

import styles from './DatePicker.module.css'

const MIN_DATE = moment('1500-01-01')

const DatePicker = ({
  id = 'default-unique-id',
  label = 'Date',
  defaultDate = '',
  onDateChange = (date) => {}
}) => {
  const [date, setDate] = useState(defaultDate ? moment(defaultDate) : moment())
  const [focused, setFocused] = useState(false)
  const [invalid, setInvalid] = useState(false)

  const isValidDate = (date) => {
    if (!date) return false
    if (!date.isValid()) return false
    if (!isInclusivelyBeforeDay(date, moment())) return false
    if (date.isBefore(MIN_DATE)) return false
    return true
  }

  useEffect(() => {
    // Trigger an onDateChange at the beginning so that parents get the
    // default date.
    if (isValidDate(date)) {
      onDateChange(date.toString())
    }
  }, [date, onDateChange])

  const handleDateChange = (newDate) => {
    let isInvalid = false
    if (!isValidDate(newDate)) {
      isInvalid = true
    }
    onDateChange(newDate ? newDate.toString() : null, isInvalid)
    setDate(newDate)
    setInvalid(isInvalid)
  }

  const style = {
    [styles.invalid]: invalid,
    [styles.focused]: focused
  }

  return (
    <div>
      <div className={styles.label}>{label}</div>
      <div className={cn(styles.datePicker, style)}>
        <SingleDatePicker
          id={id}
          placeholder={moment().format('MM/DD/YYYY')}
          // Restrict date picker to days before today.
          isOutsideRange={(day) => !isInclusivelyBeforeDay(day, moment())}
          date={date}
          onDateChange={handleDateChange}
          focused={focused}
          onFocusChange={({ focused }) => setFocused(focused)}
          numberOfMonths={1}
          hideKeyboardShortcutsPanel
          customInputIcon={
            <IconCalendarMonth className={styles.iconCalendar} />
          }
          small
        />
      </div>
    </div>
  )
}

DatePicker.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  defaultDate: PropTypes.string,
  onDateChange: PropTypes.func
}

export default DatePicker
