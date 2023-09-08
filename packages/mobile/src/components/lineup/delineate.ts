import { groupBy } from 'lodash'
import moment from 'moment'

import type { LineupItem } from './types'

const NOW = moment()
const START_OF_DAY = moment(NOW).startOf('day')
const START_OF_YESTERDAY = moment(NOW).subtract(1, 'days').startOf('day')
const START_OF_WEEK = moment(NOW).startOf('week')
const START_OF_LAST_WEEK = moment(NOW).subtract(1, 'week').startOf('week')
const START_OF_MONTH = moment(NOW).startOf('month')

const Delineations = Object.freeze({
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  EARLIER_THIS_WEEK: 'earlier this week',
  LAST_WEEK: 'last week',
  EARLIER_THIS_MONTH: 'earlier this month'
})

const getLineupItemGroup = ({ activityTimestamp }: LineupItem) => {
  const time = moment(activityTimestamp)
  if (time > START_OF_DAY) {
    return Delineations.TODAY
  }
  if (time > START_OF_YESTERDAY) {
    return Delineations.YESTERDAY
  }
  if (time > START_OF_WEEK) {
    return Delineations.EARLIER_THIS_WEEK
  }
  if (time > START_OF_LAST_WEEK) {
    return Delineations.LAST_WEEK
  }
  if (time > START_OF_MONTH) {
    return Delineations.EARLIER_THIS_MONTH
  }

  const startOfMonth = moment(time).startOf('month')
  if (startOfMonth.year() === NOW.year()) {
    return startOfMonth.format('MMMM')
  }
  return startOfMonth.format('MMMM YYYY')
}

export const delineateByTime = (entries: LineupItem[]) => {
  return Object.entries(groupBy<LineupItem>(entries, getLineupItemGroup)).map(
    ([title, data], index) => {
      // For the first group, prevent delineator from being displayed
      return index === 0
        ? { delineate: false, data }
        : { delineate: true, title, data }
    }
  )
}
