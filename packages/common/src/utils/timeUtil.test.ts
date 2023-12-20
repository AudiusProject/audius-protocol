import moment from 'moment'

import dayjs from './dayjs'
import {
  formatSeconds,
  formatSecondsAsText,
  formatLineupTileDuration,
  formatDate,
  utcToLocalTime,
  getLocalTimezone,
  formatDateWithTimezoneOffset
} from './timeUtil'

describe('formatSeconds', () => {
  test('should correctly format seconds less than an hour', () => {
    expect(formatSeconds(90)).toBe('1:30')
  })

  test('should correctly format seconds more than an hour', () => {
    expect(formatSeconds(3661)).toBe('1:01:01')
  })
})

describe('formatSecondsAsText', () => {
  test('should correctly format seconds less than an hour', () => {
    expect(formatSecondsAsText(90)).toBe('1m 30s')
  })

  test('should correctly format seconds more than an hour', () => {
    expect(formatSecondsAsText(3661)).toBe('1h 1m')
  })
})

describe('formatLineupTileDuration', () => {
  test('should format correctly for short content less than an hour', () => {
    expect(formatLineupTileDuration(90, false)).toBe('1:30')
  })

  test('should format correctly for long content more than an hour', () => {
    expect(formatLineupTileDuration(3661, true)).toBe('1hr 2m')
  })
})

describe('formatDate', () => {
  test('should format date correctly', () => {
    expect(formatDate('2023-12-17')).toBe('12/17/23')
  })
})

describe('formatDateWithTimezoneOffset', () => {
  test('should format date correctly with mocked timezone offset', () => {
    const mockOffset = 60 * 24
    jest.spyOn(moment.prototype, 'utcOffset').mockReturnValue(mockOffset)
    const offsetFormattedDate = formatDateWithTimezoneOffset('2023-12-17')

    jest.restoreAllMocks()
    const expectedDate = '12/18/23'
    expect(offsetFormattedDate).toBe(expectedDate)
  })
})

describe('utcToLocalTime', () => {
  test('should convert UTC to local time', () => {
    const originalTimezone = dayjs.tz.guess()
    dayjs.tz.setDefault('Asia/Taipei')
    const localTime = utcToLocalTime('2023-12-17T12:00:00Z')
    expect(localTime.isValid()).toBe(true)
    expect(localTime.month()).toBe(11)
    expect(localTime.date()).toBe(17)
    expect(localTime.hour()).toBe(4)
    dayjs.tz.setDefault(originalTimezone)
  })
})

describe('getLocalTimezone', () => {
  test('should return the local timezone', () => {
    const originalTimezone = dayjs.tz.guess()
    dayjs.tz.setDefault('Asia/Taipei')
    const timezone = getLocalTimezone()
    expect(timezone).toBe('GMT+8')
    dayjs.tz.setDefault(originalTimezone)
  })
})
