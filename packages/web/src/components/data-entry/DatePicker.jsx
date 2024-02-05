import 'react-dates/initialize'
import 'react-dates/lib/css/_datepicker.css'
import { Component } from 'react'

import { IconCalendarMonth } from '@audius/harmony'
import cn from 'classnames'
import moment from 'moment'
import PropTypes from 'prop-types'
import { SingleDatePicker, isInclusivelyBeforeDay } from 'react-dates'

import styles from './DatePicker.module.css'

const MIN_DATE = moment('1500-01-01')

class DatePicker extends Component {
  state = {
    date: this.props.defaultDate ? moment(this.props.defaultDate) : moment(),
    focused: false,
    invalid: false
  }

  componentDidMount = () => {
    // Trigger an onDateChange at the beginning so that parents get the
    // default date.
    if (this.isValidDate(this.state.date)) {
      this.props.onDateChange(this.state.date.toString())
    }
  }

  isValidDate = (date) => {
    if (!date) return false
    if (!date.isValid()) return false
    if (!isInclusivelyBeforeDay(date, moment())) return false
    if (date.isBefore(MIN_DATE)) return false
    return true
  }

  onDateChange = (date) => {
    let invalid = false
    if (!this.isValidDate(date)) {
      invalid = true
    }
    this.props.onDateChange(date ? date.toString() : null, invalid)
    this.setState({ date, invalid })
  }

  render() {
    const { id, label } = this.props
    const style = {
      [styles.invalid]: this.state.invalid,
      [styles.focused]: this.state.focused
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
            date={this.state.date}
            onDateChange={this.onDateChange}
            focused={this.state.focused}
            onFocusChange={({ focused }) => this.setState({ focused })}
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
}

DatePicker.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string,
  defaultDate: PropTypes.string,
  onDateChange: PropTypes.func
}

DatePicker.defaultProps = {
  id: 'default-unique-id',
  label: 'Date',
  defaultDate: '',
  onDateChange: (date) => {}
}

export default DatePicker
