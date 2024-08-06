export type TimestampProps = {
  time: Date
}

// TODO: Probably should move these to a general util file
export const MS_IN_S = 1000
export const S_IN_MIN = 60
export const MIN_IN_HR = 60
export const HR_IN_DAY = 24
export const DAY_IN_MONTH = 30
export const MONTH_IN_YEAR = 12

export type TimeUnit = 'm' | 'h' | 'd' | 'mo' | 'y'
